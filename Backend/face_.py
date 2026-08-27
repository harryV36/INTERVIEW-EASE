# import cv2
# import face_recognition
# import numpy as np
# import time
# import os

# REFERENCE_PATH_FILE = "reference_path.txt"
# RECOGNITION_TOLERANCE = 0.6
# DETECTION_MODEL = "hog"
# TRACKER_TYPE = "kcf"
# DETECTION_INTERVAL = 15

# def get_reference_path():
#     if not os.path.exists(REFERENCE_PATH_FILE):
#         print("❌ reference_path.txt not found.")
#         return None
#     with open(REFERENCE_PATH_FILE, "r") as f:
#         return f.read().strip()

# def load_reference_encoding():
#     path = get_reference_path()
#     if not path or not os.path.exists(path):
#         return None, "Unknown", False

#     try:
#         image = face_recognition.load_image_file(path)
#         encodings = face_recognition.face_encodings(image)
#         if not encodings:
#             raise ValueError("No face found.")
#         return encodings[0], "Known", True
#     except Exception as e:
#         print("❌ Failed to load face:", e)
#         return None, "Unknown", False

# def select_tracker(tracker_type):
#     if tracker_type == 'mosse':
#         return cv2.TrackerMOSSE_create()
#     elif tracker_type == 'csrt':
#         return cv2.TrackerCSRT_create()
#     return cv2.TrackerKCF_create()

# def generate_video_stream():
#     reference_encoding, reference_name, face_detected = load_reference_encoding()
#     cap = cv2.VideoCapture(0)
#     trackers, face_ids, face_names = {}, {}, {}
#     frame_count, next_id = 0, 0
#     prev_time = time.time()

#     while True:
#         ret, frame = cap.read()
#         if not ret:
#             break
#         frame_count += 1
#         fps = 1 / (time.time() - prev_time)
#         prev_time = time.time()
#         rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#         small_frame = cv2.resize(rgb_frame, (0, 0), fx=0.25, fy=0.25)

#         if frame_count % DETECTION_INTERVAL == 0:
#             locations = face_recognition.face_locations(small_frame, model=DETECTION_MODEL)
#             encodings = face_recognition.face_encodings(small_frame, locations)
#             trackers, face_ids, face_names = {}, {}, {}

#             for i, encoding in enumerate(encodings):
#                 top, right, bottom, left = [v * 4 for v in locations[i]]
#                 name = "Unknown"
#                 if face_detected:
#                     matches = face_recognition.compare_faces([reference_encoding], encoding, tolerance=RECOGNITION_TOLERANCE)
#                     name = reference_name if any(matches) else "Unknown"

#                 tracker = select_tracker(TRACKER_TYPE)
#                 tracker.init(frame, (left, top, right - left, bottom - top))
#                 fid = next_id
#                 next_id += 1
#                 trackers[fid] = tracker
#                 face_ids[fid] = (left, top, right, bottom)
#                 face_names[fid] = name
#         else:
#             updated = {}
#             for fid, tracker in trackers.items():
#                 success, bbox = tracker.update(frame)
#                 if success:
#                     l, t, w, h = [int(v) for v in bbox]
#                     updated[fid] = (l, t, l + w, t + h)
#             face_ids = updated

#         for fid, (l, t, r, b) in face_ids.items():
#             name = face_names.get(fid, "Tracking...")
#             color = (0, 255, 0) if name == reference_name else (0, 0, 255)
#             cv2.rectangle(frame, (l, t), (r, b), color, 2)
#             cv2.putText(frame, name, (l, t - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

#         cv2.putText(frame, f"FPS: {fps:.2f}", (10, 30),
#                     cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)

#         _, jpeg = cv2.imencode('.jpg', frame)
#         yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')

#     cap.release()





# import cv2
# import face_recognition
# import numpy as np
# import time
# import os
# import mediapipe as mp

# # MediaPipe Face Mesh setup
# mp_face_mesh = mp.solutions.face_mesh
# face_mesh = mp_face_mesh.FaceMesh(
#     min_detection_confidence=0.5,
#     min_tracking_confidence=0.5,
#     max_num_faces=1
# )

# # Eye landmark indices
# LEFT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
# RIGHT_EYE_INDICES = [33, 160, 158, 133, 153, 144]

# # Constants
# REFERENCE_PATH_FILE = "reference_path.txt"
# RECOGNITION_TOLERANCE = 0.5
# DETECTION_MODEL = "hog"
# TRACKER_TYPE = "kcf"
# DETECTION_INTERVAL = 15

