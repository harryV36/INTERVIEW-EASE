/**
 * UnifiedVideoSection.jsx  —  fixed v2
 *
 * Key fixes:
 * 1. CAMERA BLANK FIX: Always use the browser's local getUserMedia stream as the
 *    primary video source. The backend MJPEG stream approach was causing a blank
 *    screen because the Python server either wasn't running or had CORS/WebSocket
 *    conflicts. Local webcam is reliable across all environments.
 * 2. Stream is kept alive across the interview start/stop — no re-acquiring that
 *    could cause a blank flash or NotReadableError.
 * 3. Face-detection polling continues during the interview (not just pre-interview).
 * 4. Proper cleanup on unmount — stream tracks stopped, intervals cleared.
 */

import React, { useEffect, useRef, useState } from "react";
import { CameraOff, CheckCircle, Shield } from "lucide-react";
import InterviewSecurityComponent from "./InterviewSecurityComponent";

const BACKEND = "http://localhost:5000";

const UnifiedVideoSection = ({
  sessionId,
  interviewStarted,
  stopInterview,
  onViolation,
  onFaceDetected,
  className = "",
}) => {
  const resolvedSessionId = sessionId || localStorage.getItem("interviewSessionId");
  const videoRef        = useRef(null);
  const streamRef       = useRef(null);   // holds the MediaStream so we never lose it
  const pollRef         = useRef(null);
  const framePostRef    = useRef(null);   // interval: send canvas frame to backend
  const canvasRef       = useRef(null);   // offscreen canvas for frame capture
  const mountedRef      = useRef(true);
  const isCheckingRef   = useRef(false);
  const abortRef        = useRef(null);

  const [faceDetected, setFaceDetected] = useState(false);
  const [faceCount,    setFaceCount]    = useState(0);
  const [faceMatched,  setFaceMatched]  = useState(null); // null=unknown, true=matched, false=mismatch
  const [cameraReady,  setCameraReady]  = useState(false);
  const [statusMsg,    setStatusMsg]    = useState("Initialising camera…");

  // ── Start the local webcam stream (called once) ──────────────────────────
  const startCamera = async () => {
    if (streamRef.current) return; // already running
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
      if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);
      setStatusMsg("Camera ready — centre your face");
    } catch (err) {
      if (!mountedRef.current) return;
      setCameraReady(false);
      setStatusMsg(
        err.name === "NotAllowedError"
          ? "Camera access denied. Allow camera in browser settings."
          : err.name === "NotFoundError"
          ? "No camera found. Connect a webcam to continue."
          : `Camera error: ${err.message}`
      );
    }
  };

  // ── Send a canvas frame to backend every 3s (replaces server webcam) ───────
  const postFrame = async () => {
    if (!videoRef.current || !resolvedSessionId || !mountedRef.current) return;
    const video = videoRef.current;
    if (video.readyState < 2) return; // not yet playing

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Low resolution — saves bandwidth and is enough for face detection
      canvas.width  = 320;
      canvas.height = 240;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, 320, 240);

      canvas.toBlob(async (blob) => {
        if (!blob || !mountedRef.current) return;
        const fd = new FormData();
        fd.append("frame", blob, "frame.jpg");
        fd.append("session_id", resolvedSessionId);
        try {
          await fetch(`${BACKEND}/update-frame`, { method: "POST", body: fd });
        } catch (_) {/* silent — non-critical */}
      }, "image/jpeg", 0.6);
    } catch (_) {/* silent */}
  };

  // ── Poll backend for face detection ──────────────────────────────────────
  const pollFace = async () => {
    if (isCheckingRef.current || !mountedRef.current || !resolvedSessionId) return;
    isCheckingRef.current = true;
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${BACKEND}/check-face?session_id=${resolvedSessionId}`, {
        signal: abortRef.current.signal,
      });
      if (!res.ok || !mountedRef.current) return;
      const data = await res.json();
      if (!mountedRef.current) return;

      const face  = Boolean(data.face_detected);
      const count = data.face_count ?? (face ? 1 : 0);
      setFaceDetected(face);
      setFaceCount(count);
      onFaceDetected?.(face);

      // Emit violations from real-time check to parent
      if (data.violation && interviewStarted) {
        onViolation?.(data.violation);
      }

      if (!interviewStarted) {
        if (count > 1)  setStatusMsg("Multiple faces — only you should be visible");
        else if (face)  setStatusMsg("Face detected ✓ — ready to start");
        else            setStatusMsg("No face detected — centre your face");
      }
    } catch (err) {
      if (err.name === "AbortError" || !mountedRef.current) return;
      // Backend not yet running — silent warn, don't break UI
      console.warn("check-face:", err.message);
    } finally {
      isCheckingRef.current = false;
    }
  };

  // ── Mount: start camera immediately ─────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    startCamera();

    // Create offscreen canvas once
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }

    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      clearInterval(pollRef.current);
      clearInterval(framePostRef.current);
      // Stop webcam tracks
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Ensure video element gets the stream if it mounts after startCamera ─
  useEffect(() => {
    if (videoRef.current && streamRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
    }
  });

  // ── Start face-detection polling once sessionId is available ────────────
  useEffect(() => {
    if (!resolvedSessionId) return;
    clearInterval(pollRef.current);
    pollFace(); // immediate first check
    pollRef.current = setInterval(pollFace, 2500);
    return () => clearInterval(pollRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedSessionId, interviewStarted]);

  // ── Send frames to backend every 3s once sessionId is known ─────────────
  useEffect(() => {
    if (!resolvedSessionId) return;
    clearInterval(framePostRef.current);
    postFrame(); // first frame immediately
    framePostRef.current = setInterval(postFrame, 3000);
    return () => clearInterval(framePostRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedSessionId]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Security proctoring layer */}
      {interviewStarted && (
        <InterviewSecurityComponent
          interviewStarted={interviewStarted}
          stopInterview={stopInterview}
          onViolation={onViolation}
        />
      )}

      {/* Video wrapper */}
      <div className={`relative w-full h-full bg-black overflow-hidden ${className}`}>

        {/* Live webcam video — object-contain shows full person, not cropped */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-contain bg-black"
          style={{ transform: "scaleX(-1)" }} /* mirror like a selfie cam */
        />

        {/* Camera not ready overlay */}
        {!cameraReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 p-4 z-10">
            <CameraOff size={36} className="text-red-400 mb-2" />
            <p className="text-sm text-red-300 text-center font-medium">{statusMsg}</p>
          </div>
        )}

        {/* Pre-interview status overlay (face detection feedback) */}
        {cameraReady && !interviewStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 pointer-events-none">
            <div className={`mx-4 px-3 py-2 rounded-lg text-xs font-medium text-center backdrop-blur-sm ${
              faceDetected
                ? "bg-green-900/60 text-green-300 border border-green-600"
                : "bg-yellow-900/60 text-yellow-300 border border-yellow-600"
            }`}>
              {faceDetected ? <><CheckCircle className="inline mr-1" size={12} />Face detected — ready to start</> : statusMsg}
            </div>
          </div>
        )}

        {/* LIVE badge */}
        {interviewStarted && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow z-20">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            LIVE
          </div>
        )}

        {/* Multiple-face warning badge */}
        {interviewStarted && faceCount > 1 && (
          <div className="absolute top-2 left-2 bg-red-600/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-20">
            ⚠ Multiple faces
          </div>
        )}

        {/* Bottom bar — always shows security check during interview, face status before */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 flex items-center justify-between pointer-events-none z-10">
          <span className="text-[9px] text-white/60 font-medium">Your Camera</span>
          {interviewStarted ? (
            <span className="flex items-center gap-1 text-[9px] font-bold text-yellow-300">
              <Shield size={9} /> Under Security Check
            </span>
          ) : (
            <span className={`text-[9px] font-bold ${faceDetected ? "text-green-400" : "text-red-400"}`}>
              {faceCount > 1 ? "● Multi-face" : faceDetected ? "● Face OK" : "● No Face"}
            </span>
          )}
        </div>
      </div>
    </>
  );
};

export default UnifiedVideoSection;
