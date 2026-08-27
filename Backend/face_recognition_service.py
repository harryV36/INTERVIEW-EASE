"""
Face Recognition Service for Live Video Streaming
===================================================
Handles real-time face detection, tracking, and identity verification
during interview sessions with comprehensive violation tracking.
"""

import cv2
import face_recognition
import numpy as np
import time
import os
from collections import deque
import threading
import asyncio
import json
import requests

try:
    import mediapipe as mp
    mp_face_mesh = mp.solutions.face_mesh
    face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=5)
    HAS_MEDIAPIPE = True
except Exception:
    HAS_MEDIAPIPE = False
    face_mesh = None
    print("⚠️  MediaPipe not available - using basic face detection only")

# ==================== CONFIGURATION ====================
REFERENCE_PATH_FILE = "reference_path.txt"
RECOGNITION_TOLERANCE = 0.6  # Lower = stricter matching (0.6 = more lenient)
DETECTION_MODEL = "hog"  # Use "cnn" for GPU, "hog" for CPU
TRACKER_TYPE = "kcf"
DETECTION_INTERVAL = 70  # Re-detect every 70 frames for face recognition check
VIOLATION_COOLDOWN = 5  # seconds between violation reports (less frequent)
EYE_DETECTION_THRESHOLD = 0.4  # For eye presence/movement detection
FACE_VIOLATION_COOLDOWN = 5  # seconds between face violations (longer cooldown)
NO_FACE_VIOLATION_THRESHOLD = 15  # Frames before no-face violation (changed from 30 to 15)
UNKNOWN_FACE_VIOLATION_THRESHOLD = 15  # Frames before unknown-face violation

# ==================== GLOBAL STATE ====================
active_streams = {}  # Track active camera streams per session
violation_tracking = {}  # Track violations per session