# def get_reference_path():
#     if not os.path.exists(REFERENCE_PATH_FILE):
#         print("❌ reference_path.txt not found.")
#         return None
#     with open(REFERENCE_PATH_FILE, "r") as f:
#         return f.read().strip()

# def load_reference_encoding():
#     path = get_reference_path()
#     if not path or not os.path.exists(path):
#         return None, "Unknown", False

#     try:
#         image = face_recognition.load_image_file(path)
#         encodings = face_recognition.face_encodings(image)
#         if not encodings:
#             raise ValueError("No face found.")
#         return encodings[0], "Known", True
#     except Exception as e:
#         print("❌ Failed to load face:", e)
#         return None, "Unknown", False

# def select_tracker(tracker_type):
#     if tracker_type == 'mosse':
#         return cv2.TrackerMOSSE_create()
#     elif tracker_type == 'csrt':
#         return cv2.TrackerCSRT_create()
#     return cv2.TrackerKCF_create()

# def detect_eye_movement(frame, face_bbox):
#     """Detect eye movement within the face bounding box"""
#     # Crop face region
#     x, y, w, h = face_bbox
#     face_roi = frame[y:y+h, x:x+w]
    
#     # Process with MediaPipe
#     rgb_roi = cv2.cvtColor(face_roi, cv2.COLOR_BGR2RGB)
#     results = face_mesh.process(rgb_roi)
    
#     gaze_direction = "CENTER"
    
#     if results.multi_face_landmarks:
#         face_landmarks = results.multi_face_landmarks[0]
        
#         # Extract eye landmarks
#         left_eye = []
#         right_eye = []
#         for idx in LEFT_EYE_INDICES:
#             landmark = face_landmarks.landmark[idx]
#             px = int(landmark.x * w) + x
#             py = int(landmark.y * h) + y
#             left_eye.append([px, py])
        
#         for idx in RIGHT_EYE_INDICES:
#             landmark = face_landmarks.landmark[idx]
#             px = int(landmark.x * w) + x
#             py = int(landmark.y * h) + y
#             right_eye.append([px, py])
        
#         left_eye = np.array(left_eye)
#         right_eye = np.array(right_eye)
        
#         # Calculate eye centers
#         left_center = np.mean(left_eye, axis=0)
#         right_center = np.mean(right_eye, axis=0)
#         eyes_center = ((left_center + right_center) / 2).astype(int)
        
#         # Determine gaze direction (simplified)
#         face_center_x = x + w/2
#         if eyes_center[0] < face_center_x - w/4:
#             gaze_direction = "LEFT"
#         elif eyes_center[0] > face_center_x + w/4:
#             gaze_direction = "RIGHT"
        
#         # Draw eye landmarks
#         cv2.polylines(frame, [left_eye], True, (0, 255, 255), 1)
#         cv2.polylines(frame, [right_eye], True, (0, 255, 255), 1)
#         cv2.circle(frame, tuple(eyes_center), 3, (0, 0, 255), -1)
        
#         # Display gaze direction
#         cv2.putText(frame, f"Gaze: {gaze_direction}", (x, y - 40), 
#                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 1)
    
#     return gaze_direction

# def generate_video_stream():
#     reference_encoding, reference_name, face_detected = load_reference_encoding()
#     cap = cv2.VideoCapture(0)
#     trackers, face_ids, face_names = {}, {}, {}
#     frame_count, next_id = 0, 0
#     prev_time = time.time()

#     while True:
#         ret, frame = cap.read()
#         if not ret:
#             break
#         frame_count += 1
#         fps = 1 / (time.time() - prev_time)
#         prev_time = time.time()
#         rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#         small_frame = cv2.resize(rgb_frame, (0, 0), fx=0.25, fy=0.25)

#         if frame_count % DETECTION_INTERVAL == 0:
#             locations = face_recognition.face_locations(small_frame, model=DETECTION_MODEL)
#             encodings = face_recognition.face_encodings(small_frame, locations)
#             trackers, face_ids, face_names = {}, {}, {}

