import React, { useState, useCallback, useEffect, useRef } from "react";
import Webcam from "react-webcam";
import { RotateCcw, Check, AlertCircle, Loader2, VideoOff } from "lucide-react";
import axios from "axios";

/* ─────────────────────────────────────────────────────────────
   ROOT CAUSES that were fixed:

   1. tryAgain() toggled `relaxed` — so every OTHER retry kept
      resetting back to the "strict" constraints that already
      failed, making it work only on every 2nd click.
      FIX: tryAgain() always sets relaxed=true after first fail.

   2. The Webcam key was incremented but the browser stream from
      the previous attempt was never stopped before the new one
      started. Many browsers keep the old stream alive, causing
      the new Webcam component to fight over the device and fail.
      FIX: stopStream() kills all tracks before every retry/retake.

   3. After a permission-denied error, the user grants permission
      in the browser but "Try Again" just toggled state — the
      browser still had the device locked by the dead stream.
      FIX: explicit stopStream() + 300 ms settle delay on retry
      so the OS has time to release the device.

   4. onUserMediaError fired with "NotReadableError" (device busy)
      on slow machines — treated the same as a real denial.
      FIX: detect NotReadableError and show a "device busy" hint.

   5. Auto-capture timer fired while the component was unmounted
      if the user navigated away fast.
      FIX: cleanup ref + isMounted guard.
   ───────────────────────────────────────────────────────────── */