class FaceRecognitionSession:
    """Manages face recognition for a single interview session"""
    
    def __init__(self, session_id, reference_encoding=None, user_id=None):
        self.session_id = session_id
        self.reference_encoding = reference_encoding
        self.user_id = user_id  # For photo upload tracking
        self.cap = None
        self.is_running = False
        self.frame_count = 0
        self.prev_time = time.time()
        self.last_violation_time = {}
        self.violation_queue = deque(maxlen=100)
        self.last_photo_time = 0  # Track when photo was last captured
        self.photo_capture_interval = 5  # Capture photo every 5 seconds max
        
        # Tracker state
        self.trackers = {}
        self.face_ids = {}
        self.face_names = {}
        self.next_id = 0
        
        # Violation tracking
        self.no_face_frame_count = 0
        self.unknown_face_frame_count = 0
        self.violation_count = 0
        
        # Face landmarks
        self.face_landmarks = {}
        self.gaze_directions = {}
        
        # Statistics
        self.face_detected = False
        self.current_identity = "Unknown"
        self.gaze_direction = "CENTER"
        self.multiple_faces = False
        
    def initialize_camera(self, camera_index=0):
        """Initialize camera capture"""
        try:
            self.cap = cv2.VideoCapture(camera_index)
            if not self.cap.isOpened():
                print(f"❌ Cannot access camera {camera_index}")
                return False
            
            # Set camera properties for better performance
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.cap.set(cv2.CAP_PROP_FPS, 30)
            
            self.is_running = True
            print(f"✅ Camera initialized for session {self.session_id}")
            return True
        except Exception as e:
            print(f"❌ Camera initialization error: {e}")
            return False
    
    def load_reference_face(self):
        """Load reference face encoding from file"""
        try:
            if not os.path.exists(REFERENCE_PATH_FILE):
                print("⚠️  Reference face file not found")
                return False
            
            with open(REFERENCE_PATH_FILE, "r") as f:
                image_path = f.read().strip()
            
            if not os.path.exists(image_path):
                print(f"⚠️  Reference image not found: {image_path}")
                return False
            
            image = face_recognition.load_image_file(image_path)
            encodings = face_recognition.face_encodings(image)
            
            if not encodings:
                print("⚠️  No face found in reference image")
                return False
            
            self.reference_encoding = encodings[0]
            print(f"✅ Reference face loaded successfully")
            return True
        except Exception as e:
            print(f"❌ Error loading reference face: {e}")
            return False
    
    def detect_faces(self, frame):
        """Detect faces in frame and compare with reference"""
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        small_frame = cv2.resize(rgb_frame, (0, 0), fx=0.25, fy=0.25)
        
        # Detect face locations
        face_locations = face_recognition.face_locations(
            small_frame, model=DETECTION_MODEL
        )
        face_encodings = face_recognition.face_encodings(small_frame, face_locations)
        
        detected_faces = []
        
        for i, encoding in enumerate(face_encodings):
            # Scale coordinates back to original size
            top, right, bottom, left = [v * 4 for v in face_locations[i]]
            
            identity = "Unknown"
            match_distance = None
            eyes_detected = False
            
            # Compare with reference if available
            if self.reference_encoding is not None:
                distances = face_recognition.face_distance(
                    [self.reference_encoding], encoding
                )
                match_distance = distances[0]
                
                # Enhanced logging for face matching debugging
                print(f"👤 Face detection: distance={match_distance:.4f}, tolerance={RECOGNITION_TOLERANCE}")
                
                if match_distance < RECOGNITION_TOLERANCE:
                    identity = "Known"
                    print(f"✅ MATCH FOUND! Distance {match_distance:.4f} < Tolerance {RECOGNITION_TOLERANCE}")
                else:
                    print(f"❌ NO MATCH. Distance {match_distance:.4f} >= Tolerance {RECOGNITION_TOLERANCE}")
            
            # Detect eyes in face region for liveness check
            try:
                face_crop = frame[top:bottom, left:right]
                if face_crop.size > 0:
                    gray_face = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
                    # Simple eye presence check - looks for contrast regions
                    eye_cascade = cv2.CascadeClassifier(
                        cv2.data.haarcascades + 'haarcascade_eye.xml'
                    )
                    eyes = eye_cascade.detectMultiScale(gray_face, 1.3, 5)
                    eyes_detected = len(eyes) > 0
                    if eyes_detected:
                        print(f"👁️  Eyes detected in face #{i+1}")
            except Exception as e:
                print(f"⚠️  Eye detection error: {e}")
            
            detected_faces.append({
                "location": (left, top, right, bottom),
                "encoding": encoding,
                "identity": identity,
                "distance": match_distance,
                "eyes_detected": eyes_detected
            })
        
        self.multiple_faces = len(detected_faces) > 1
        self.face_detected = len(detected_faces) > 0
        
        return detected_faces
    
    def capture_and_upload_photo(self, frame, face_location):
        """Capture photo from detected face and upload to Cloudinary"""
        try:
            current_time = time.time()
            # Limit photo uploads to prevent excessive API calls
            if current_time - self.last_photo_time < self.photo_capture_interval:
                return None
            
            # Always have session_id, user_id is optional but preferable
            if not self.session_id:
                print("⚠️  Session ID needed for photo upload")
                return None
            
            # Continue with upload using available IDs
            if not self.user_id:
                self.user_id = f"user_{self.session_id[:8]}"  # Generate fallback user ID from session
            
            # Extract face region
            top, left, bottom, right = face_location
            face_crop = frame[top:bottom, left:right]
            
            if face_crop.size == 0:
                return None
            
            # Encode frame to JPEG buffer
            success, image_buffer = cv2.imencode('.jpg', face_crop)
            if not success:
                print("❌ Failed to encode image")
                return None
            
            image_bytes = image_buffer.tobytes()
            
            # Send to Node.js backend for Cloudinary upload
            try:
                # Ensure user_id is set for tracking
                user_id = self.user_id or f"user_{self.session_id[:8]}"
                
                response = requests.post(
                    "http://localhost:8000/api/scorecards/upload-face-photo",
                    json={
                        "sessionId": self.session_id,
                        "userId": user_id,
                        "imageBuffer": image_bytes.hex()
                    },
                    timeout=10
                )
                
                if response.status_code == 200:
                    result = response.json()
                    self.last_photo_time = current_time
                    print(f"✅ Photo uploaded to Cloudinary for session {self.session_id}: {result.get('url', 'N/A')}")
                    return result.get('url')
                elif response.status_code == 400:
                    error_data = response.json()
                    print(f"⚠️  Upload validation failed: {error_data.get('error', 'Unknown error')}")
                    return None
                else:
                    print(f"⚠️  Upload failed with status {response.status_code}: {response.text[:200]}")
                    return None
                    
            except Exception as e:
                print(f"⚠️  Photo upload request error: {e}")
                return None
                
        except Exception as e:
            print(f"❌ Photo capture and upload error: {e}")
            return None
    
    def select_tracker(self, tracker_type):
        """Select appropriate tracker"""
        if tracker_type == 'mosse':
            return cv2.TrackerMOSSE_create()
        elif tracker_type == 'csrt':
            return cv2.TrackerCSRT_create()
        else:
            return cv2.TrackerKCF_create()
    
    def detect_face_landmarks(self, frame, face_locations):
        """Detect face landmarks and gaze direction using MediaPipe"""
        landmarks_dict = {}
        gaze_dict = {}
        
        if not HAS_MEDIAPIPE:
            return landmarks_dict, gaze_dict
        
        try:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb_frame)
            
            if results.multi_face_landmarks and len(face_locations) > 0:
                h, w, c = frame.shape
                
                for idx, face_landmarks in enumerate(results.multi_face_landmarks[:len(face_locations)]):
                    landmarks = []
                    
                    # Extract key landmarks (eyes, nose, mouth)
                    for landmark in face_landmarks.landmark:
                        x = int(landmark.x * w)
                        y = int(landmark.y * h)
                        landmarks.append((x, y))
                    
                    landmarks_dict[idx] = landmarks
                    
                    # Detect gaze direction from eye landmarks
                    if len(landmarks) > 0:
                        # Eye indices: left eye center (468), right eye center (473)
                        left_eye_center = landmarks[468] if len(landmarks) > 468 else None
                        right_eye_center = landmarks[473] if len(landmarks) > 473 else None
                        
                        if left_eye_center and right_eye_center:
                            # Calculate eye center
                            eye_center_x = (left_eye_center[0] + right_eye_center[0]) // 2
                            eye_center_y = (left_eye_center[1] + right_eye_center[1]) // 2
                            
                            # Get face bounding box center
                            if idx < len(face_locations):
                                left, top, right, bottom = face_locations[idx]
                                face_center_x = (left + right) // 2
                                face_width = right - left
                                
                                # Determine gaze direction
                                gaze = "CENTER"
                                if eye_center_x < face_center_x - face_width // 4:
                                    gaze = "LEFT"
                                elif eye_center_x > face_center_x + face_width // 4:
                                    gaze = "RIGHT"
                                
                                gaze_dict[idx] = gaze
        except Exception as e:
            print(f"⚠️  Landmark detection error: {e}")
        
        return landmarks_dict, gaze_dict
    
    def update_trackers(self, frame):
        """Update face trackers"""
        updated_ids = {}
        
        for fid, tracker in list(self.trackers.items()):
            success, bbox = tracker.update(frame)
            if success:
                l, t, w, h = [int(v) for v in bbox]
                updated_ids[fid] = (l, t, l + w, t + h)
            else:
                # Tracker lost, remove it
                if fid in self.trackers:
                    del self.trackers[fid]
        
        self.face_ids = updated_ids
    
    def process_frame(self, frame):
        """Main frame processing pipeline"""
        self.frame_count += 1
        current_time = time.time()
        fps = 1 / (current_time - self.prev_time)
        self.prev_time = current_time
        
        # Periodic full detection
        if self.frame_count % DETECTION_INTERVAL == 0:
            detected = self.detect_faces(frame)
            
            # Check for face violations (less frequently)
            self._check_face_violations(detected)
            
            # Capture and upload photo if face detected
            if detected and len(detected) > 0:
                # Capture photo from the first detected face
                face_location = detected[0]["location"]
                photo_url = self.capture_and_upload_photo(frame, face_location)
                if photo_url:
                    # Store photo URL in violation queue for WebSocket broadcast
                    self.violation_queue.append({
                        "type": "photo_captured",
                        "timestamp": current_time,
                        "url": photo_url,
                        "message": "Face photo captured and stored"
                    })
            
            # Detect landmarks and gaze
            face_locations = [face["location"] for face in detected]
            self.face_landmarks, self.gaze_directions = self.detect_face_landmarks(frame, face_locations)
            
            # Reset trackers
            self.trackers = {}
            self.face_ids = {}
            self.face_names = {}
            self.next_id = 0
            
            # Initialize trackers for detected faces
            for face in detected:
                left, top, right, bottom = face["location"]
                tracker = self.select_tracker(TRACKER_TYPE)
                
                try:
                    tracker.init(frame, (left, top, right - left, bottom - top))
                    fid = self.next_id
                    self.next_id += 1
                    
                    self.trackers[fid] = tracker
                    self.face_ids[fid] = (left, top, right, bottom)
                    self.face_names[fid] = face["identity"]
                    
                    # Store current identity
                    if face["identity"] == "Known":
                        self.current_identity = "Known"
                except Exception as e:
                    print(f"⚠️  Tracker initialization error: {e}")
        else:
            # Update existing trackers
            self.update_trackers(frame)
        
        # Update current identity from tracked faces
        for fid in self.face_ids:
            if fid in self.face_names:
                if self.face_names[fid] == "Known":
                    self.current_identity = "Known"
        
        # Draw visualization
        self._draw_annotations(frame, fps)
        
        return frame
    
    def _check_face_violations(self, detected_faces):
        """Check for face-related security violations (less frequently)"""
        current_time = time.time()
        
        # Violation: No face detected - track frames before reporting
        if not detected_faces:
            self.no_face_frame_count += 1
            
            # Only report after threshold frames without face
            if self.no_face_frame_count >= NO_FACE_VIOLATION_THRESHOLD:
                violation_key = "no_face_detected"
                if violation_key not in self.last_violation_time:
                    self.last_violation_time[violation_key] = 0
                
                if current_time - self.last_violation_time[violation_key] > FACE_VIOLATION_COOLDOWN:
                    self.violation_count += 1
                    print(f"🚨 [FACE VIOLATION #{self.violation_count}] No face detected for {NO_FACE_VIOLATION_THRESHOLD} frames")
                    self.violation_queue.append({
                        "type": "no_face",
                        "timestamp": current_time,
                        "severity": "high",
                        "message": f"No face detected - Violation #{self.violation_count}",
                        "violation_count": self.violation_count
                    })
                    self.last_violation_time[violation_key] = current_time
        else:
            self.no_face_frame_count = 0  # Reset counter when face is detected
        
        # Violation: Multiple faces detected
        if len(detected_faces) > 1:
            violation_key = "multiple_faces"
            if violation_key not in self.last_violation_time:
                self.last_violation_time[violation_key] = 0
            
            if current_time - self.last_violation_time[violation_key] > FACE_VIOLATION_COOLDOWN:
                self.violation_count += 1
                print(f"🚨 [FACE VIOLATION #{self.violation_count}] Multiple faces detected: {len(detected_faces)}")
                self.violation_queue.append({
                    "type": "multiple_faces",
                    "timestamp": current_time,
                    "severity": "critical",
                    "message": f"Multiple faces detected - Violation #{self.violation_count}",
                    "violation_count": self.violation_count
                })
                self.last_violation_time[violation_key] = current_time
        
        # Violation: Face detected but not matching reference (Unknown)
        if detected_faces and self.reference_encoding is not None:
            unknown_detected = any(f["identity"] == "Unknown" for f in detected_faces)
            
            if unknown_detected:
                self.unknown_face_frame_count += 1
                
                # Only report after threshold frames of unknown face
                if self.unknown_face_frame_count >= UNKNOWN_FACE_VIOLATION_THRESHOLD:
                    violation_key = "unknown_face"
                    if violation_key not in self.last_violation_time:
                        self.last_violation_time[violation_key] = 0
                    
                    if current_time - self.last_violation_time[violation_key] > FACE_VIOLATION_COOLDOWN:
                        self.violation_count += 1
                        print(f"🚨 [SECURITY VIOLATION #{self.violation_count}] Unknown face detected - Adding to security status")
                        
                        # Create detailed violation with security impact
                        violation_obj = {
                            "type": "unknown_face",
                            "timestamp": current_time,
                            "severity": "critical",  # Changed from medium to critical
                            "message": f"SECURITY VIOLATION: Unknown face detected. Only the registered candidate is allowed. Violation #{self.violation_count}",
                            "violation_count": self.violation_count,
                            "security_status": "compromised",  # Add security status flag
                            "action": "add_to_security_report"
                        }
                        
                        self.violation_queue.append(violation_obj)
                        self.last_violation_time[violation_key] = current_time
            else:
                self.unknown_face_frame_count = 0  # Reset when known face detected
    
    def _draw_annotations(self, frame, fps):
        """Draw bounding boxes, landmarks, and annotations on frame"""
        # Draw face boxes and landmarks
        for fid, (left, top, right, bottom) in self.face_ids.items():
            name = self.face_names.get(fid, "Unknown")
            # GREEN for known faces, RED for unknown/no face
            color = (0, 255, 0) if name == "Known" else (0, 0, 255)
            
            # Only draw box if known face
            if name == "Known":
                cv2.rectangle(frame, (left, top), (right, bottom), color, 3)  # Green box
            else:
                cv2.rectangle(frame, (left, top), (right, bottom), (0, 0, 255), 3)  # Red box
            
            # Draw gaze direction if available
            gaze = self.gaze_directions.get(fid, "CENTER")
            label = f"✅ MATCH" if name == "Known" else f"❌ NO MATCH"
            if gaze != "CENTER":
                label += f" ({gaze})"
            
            label_color = (0, 255, 0) if name == "Known" else (0, 0, 255)
            cv2.putText(
                frame, label, (left, top - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, label_color, 2
            )
            
            # Draw face landmarks if available
            if fid in self.face_landmarks and HAS_MEDIAPIPE:
                landmarks = self.face_landmarks[fid]
                
                # Draw key facial points (every 10th point to reduce clutter)
                for i, (lx, ly) in enumerate(landmarks[::10]):
                    cv2.circle(frame, (lx, ly), 2, (0, 255, 255), -1)
                
                # Draw eyes circles (important landmarks)
                if len(landmarks) > 473:
                    left_eye = landmarks[468]
                    right_eye = landmarks[473]
                    cv2.circle(frame, left_eye, 3, (255, 0, 0), -1)
                    cv2.circle(frame, right_eye, 3, (255, 0, 0), -1)
        
        # Violation alerts with count
        if self.multiple_faces:
            alert_text = f"🚨 MULTIPLE FACES DETECTED! Violations: {self.violation_count}"
            cv2.putText(
                frame, alert_text,
                (50, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3
            )
        elif not self.face_detected:
            alert_text = f"🚨 NO FACE DETECTED! Violations: {self.violation_count}"
            cv2.putText(
                frame, alert_text,
                (50, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3
            )
        
        # Violation counter (always visible)
        violation_color = (0, 0, 255) if self.violation_count > 0 else (0, 255, 0)
        cv2.putText(
            frame, f"Violations: {self.violation_count}",
            (10, frame.shape[0] - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.8, violation_color, 2
        )
        
        # FPS counter
        cv2.putText(
            frame, f"FPS: {fps:.1f}",
            (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2
        )
        
        # Frame count and status
        status = "✅ IDENTITY MATCHED" if self.current_identity == "Known" else "⚠️ IDENTITY MISMATCH"
        status_color = (0, 255, 0) if self.current_identity == "Known" else (0, 0, 255)
        cv2.putText(
            frame, status, (10, 60),
            cv2.FONT_HERSHEY_SIMPLEX, 0.7, status_color, 2
        )
        
        # Gaze information
        if self.gaze_directions:
            for fid, gaze in self.gaze_directions.items():
                if gaze != "CENTER":
                    cv2.putText(
                        frame, f"👁️ Gaze: {gaze}",
                        (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 1
                    )
                    break
    
    def record_violation(self, violation_type, severity="warning"):
        """Record a security violation"""
        current_time = time.time()
        violation_key = f"{violation_type}_{severity}"
        
        # Check cooldown
        if violation_key in self.last_violation_time:
            if current_time - self.last_violation_time[violation_key] < VIOLATION_COOLDOWN:
                return
        
        self.last_violation_time[violation_key] = current_time
        
        violation = {
            "type": violation_type,
            "severity": severity,
            "timestamp": current_time,
            "frame": self.frame_count
        }
        
        self.violation_queue.append(violation)
        return violation
    
    def get_violations(self):
        """Get recorded violations"""
        return list(self.violation_queue)
    
    def cleanup(self):
        """Clean up resources"""
        if self.cap:
            self.cap.release()
        self.is_running = False
        self.trackers = {}
        self.face_ids = {}
        self.face_names = {}


def create_video_stream(session_id, reference_encoding=None):
    """Generator for MJPEG video stream with face detection"""
    
    try:
        session = FaceRecognitionSession(session_id, reference_encoding)
        
        if not session.initialize_camera():
            print(f"❌ Failed to initialize camera for session {session_id}")
            yield b"Error: Cannot access camera"
            return
        
        # Load reference if not provided
        if reference_encoding is None:
            session.load_reference_face()
        
        active_streams[session_id] = session
        
        while session.is_running:
            ret, frame = session.cap.read()
            if not ret:
                print(f"❌ Cannot read frame from camera (session: {session_id})")
                break
            
            # Process frame
            processed_frame = session.process_frame(frame)
            
            # Encode frame
            _, jpeg = cv2.imencode('.jpg', processed_frame)
            
            # MJPEG boundary format
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + 
                   jpeg.tobytes() + b'\r\n')
            
            # Small delay to avoid 100% CPU
            time.sleep(0.01)
    
    except Exception as e:
        print(f"❌ Video stream error (session: {session_id}): {e}")
    
    finally:
        if session_id in active_streams:
            session.cleanup()
            del active_streams[session_id]


def get_session_status(session_id):
    """Get current status of a video session"""
    if session_id not in active_streams:
        return None
    
    session = active_streams[session_id]
    return {
        "session_id": session_id,
        "face_detected": session.face_detected,
        "identity": session.current_identity,
        "multiple_faces": session.multiple_faces,
        "violation_count": session.violation_count,
        "violations": session.get_violations(),
        "frame_count": session.frame_count,
        "is_running": session.is_running
    }


def stop_session(session_id):
    """Stop a video session"""
    if session_id in active_streams:
        active_streams[session_id].cleanup()
        del active_streams[session_id]
        print(f"✅ Session {session_id} stopped")
        return True
    return False