#             for i, encoding in enumerate(encodings):
#                 top, right, bottom, left = [v * 4 for v in locations[i]]
#                 name = "Unknown"
#                 if face_detected and reference_encoding is not None:
#                     distance = face_recognition.face_distance([reference_encoding], encoding)[0]
#                     print(f"➡ Face distance: {distance:.4f}")
#                     if distance < RECOGNITION_TOLERANCE:
#                         name = reference_name
#                 tracker = select_tracker(TRACKER_TYPE)
#                 tracker.init(frame, (left, top, right - left, bottom - top))
#                 fid = next_id
#                 next_id += 1
#                 trackers[fid] = tracker
#                 face_ids[fid] = (left, top, right, bottom)
#                 face_names[fid] = name
#         else:
#             updated = {}
#             for fid, tracker in trackers.items():
#                 success, bbox = tracker.update(frame)
#                 if success:
#                     l, t, w, h = [int(v) for v in bbox]
#                     updated[fid] = (l, t, l + w, t + h)
#             face_ids = updated

#         # Draw results and alerts
#         num_faces = len(face_ids)
#         known_face_present = False

#         if num_faces == 0:
#             cv2.putText(frame, "🚨 ALERT: No face detected!", (50, 240),
#                         cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)
#         elif num_faces > 1:
#             cv2.putText(frame, "🚨 ALERT: Multiple faces detected!", (50, 240),
#                         cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)
#         else:
#             for fid, (l, t, r, b) in face_ids.items():
#                 name = face_names.get(fid, "Tracking...")
#                 is_known = name == reference_name
#                 color = (0, 255, 0) if is_known else (0, 0, 255)
#                 label = f"✅ {name}" if is_known else "❌ Unknown"
#                 cv2.rectangle(frame, (l, t), (r, b), color, 2)
#                 cv2.putText(frame, label, (l, t - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
                
#                 # Only perform eye detection for known faces
#                 if is_known:
#                     known_face_present = True
#                     face_bbox = (l, t, r-l, b-t)
#                     gaze_direction = detect_eye_movement(frame, face_bbox)
#                     print(f"Gaze direction: {gaze_direction}")

#         cv2.putText(frame, f"FPS: {fps:.2f}", (10, 30),
#                     cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)

#         _, jpeg = cv2.imencode('.jpg', frame)
#         yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')

#     cap.release()



# import cv2
# import face_recognition
# import numpy as np
# import time
# import os
# import mediapipe as mp
# from collections import deque

# # MediaPipe Face Mesh setup
# mp_face_mesh = mp.solutions.face_mesh
# face_mesh = mp_face_mesh.FaceMesh(
#     min_detection_confidence=0.5,
#     min_tracking_confidence=0.5,
#     max_num_faces=1
# )

# # Eye landmark indices
# LEFT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
# RIGHT_EYE_INDICES = [33, 160, 158, 133, 153, 144]
# IRIS_INDICES = [468, 469, 470, 471, 472, 473, 474, 475, 476, 477]

# # Constants
# REFERENCE_PATH_FILE = "reference_path.txt"
# RECOGNITION_TOLERANCE = 0.5
# DETECTION_MODEL = "hog"
# TRACKER_TYPE = "kcf"
# DETECTION_INTERVAL = 15

# # Violation tracking
# violation_history = deque(maxlen=30)  # Last 30 frames
# last_violation_time = 0
# VIOLATION_COOLDOWN = 3  # seconds

# def get_reference_path():
#     if not os.path.exists(REFERENCE_PATH_FILE):
#         print("❌ reference_path.txt not found.")
#         return None
#     with open(REFERENCE_PATH_FILE, "r") as f:
#         return f.read().strip()

# def load_reference_encoding():
#     path = get_reference_path()
#     if not path or not os.path.exists(path):
#         return None, "Unknown", False

#     try:
#         image = face_recognition.load_image_file(path)
#         encodings = face_recognition.face_encodings(image)
#         if not encodings:
#             raise ValueError("No face found.")
#         return encodings[0], "Known", True
#     except Exception as e:
#         print("❌ Failed to load face:", e)
#         return None, "Unknown", False

# def select_tracker(tracker_type):
#     if tracker_type == 'mosse':
#         return cv2.TrackerMOSSE_create()
#     elif tracker_type == 'csrt':
#         return cv2.TrackerCSRT_create()
#     return cv2.TrackerKCF_create()

# def calculate_ear(eye_points):
#     """Calculate Eye Aspect Ratio"""
#     A = np.linalg.norm(eye_points[1] - eye_points[5])
#     B = np.linalg.norm(eye_points[2] - eye_points[4])
#     C = np.linalg.norm(eye_points[0] - eye_points[3])
#     return (A + B) / (2.0 * C)

# def detect_eye_movement_and_violations(frame, face_bbox, frame_width, frame_height):
#     """Enhanced eye movement detection with violation tracking"""
#     global last_violation_time
    
