import React, { useEffect, useRef, useState } from "react";
import { Loader2, Camera, CameraOff } from "lucide-react";

/**
 * EnhancedVideoComponent
 * =======================
 * Live video display with face detection and recognition
 * - Real-time face detection feedback
 * - Identity verification status
 * - Violation tracking
 * - Camera ready check
 */
const EnhancedVideoComponent = ({
  sessionId,
  interviewStarted,
  stopInterview,
  onFaceDetected,
  onViolation,
  className = "",
}) => {
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const statusCheckIntervalRef = useRef(null);
  const mountedRef = useRef(true);

  const [cameraReady, setCameraReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [multipleFaces, setMultipleFaces] = useState(false);
  const [violationCount, setViolationCount] = useState(0);

  // ========================================
  // STATUS CHECK FUNCTION
  // ========================================
  const checkFaceStatus = async () => {
    if (!sessionId || !mountedRef.current) return;

    try {
      const response = await fetch(
        `http://localhost:5000/check-face?session_id=${sessionId}`
      );
      const data = await response.json();

      if (mountedRef.current) {
        setFaceDetected(data.face_detected);
        setIdentityVerified(data.identity_verified);
        setMultipleFaces(data.multiple_faces);
        setCameraReady(true);
        setLoading(false);

        if (onFaceDetected) {
          onFaceDetected({
            detected: data.face_detected,
            verified: data.identity_verified,
            multipleFaces: data.multiple_faces,
          });
        }

        // Clear error if camera is working
        if (data.face_detected || cameraReady) {
          setError("");
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        console.error("Face check error:", err);
        if (!cameraReady) {
          setError("Unable to connect to camera feed");
        }
      }
    }
  };

  // ========================================
  // VIDEO STREAM DRAWING
  // ========================================
  const drawVideoToCanvas = () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;

    if (!img || !canvas) return;

    const ctx = canvas.getContext("2d");

    const draw = () => {
      if (!interviewStarted) {
        animFrameRef.current = null;
        return;
      }

      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  // ========================================
  // INITIALIZATION AND CLEANUP
  // ========================================
  useEffect(() => {
    mountedRef.current = true;

    if (interviewStarted && sessionId) {
      // Start video stream
      if (imgRef.current) {
        imgRef.current.src = `http://localhost:5000/video?session_id=${sessionId}`;
        imgRef.current.onload = () => {
          drawVideoToCanvas();
        };
      }

      // Start status checks
      const checkInterval = setInterval(checkFaceStatus, 500);
      statusCheckIntervalRef.current = checkInterval;

      // Initial check
      checkFaceStatus();
    } else {
      // Stop video
      if (imgRef.current) {
        imgRef.current.src = "";
      }

      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
      }

      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    }

    return () => {
      mountedRef.current = false;

      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
      }

      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }

      // Stop session on unmount or interview stop
      if (sessionId && !interviewStarted) {
        fetch("http://localhost:5000/video/stop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        }).catch((err) => console.error("Error stopping video:", err));
      }
    };
  }, [sessionId, interviewStarted, onFaceDetected]);

  // ========================================
  // RENDER
  // ========================================
  return (
    <div className={`relative bg-black rounded-xl overflow-hidden ${className}`}>
      {/* Hidden image for video stream */}
      <img
        ref={imgRef}
        alt="Live Video Stream"
        className="hidden"
        crossOrigin="anonymous"
      />

      {/* Canvas for display */}
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="w-full h-full object-cover"
      />

      {/* Live indicator */}
      {interviewStarted && (
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <div className="bg-red-600 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
            <span className="font-semibold">LIVE</span>
          </div>
        </div>
      )}

      {/* Face detection status */}
      {interviewStarted && (
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 flex-wrap">
          {faceDetected ? (
            <div className="bg-green-500/20 border border-green-500/50 rounded px-2 py-1 text-xs text-green-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              Face Detected
            </div>
          ) : (
            <div className="bg-red-500/20 border border-red-500/50 rounded px-2 py-1 text-xs text-red-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
              No Face
            </div>
          )}

          {identityVerified && (
            <div className="bg-blue-500/20 border border-blue-500/50 rounded px-2 py-1 text-xs text-blue-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              Identity Verified
            </div>
          )}

          {multipleFaces && (
            <div className="bg-orange-500/20 border border-orange-500/50 rounded px-2 py-1 text-xs text-orange-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
              Multiple Faces
            </div>
          )}

          {violationCount > 0 && (
            <div className="bg-red-500/30 border border-red-500/70 rounded px-2 py-1 text-xs text-red-300 font-semibold flex items-center gap-1">
              ⚠️ {violationCount} Violation{violationCount !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}

      {/* Overlay message when not started */}
      {!interviewStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="text-white text-center p-8 max-w-md">
            {loading ? (
              <>
                <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-blue-400" />
                <p className="text-lg font-semibold">Initializing Camera...</p>
                <p className="text-sm opacity-75 mt-2">Checking face detection</p>
              </>
            ) : error ? (
              <>
                <CameraOff className="w-16 h-16 mx-auto mb-4 text-red-400" />
                <p className="text-lg font-semibold text-red-400">Camera Issue</p>
                <p className="text-sm opacity-90 mt-3 bg-red-500/20 p-3 rounded-lg border border-red-500/30">
                  {error}
                </p>
                <p className="text-xs opacity-50 mt-4 flex items-center justify-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Rechecking automatically...
                </p>
              </>
            ) : cameraReady && faceDetected && identityVerified ? (
              <>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-500">
                  <Camera className="w-10 h-10 text-green-400" />
                </div>
                <p className="text-xl font-bold text-green-400 mb-2">
                  ✓ All Systems Ready
                </p>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-center gap-2 text-sm text-green-300">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    Camera Active
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-green-300">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    Face Detected & Verified
                  </div>
                </div>
                <p className="text-xs opacity-75 mt-6 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                  You can now start the interview
                </p>
              </>
            ) : cameraReady && faceDetected && !identityVerified ? (
              <>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-orange-500/20 flex items-center justify-center border-2 border-orange-500 animate-pulse">
                  <Camera className="w-10 h-10 text-orange-400" />
                </div>
                <p className="text-lg font-semibold text-orange-400 mb-2">
                  Face Detected
                </p>
                <p className="text-base text-yellow-400 font-medium mb-3">
                  ⚠ Identity Not Verified
                </p>
                <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/30 mt-4">
                  <p className="text-sm opacity-90">
                    Your face was detected but doesn't match the reference. Please
                    ensure:
                  </p>
                  <ul className="text-xs opacity-75 mt-2 space-y-1 text-left list-disc list-inside">
                    <li>You're the same person from the reference image</li>
                    <li>Lighting conditions are similar</li>
                    <li>Camera angle is similar to the reference</li>
                    <li>Your face is clearly visible</li>
                  </ul>
                </div>
              </>
            ) : cameraReady && !faceDetected ? (
              <>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center border-2 border-yellow-500 animate-pulse">
                  <Camera className="w-10 h-10 text-yellow-400" />
                </div>
                <p className="text-lg font-semibold text-yellow-400 mb-2">
                  Camera Active
                </p>
                <p className="text-base text-red-400 font-medium mb-3">
                  ⚠ No Face Detected
                </p>
                <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/30 mt-4">
                  <p className="text-sm opacity-90">Please ensure:</p>
                  <ul className="text-xs opacity-75 mt-2 space-y-1 text-left list-disc list-inside">
                    <li>Your face is clearly visible</li>
                    <li>Adequate lighting in the room</li>
                    <li>Camera is at eye level</li>
                    <li>No obstructions blocking your face</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <CameraOff className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-sm opacity-75">Camera Standby</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedVideoComponent;