const PhotoCapture = ({
  capturedImage,
  setCapturedImage,
  webcamRef,
  sessionId,
  setError,
  uploadSuccess,
  setUploadSuccess,
}) => {
  const [camError, setCamError]       = useState(null);
  const [camKey, setCamKey]           = useState(0);
  const [useRelaxed, setUseRelaxed]   = useState(false);   // FIX 1: no more toggle
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [retrying, setRetrying]       = useState(false);

  const autoCapTimer  = useRef(null);
  const isMounted     = useRef(true);                       // FIX 5
  const sessionIdRef  = useRef(sessionId);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => () => { isMounted.current = false; clearTimeout(autoCapTimer.current); }, []);

  const userId = localStorage.getItem("userId");

  // ── Stop any live stream tracks (FIX 2 & 3) ───────────────
  const stopStream = useCallback(() => {
    // Kill tracks held by the Webcam ref
    if (webcamRef.current?.video?.srcObject) {
      webcamRef.current.video.srcObject.getTracks().forEach((t) => t.stop());
      webcamRef.current.video.srcObject = null;
    }
    // Also kill any leftover MediaStream tracks via the browser API
    navigator.mediaDevices?.getUserMedia?.({ video: true })
      .then((s) => s.getTracks().forEach((t) => t.stop()))
      .catch(() => {}); // ignore — just a best-effort cleanup
  }, [webcamRef]);

  // ── Base64 → Blob helper ───────────────────────────────────
  const base64ToBlob = (b64) => {
    const byteStr = atob(b64.split(",")[1]);
    const mime    = b64.split(",")[0].split(":")[1].split(";")[0];
    const ab      = new ArrayBuffer(byteStr.length);
    const ia      = new Uint8Array(ab);
    for (let i = 0; i < byteStr.length; i++) ia[i] = byteStr.charCodeAt(i);
    return new Blob([ab], { type: mime });
  };

  // ── Upload captured photo ──────────────────────────────────
  const uploadImage = useCallback(async (imgSrc) => {
    if (!imgSrc) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const blob     = base64ToBlob(imgSrc);
      const formData = new FormData();
      formData.append("image", blob, "reference.jpg");
      const sid = sessionIdRef.current;
      if (sid)    formData.append("session_id", sid);
      if (userId) formData.append("user_id", userId);

      const res = await axios.post("http://localhost:5000/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        if (isMounted.current) setUploadSuccess(true);
      } else {
        throw new Error(res.data.error || "Upload failed");
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Upload failed";
      if (isMounted.current) setUploadError(msg);
      console.warn("[PhotoCapture] upload-image failed:", msg);
    } finally {
      if (isMounted.current) setIsUploading(false);
    }
  }, [userId, setUploadSuccess]);

  // ── Capture a still from the webcam ───────────────────────
  const capturePhoto = useCallback(() => {
    if (!webcamRef.current) return;
    const img = webcamRef.current.getScreenshot();
    if (!img) return;
    clearTimeout(autoCapTimer.current);
    setCapturedImage(img);
    setUploadSuccess(false);
    setUploadError(null);
    uploadImage(img);
  }, [webcamRef, setCapturedImage, setUploadSuccess, uploadImage]);

  // ── Auto-capture 2 s after camera is live ─────────────────
  useEffect(() => {
    if (cameraReady && !capturedImage && !camError) {
      autoCapTimer.current = setTimeout(() => {
        if (isMounted.current) capturePhoto();
      }, 2000);
    }
    return () => clearTimeout(autoCapTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraReady, camError]);

  // ── Retake: keep camera alive, just clear the snapshot ────
  const retake = () => {
    clearTimeout(autoCapTimer.current);
    setCapturedImage(null);
    setUploadSuccess(false);
    setUploadError(null);
    // camera is still running — just let auto-cap fire again
    setCameraReady(false);
    setTimeout(() => { if (isMounted.current) setCameraReady(true); }, 100);
  };

  // ── Try Again after an error (FIX 1 + 2 + 3) ─────────────
  const tryAgain = async () => {
    clearTimeout(autoCapTimer.current);
    setRetrying(true);
    setCamError(null);
    setCameraReady(false);

    // FIX 2: stop the old stream before asking for a new one
    stopStream();

    // FIX 1: always move to relaxed constraints after any error
    setUseRelaxed(true);

    // FIX 3: give the OS/browser 300 ms to fully release the device
    await new Promise((r) => setTimeout(r, 300));

    if (isMounted.current) {
      setCamKey((k) => k + 1);   // remounts the <Webcam> component fresh
      setRetrying(false);
    }
  };

  // ── Error handler for <Webcam> ─────────────────────────────
  const handleCameraError = useCallback((err) => {
    const name = err?.name || "";
    const msg  = err?.message || "";

    // "Overconstrained" → try again with relaxed constraints automatically
    if (!useRelaxed && (name === "OverconstrainedError" || msg.toLowerCase().includes("constraint"))) {
      setUseRelaxed(true);
      setCamKey((k) => k + 1);
      return;
    }

    // Device busy (another tab/app is using the camera)
    if (name === "NotReadableError" || name === "TrackStartError") {
      setCamError(
        "Camera is in use by another app or browser tab. Close them and click Try Again."
      );
      return;
    }

    // Permission denied or not found
    setCamError(
      "Camera not accessible. Allow camera permission in your browser, then click Try Again."
    );
  }, [useRelaxed]);

  // ── Video constraints ──────────────────────────────────────
  const videoConstraints = useRelaxed
    ? { facingMode: "user" }
    : { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } };

  // ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        Face Verification Photo
      </label>

      <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">

        {/* ── Error state ────────────────────────────────── */}
        {camError ? (
          <div className="flex flex-col items-center justify-center h-52 gap-3 text-slate-500 px-4">
            <VideoOff size={32} className="text-slate-400" />
            <p className="text-sm text-center font-medium text-slate-700">{camError}</p>
            <p className="text-xs text-center text-slate-400">
              Check browser address bar — click the camera icon to allow access, then retry.
            </p>
            <button
              type="button"
              onClick={tryAgain}
              disabled={retrying}
              className="flex items-center gap-2 text-xs text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-5 py-2 rounded-full transition font-medium"
            >
              {retrying ? <><Loader2 size={12} className="animate-spin" /> Retrying...</> : "Try Again"}
            </button>
          </div>

        /* ── Live camera ───────────────────────────────── */
        ) : !capturedImage ? (
          <div className="relative">
            <Webcam
              key={camKey}
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              mirrored={true}
              className="w-full h-52 object-cover"
              videoConstraints={videoConstraints}
              onUserMedia={() => {
                if (!isMounted.current) return;
                setCamError(null);
                setCameraReady(true);
              }}
              onUserMediaError={handleCameraError}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-between py-3 pointer-events-none">
              <span className="bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                Position face in center
              </span>
              {cameraReady && (
                <span className="bg-blue-600/80 text-white text-xs px-3 py-1 rounded-full animate-pulse">
                  Auto-capturing in a moment…
                </span>
              )}
            </div>

            {/* Manual capture button (fallback if auto-capture doesn't fire) */}
            {cameraReady && (
              <button
                type="button"
                onClick={capturePhoto}
                className="absolute bottom-3 right-3 pointer-events-auto text-xs bg-white/90 hover:bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-full shadow transition font-medium"
              >
                Capture now
              </button>
            )}
          </div>

        /* ── Preview captured photo ────────────────────── */
        ) : (
          <div className="relative">
            <img src={capturedImage} alt="Captured" className="w-full h-52 object-cover" />
            <div className="absolute inset-0 flex items-start justify-between p-2 pointer-events-none">
              {uploadSuccess ? (
                <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <Check size={12} /> Photo ready
                </span>
              ) : isUploading ? (
                <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" /> Uploading…
                </span>
              ) : uploadError ? (
                <span className="bg-yellow-500 text-white text-xs px-3 py-1 rounded-full">
                  ⚠ Upload failed — you can still continue
                </span>
              ) : <span />}

              <button
                type="button"
                onClick={retake}
                disabled={isUploading}
                className="pointer-events-auto w-7 h-7 bg-black/60 hover:bg-black/80 disabled:opacity-50 text-white rounded-full flex items-center justify-center shadow transition"
                title="Retake photo"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {uploadError && capturedImage && (
        <p className="flex items-center gap-1.5 text-xs text-amber-600">
          <AlertCircle size={12} /> {uploadError} — you can still proceed.
        </p>
      )}

      {!capturedImage && !camError && (
        <p className="text-xs text-slate-400">
          Good lighting + face centered = better verification accuracy
        </p>
      )}
    </div>
  );
};

export default PhotoCapture;