#     x, y, w, h = face_bbox
#     face_roi = frame[y:y+h, x:x+w]
    
#     rgb_roi = cv2.cvtColor(face_roi, cv2.COLOR_BGR2RGB)
#     results = face_mesh.process(rgb_roi)
    
#     gaze_direction = "CENTER"
#     violations = []
#     current_time = time.time()
    
#     if results.multi_face_landmarks:
#         face_landmarks = results.multi_face_landmarks[0]
        
#         # Extract eye landmarks
#         left_eye = []
#         right_eye = []
#         iris_points = []
        
#         for idx in LEFT_EYE_INDICES:
#             landmark = face_landmarks.landmark[idx]
#             px = int(landmark.x * w) + x
#             py = int(landmark.y * h) + y
#             left_eye.append([px, py])
        
#         for idx in RIGHT_EYE_INDICES:
#             landmark = face_landmarks.landmark[idx]
#             px = int(landmark.x * w) + x
#             py = int(landmark.y * h) + y
#             right_eye.append([px, py])
        
#         # Get iris landmarks for precise gaze
#         for idx in IRIS_INDICES[:4]:  # Left iris
#             landmark = face_landmarks.landmark[idx]
#             px = int(landmark.x * w) + x
#             py = int(landmark.y * h) + y
#             iris_points.append([px, py])
        
#         left_eye = np.array(left_eye)
#         right_eye = np.array(right_eye)
        
#         # Calculate eye centers
#         left_center = np.mean(left_eye, axis=0)
#         right_center = np.mean(right_eye, axis=0)
#         eyes_center = ((left_center + right_center) / 2).astype(int)
        
#         # Calculate Eye Aspect Ratio for blink detection
#         left_ear = calculate_ear(left_eye)
#         right_ear = calculate_ear(right_eye)
#         avg_ear = (left_ear + right_ear) / 2.0
        
#         # Face position checks
#         face_center_x = x + w/2
#         face_center_y = y + h/2
        
#         # Horizontal gaze detection (improved)
#         eye_to_face_ratio = (eyes_center[0] - face_center_x) / (w / 2)
        
#         if eye_to_face_ratio < -0.3:
#             gaze_direction = "LEFT"
#             if current_time - last_violation_time > VIOLATION_COOLDOWN:
#                 violations.append({
#                     "type": "gaze_left",
#                     "severity": "medium",
#                     "message": "Please look at the screen"
#                 })
#         elif eye_to_face_ratio > 0.3:
#             gaze_direction = "RIGHT"
#             if current_time - last_violation_time > VIOLATION_COOLDOWN:
#                 violations.append({
#                     "type": "gaze_right",
#                     "severity": "medium",
#                     "message": "Please look at the screen"
#                 })
        
#         # Vertical position check (looking up/down)
#         vertical_ratio = (face_center_y - frame_height/2) / (frame_height/2)
#         if vertical_ratio < -0.3:
#             if current_time - last_violation_time > VIOLATION_COOLDOWN:
#                 violations.append({
#                     "type": "looking_up",
#                     "severity": "medium",
#                     "message": "Please sit straight and look ahead"
#                 })
#         elif vertical_ratio > 0.3:
#             if current_time - last_violation_time > VIOLATION_COOLDOWN:
#                 violations.append({
#                     "type": "looking_down",
#                     "severity": "high",
#                     "message": "Keep your head up and look at the screen"
#                 })
        
#         # Face too close or too far
#         face_area_ratio = (w * h) / (frame_width * frame_height)
#         if face_area_ratio > 0.6:
#             if current_time - last_violation_time > VIOLATION_COOLDOWN:
#                 violations.append({
#                     "type": "too_close",
#                     "severity": "low",
#                     "message": "Please move back from the camera"
#                 })
#         elif face_area_ratio < 0.1:
#             if current_time - last_violation_time > VIOLATION_COOLDOWN:
#                 violations.append({
#                     "type": "too_far",
#                     "severity": "medium",
#                     "message": "Please move closer to the camera"
#                 })
        
#         # Eyes closed detection
#         if avg_ear < 0.2:
#             if current_time - last_violation_time > VIOLATION_COOLDOWN:
#                 violations.append({
#                     "type": "eyes_closed",
#                     "severity": "low",
#                     "message": "Please keep your eyes open"
#                 })
        
#         # Update violation time if any violations detected
#         if violations:
#             last_violation_time = current_time
        
#         # Draw visualizations
#         cv2.polylines(frame, [left_eye], True, (0, 255, 255), 1)
#         cv2.polylines(frame, [right_eye], True, (0, 255, 255), 1)
#         cv2.circle(frame, tuple(eyes_center), 3, (0, 0, 255), -1)
        
#         # Gaze direction indicator
#         color = (0, 255, 0) if gaze_direction == "CENTER" else (0, 165, 255)
#         cv2.putText(frame, f"Gaze: {gaze_direction}", (x, y - 40), 
#                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        
#         # EAR indicator
#         cv2.putText(frame, f"EAR: {avg_ear:.2f}", (x, y - 60), 
#                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
    
#     return gaze_direction, violations

# def generate_video_stream(socketio_instance=None, session_id=None):
#     """Enhanced video stream with real-time violation reporting"""
#     reference_encoding, reference_name, face_detected = load_reference_encoding()
#     cap = cv2.VideoCapture(0)
#     trackers, face_ids, face_names = {}, {}, {}
#     frame_count, next_id = 0, 0
#     prev_time = time.time()
#     no_face_counter = 0
#     multiple_face_counter = 0
    
#     while True:
#         ret, frame = cap.read()
#         if not ret:
#             break
            
#         frame_count += 1
#         fps = 1 / (time.time() - prev_time + 0.001)
#         prev_time = time.time()
        
#         frame_height, frame_width = frame.shape[:2]
#         rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#         small_frame = cv2.resize(rgb_frame, (0, 0), fx=0.25, fy=0.25)

#         if frame_count % DETECTION_INTERVAL == 0:
#             locations = face_recognition.face_locations(small_frame, model=DETECTION_MODEL)
#             encodings = face_recognition.face_encodings(small_frame, locations)
#             trackers, face_ids, face_names = {}, {}, {}

#             for i, encoding in enumerate(encodings):
#                 top, right, bottom, left = [v * 4 for v in locations[i]]
#                 name = "Unknown"
#                 if face_detected and reference_encoding is not None:
#                     distance = face_recognition.face_distance([reference_encoding], encoding)[0]
#                     if distance < RECOGNITION_TOLERANCE:
#                         name = reference_name
                        
#                 tracker = select_tracker(TRACKER_TYPE)
#                 tracker.init(frame, (left, top, right - left, bottom - top))
#                 fid = next_id
#                 next_id += 1
#                 trackers[fid] = tracker
#                 face_ids[fid] = (left, top, right, bottom)
#                 face_names[fid] = name
#         else:
#             updated = {}
#             for fid, tracker in trackers.items():
#                 success, bbox = tracker.update(frame)
#                 if success:
#                     l, t, w, h = [int(v) for v in bbox]
#                     updated[fid] = (l, t, l + w, t + h)
#             face_ids = updated

#         # Violation detection
#         num_faces = len(face_ids)
#         violations_to_send = []
        
#         if num_faces == 0:
#             no_face_counter += 1
#             if no_face_counter > 10 and socketio_instance and session_id:  # 10 frames = ~0.5s
#                 violations_to_send.append({
#                     "type": "no_face",
#                     "severity": "critical",
#                     "message": "No face detected! Please stay in frame"
#                 })
#                 no_face_counter = 0
#             cv2.putText(frame, "ALERT: No face detected!", (50, 240),
#                         cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)
                        
#         elif num_faces > 1:
#             multiple_face_counter += 1
#             if multiple_face_counter > 10 and socketio_instance and session_id:
#                 violations_to_send.append({
#                     "type": "multiple_faces",
#                     "severity": "critical",
#                     "message": "Multiple faces detected! Only you should be visible"
#                 })
#                 multiple_face_counter = 0
#             cv2.putText(frame, "ALERT: Multiple faces!", (50, 240),
#                         cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)
#         else:
#             no_face_counter = 0
#             multiple_face_counter = 0
            
#             for fid, (l, t, r, b) in face_ids.items():
#                 name = face_names.get(fid, "Tracking...")
#                 is_known = name == reference_name
#                 color = (0, 255, 0) if is_known else (0, 0, 255)
#                 label = f"✅ {name}" if is_known else "❌ Unknown"
                
#                 cv2.rectangle(frame, (l, t), (r, b), color, 2)
#                 cv2.putText(frame, label, (l, t - 10), 
#                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
                
#                 if is_known:
#                     face_bbox = (l, t, r-l, b-t)
#                     gaze_direction, face_violations = detect_eye_movement_and_violations(
#                         frame, face_bbox, frame_width, frame_height
#                     )
#                     violations_to_send.extend(face_violations)
#                 else:
#                     if socketio_instance and session_id:
#                         violations_to_send.append({
#                             "type": "unknown_face",
#                             "severity": "critical",
#                             "message": "Unknown person detected! Only the registered candidate is allowed"
#                         })

#         # Send violations via WebSocket
#         if violations_to_send and socketio_instance and session_id:
#             for violation in violations_to_send:
#                 socketio_instance.emit('violation_detected', violation, room=session_id)

#         # FPS display
#         cv2.putText(frame, f"FPS: {fps:.2f}", (10, 30),
#                     cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)

#         _, jpeg = cv2.imencode('.jpg', frame)
#         yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')

#     cap.release()


import cv2
import face_recognition
import numpy as np
import time
import os
import mediapipe as mp
from collections import deque

# MediaPipe Face Mesh setup
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
    max_num_faces=1
)

# Eye landmark indices
LEFT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
RIGHT_EYE_INDICES = [33, 160, 158, 133, 153, 144]
IRIS_INDICES = [468, 469, 470, 471, 472, 473, 474, 475, 476, 477]

# Constants - USE ABSOLUTE PATHS
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REFERENCE_PATH_FILE = os.path.join(BASE_DIR, "reference_path.txt")
RECOGNITION_TOLERANCE = 0.5
DETECTION_MODEL = "hog"
TRACKER_TYPE = "kcf"
DETECTION_INTERVAL = 15

# Violation tracking
violation_history = deque(maxlen=30)  # Last 30 frames
last_violation_time = 0
VIOLATION_COOLDOWN = 3  # seconds

print("="*60)
print("🔧 Face Detection Module Initialized")
print(f"📁 BASE_DIR: {BASE_DIR}")
print(f"📄 REFERENCE_PATH_FILE: {REFERENCE_PATH_FILE}")
print(f"✅ File exists: {os.path.exists(REFERENCE_PATH_FILE)}")
print("="*60)

def get_reference_path():
    """Get the reference image path from reference_path.txt"""
    if not os.path.exists(REFERENCE_PATH_FILE):
        print(f"❌ reference_path.txt not found at: {REFERENCE_PATH_FILE}")
        print(f"📂 Current working directory: {os.getcwd()}")
        print(f"📂 Files in BASE_DIR: {os.listdir(BASE_DIR)}")
        return None
    
    try:
        with open(REFERENCE_PATH_FILE, "r") as f:
            path = f.read().strip()
        print(f"✅ Reference path read: {path}")
        return path
    except Exception as e:
        print(f"❌ Error reading reference_path.txt: {e}")
        return None

def load_reference_encoding():
    """Load the reference face encoding from the saved image"""
    path = get_reference_path()
    
    if not path:
        print("⚠️  No reference path found")
        return None, "Unknown", False
    
    if not os.path.exists(path):
        print(f"❌ Reference image not found at: {path}")
        return None, "Unknown", False

    try:
        print(f"📸 Loading reference image from: {path}")
        image = face_recognition.load_image_file(path)
        encodings = face_recognition.face_encodings(image)
        
        if not encodings:
            print("❌ No face found in reference image")
            raise ValueError("No face found in reference image.")
        
        print("✅ Reference face encoding loaded successfully")
        return encodings[0], "Known", True
        
    except Exception as e:
        print(f"❌ Failed to load face encoding: {e}")
        return None, "Unknown", False

def select_tracker(tracker_type):
    """Select OpenCV tracker type"""
    if tracker_type == 'mosse':
        return cv2.TrackerMOSSE_create()
    elif tracker_type == 'csrt':
        return cv2.TrackerCSRT_create()
    return cv2.TrackerKCF_create()

def calculate_ear(eye_points):
    """Calculate Eye Aspect Ratio"""
    A = np.linalg.norm(eye_points[1] - eye_points[5])
    B = np.linalg.norm(eye_points[2] - eye_points[4])
    C = np.linalg.norm(eye_points[0] - eye_points[3])
    return (A + B) / (2.0 * C)

def detect_eye_movement_and_violations(frame, face_bbox, frame_width, frame_height):
    """Enhanced eye movement detection with violation tracking"""
    global last_violation_time
    
    x, y, w, h = face_bbox
    face_roi = frame[y:y+h, x:x+w]
    
    rgb_roi = cv2.cvtColor(face_roi, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb_roi)
    
    gaze_direction = "CENTER"
    violations = []
    current_time = time.time()
    
    if results.multi_face_landmarks:
        face_landmarks = results.multi_face_landmarks[0]
        
        # Extract eye landmarks
        left_eye = []
        right_eye = []
        iris_points = []
        
        for idx in LEFT_EYE_INDICES:
            landmark = face_landmarks.landmark[idx]
            px = int(landmark.x * w) + x
            py = int(landmark.y * h) + y
            left_eye.append([px, py])
        
        for idx in RIGHT_EYE_INDICES:
            landmark = face_landmarks.landmark[idx]
            px = int(landmark.x * w) + x
            py = int(landmark.y * h) + y
            right_eye.append([px, py])
        
        # Get iris landmarks for precise gaze
        for idx in IRIS_INDICES[:4]:  # Left iris
            landmark = face_landmarks.landmark[idx]
            px = int(landmark.x * w) + x
            py = int(landmark.y * h) + y
            iris_points.append([px, py])
        
        left_eye = np.array(left_eye)
        right_eye = np.array(right_eye)
        
        # Calculate eye centers
        left_center = np.mean(left_eye, axis=0)
        right_center = np.mean(right_eye, axis=0)
        eyes_center = ((left_center + right_center) / 2).astype(int)
        
        # Calculate Eye Aspect Ratio for blink detection
        left_ear = calculate_ear(left_eye)
        right_ear = calculate_ear(right_eye)
        avg_ear = (left_ear + right_ear) / 2.0
        
        # Face position checks
        face_center_x = x + w/2
        face_center_y = y + h/2
        
        # Horizontal gaze detection (improved)
        eye_to_face_ratio = (eyes_center[0] - face_center_x) / (w / 2)
        
        if eye_to_face_ratio < -0.3:
            gaze_direction = "LEFT"
            if current_time - last_violation_time > VIOLATION_COOLDOWN:
                violations.append({
                    "type": "gaze_left",
                    "severity": "medium",
                    "message": "Please look at the screen"
                })
        elif eye_to_face_ratio > 0.3:
            gaze_direction = "RIGHT"
            if current_time - last_violation_time > VIOLATION_COOLDOWN:
                violations.append({
                    "type": "gaze_right",
                    "severity": "medium",
                    "message": "Please look at the screen"
                })
        
        # Vertical position check (looking up/down)
        vertical_ratio = (face_center_y - frame_height/2) / (frame_height/2)
        if vertical_ratio < -0.3:
            if current_time - last_violation_time > VIOLATION_COOLDOWN:
                violations.append({
                    "type": "looking_up",
                    "severity": "medium",
                    "message": "Please sit straight and look ahead"
                })
        elif vertical_ratio > 0.3:
            if current_time - last_violation_time > VIOLATION_COOLDOWN:
                violations.append({
                    "type": "looking_down",
                    "severity": "high",
                    "message": "Keep your head up and look at the screen"
                })
        
        # Face too close or too far
        face_area_ratio = (w * h) / (frame_width * frame_height)
        if face_area_ratio > 0.6:
            if current_time - last_violation_time > VIOLATION_COOLDOWN:
                violations.append({
                    "type": "too_close",
                    "severity": "low",
                    "message": "Please move back from the camera"
                })
        elif face_area_ratio < 0.1:
            if current_time - last_violation_time > VIOLATION_COOLDOWN:
                violations.append({
                    "type": "too_far",
                    "severity": "medium",
                    "message": "Please move closer to the camera"
                })
        
        # Eyes closed detection
        if avg_ear < 0.2:
            if current_time - last_violation_time > VIOLATION_COOLDOWN:
                violations.append({
                    "type": "eyes_closed",
                    "severity": "low",
                    "message": "Please keep your eyes open"
                })
        
        # Update violation time if any violations detected
        if violations:
            last_violation_time = current_time
        
        # Draw visualizations
        cv2.polylines(frame, [left_eye], True, (0, 255, 255), 1)
        cv2.polylines(frame, [right_eye], True, (0, 255, 255), 1)
        cv2.circle(frame, tuple(eyes_center), 3, (0, 0, 255), -1)
        
        # Gaze direction indicator
        color = (0, 255, 0) if gaze_direction == "CENTER" else (0, 165, 255)
        cv2.putText(frame, f"Gaze: {gaze_direction}", (x, y - 40), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        
        # EAR indicator
        cv2.putText(frame, f"EAR: {avg_ear:.2f}", (x, y - 60), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
    
    return gaze_direction, violations

def generate_video_stream(socketio_instance=None, session_id=None):
    """Enhanced video stream with real-time violation reporting"""
    print("🎥 Starting video stream...")
    print(f"📡 SocketIO: {'Connected' if socketio_instance else 'Not connected'}")
    print(f"🔑 Session ID: {session_id or 'None'}")
    
    reference_encoding, reference_name, face_detected = load_reference_encoding()
    
    if not face_detected:
        print("⚠️  WARNING: No reference face loaded. Face recognition disabled.")
    else:
        print(f"✅ Reference face loaded successfully as '{reference_name}'")
    
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("❌ Failed to open webcam!")
        return
    
    print("✅ Webcam opened successfully")
    
    trackers, face_ids, face_names = {}, {}, {}
    frame_count, next_id = 0, 0
    prev_time = time.time()
    no_face_counter = 0
    multiple_face_counter = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ Failed to read frame from webcam")
            break
            
        frame_count += 1
        fps = 1 / (time.time() - prev_time + 0.001)
        prev_time = time.time()
        
        frame_height, frame_width = frame.shape[:2]
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        small_frame = cv2.resize(rgb_frame, (0, 0), fx=0.25, fy=0.25)

        if frame_count % DETECTION_INTERVAL == 0:
            locations = face_recognition.face_locations(small_frame, model=DETECTION_MODEL)
            encodings = face_recognition.face_encodings(small_frame, locations)
            trackers, face_ids, face_names = {}, {}, {}

            for i, encoding in enumerate(encodings):
                top, right, bottom, left = [v * 4 for v in locations[i]]
                name = "Unknown"
                if face_detected and reference_encoding is not None:
                    distance = face_recognition.face_distance([reference_encoding], encoding)[0]
                    if distance < RECOGNITION_TOLERANCE:
                        name = reference_name
                        
                tracker = select_tracker(TRACKER_TYPE)
                tracker.init(frame, (left, top, right - left, bottom - top))
                fid = next_id
                next_id += 1
                trackers[fid] = tracker
                face_ids[fid] = (left, top, right, bottom)
                face_names[fid] = name
        else:
            updated = {}
            for fid, tracker in trackers.items():
                success, bbox = tracker.update(frame)
                if success:
                    l, t, w, h = [int(v) for v in bbox]
                    updated[fid] = (l, t, l + w, t + h)
            face_ids = updated

        # Violation detection
        num_faces = len(face_ids)
        violations_to_send = []
        
        if num_faces == 0:
            no_face_counter += 1
            if no_face_counter > 10 and socketio_instance and session_id:  # 10 frames = ~0.5s
                violations_to_send.append({
                    "type": "no_face",
                    "severity": "critical",
                    "message": "No face detected! Please stay in frame"
                })
                no_face_counter = 0
            cv2.putText(frame, "ALERT: No face detected!", (50, 240),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)
                        
        elif num_faces > 1:
            multiple_face_counter += 1
            if multiple_face_counter > 10 and socketio_instance and session_id:
                violations_to_send.append({
                    "type": "multiple_faces",
                    "severity": "critical",
                    "message": "Multiple faces detected! Only you should be visible"
                })
                multiple_face_counter = 0
            cv2.putText(frame, "ALERT: Multiple faces!", (50, 240),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)
        else:
            no_face_counter = 0
            multiple_face_counter = 0
            
            for fid, (l, t, r, b) in face_ids.items():
                name = face_names.get(fid, "Tracking...")
                is_known = name == reference_name
                color = (0, 255, 0) if is_known else (0, 0, 255)
                label = f"✅ {name}" if is_known else "❌ Unknown"
                
                cv2.rectangle(frame, (l, t), (r, b), color, 2)
                cv2.putText(frame, label, (l, t - 10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
                
                if is_known:
                    face_bbox = (l, t, r-l, b-t)
                    gaze_direction, face_violations = detect_eye_movement_and_violations(
                        frame, face_bbox, frame_width, frame_height
                    )
                    violations_to_send.extend(face_violations)
                else:
                    if socketio_instance and session_id:
                        violations_to_send.append({
                            "type": "unknown_face",
                            "severity": "critical",
                            "message": "Unknown person detected! Only the registered candidate is allowed"
                        })

        # Send violations via WebSocket
        if violations_to_send and socketio_instance and session_id:
            for violation in violations_to_send:
                socketio_instance.emit('violation_detected', violation, room=session_id)

        # FPS display
        cv2.putText(frame, f"FPS: {fps:.2f}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)

        _, jpeg = cv2.imencode('.jpg', frame)
        yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')

    cap.release()
    print("🛑 Video stream stopped")