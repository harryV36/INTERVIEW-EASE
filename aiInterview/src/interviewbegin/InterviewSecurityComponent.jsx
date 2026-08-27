/**
 * InterviewSecurityComponent.jsx  —  fixed & cleaned
 *
 * Fixes:
 * 1. initializedRef is now local to each effect invocation — no stale state.
 * 2. Removed interval inside effect that was never cleared (monitorFullscreenStatus).
 * 3. Debounce corrected — cooldown stored per-violation-type to avoid false positives.
 * 4. Copy/paste: now only restricted OUTSIDE text inputs (typing answers still works).
 * 5. No alert() calls for low-severity events — less annoying, uses callback only.
 * 6. blur handler is debounced — browser windows legitimately blur on modal dialogs.
 * 7. Cleanup resets all refs correctly so re-mounting works.
 */

import React, { useEffect, useRef } from "react";

const InterviewSecurityComponent = ({ interviewStarted, stopInterview, onViolation }) => {
  const violationCountRef    = useRef(0);
  const lastViolationTimes   = useRef({});   // per-type debounce
  const fullscreenRequestedRef = useRef(false);
  const cleanedUpRef         = useRef(false);

  useEffect(() => {
    if (!interviewStarted) return;

    // Reset per-mount
    violationCountRef.current     = 0;
    lastViolationTimes.current    = {};
    fullscreenRequestedRef.current = false;
    cleanedUpRef.current          = false;

    // ── Violation reporter ─────────────────────────────────────────────────
    const report = (type, message, severity = "medium") => {
      if (cleanedUpRef.current) return;

      const now = Date.now();
      const last = lastViolationTimes.current[type] || 0;
      const cooldown = severity === "low" ? 10_000 : severity === "medium" ? 5_000 : 3_000;

      if (now - last < cooldown) return;          // debounce per type
      lastViolationTimes.current[type] = now;

      violationCountRef.current += 1;
      const count = violationCountRef.current;

      console.warn(`🚨 Security #${count} [${severity}]: ${message}`);

      if (onViolation) {
        onViolation({ type, severity, message, count });
      }

      // Termination is handled exclusively by the parent via onViolation count-check.
      // Do NOT call stopInterview() here — that creates a second submission path
      // that races with the parent's terminateForViolations() and can double-navigate.
    };

    // ── 1. Fullscreen (request once) ───────────────────────────────────────
    const enterFullscreen = () => {
      if (fullscreenRequestedRef.current) return;
      fullscreenRequestedRef.current = true;
      const el = document.documentElement;
      const fn = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
      fn?.call(el).catch(() => {
        fullscreenRequestedRef.current = false;
      });
    };

    const onFullscreenChange = () => {
      const inFS = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      if (!inFS && fullscreenRequestedRef.current) {
        report("fullscreen_exit", "Fullscreen mode exited. Please remain in fullscreen.", "high");
      }
    };

    setTimeout(enterFullscreen, 600);
    document.addEventListener("fullscreenchange",       onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    document.addEventListener("mozfullscreenchange",    onFullscreenChange);
    document.addEventListener("msfullscreenchange",     onFullscreenChange);

    // ── 2. Tab / window visibility ─────────────────────────────────────────
    const onVisibilityChange = () => {
      if (document.hidden) {
        report("tab_switch", "Tab or window switched during interview.", "high");
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // ── 3. Window blur — debounced heavily (legitimate dialogs cause blur) ──
    let blurTimer = null;
    const onBlur = () => {
      blurTimer = setTimeout(() => {
        if (!cleanedUpRef.current && !document.hasFocus()) {
          report("window_blur", "Window lost focus — stay on the interview page.", "medium");
        }
      }, 500);
    };
    const onFocusBack = () => { clearTimeout(blurTimer); };
    window.addEventListener("blur",  onBlur);
    window.addEventListener("focus", onFocusBack);

    // ── 4. Prevent accidental page unload ──────────────────────────────────
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Leaving will end your interview. Are you sure?";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    // ── 5. Right-click ─────────────────────────────────────────────────────
    const onContextMenu = (e) => {
      e.preventDefault();
      report("right_click", "Right-click is disabled during the interview.", "low");
    };
    document.addEventListener("contextmenu", onContextMenu);

    // ── 6. Keyboard shortcuts ──────────────────────────────────────────────
    const onKeyDown = (e) => {
      if (e.key === "F12" ||
          (e.ctrlKey && e.shiftKey && ["I","J","C"].includes(e.key.toUpperCase())) ||
          (e.metaKey && e.altKey  && ["I","J","C"].includes(e.key.toUpperCase()))) {
        e.preventDefault();
        report("devtools", "Developer tools access blocked.", "critical");
      }
      if (e.key === "PrintScreen") {
        e.preventDefault();
        report("screenshot", "Screenshot attempt blocked.", "high");
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
        e.preventDefault();
        report("view_source", "View-source blocked.", "medium");
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        report("print", "Print blocked.", "low");
      }
    };
    document.addEventListener("keydown", onKeyDown);

    // ── 7. Copy/paste — only restricted OUTSIDE form inputs ────────────────
    const isFormInput = (el) => ["INPUT", "TEXTAREA"].includes(el?.tagName || "");

    const onCopy = (e) => {
      if (!isFormInput(e.target)) {
        e.preventDefault();
        report("copy", "Copying is restricted during the interview.", "low");
      }
    };
    const onPaste = (e) => {
      if (!isFormInput(e.target)) {
        e.preventDefault();
        report("paste", "Pasting is restricted during the interview.", "low");
      }
    };
    document.addEventListener("copy",  onCopy);
    document.addEventListener("paste", onPaste);

    // ── 8. DevTools size heuristic (periodic) ─────────────────────────────
    const devToolsInterval = setInterval(() => {
      if (cleanedUpRef.current) return;
      try {
        const wDiff = window.outerWidth  - window.innerWidth;
        const hDiff = window.outerHeight - window.innerHeight;
        if (wDiff > 200 || hDiff > 200) {
          report("devtools_open", "Developer tools appear to be open.", "critical");
        }
      } catch (_) {}
    }, 8_000);

    // ── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      cleanedUpRef.current = true;
      clearTimeout(blurTimer);
      clearInterval(devToolsInterval);

      document.removeEventListener("fullscreenchange",       onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
      document.removeEventListener("mozfullscreenchange",    onFullscreenChange);
      document.removeEventListener("msfullscreenchange",     onFullscreenChange);
      document.removeEventListener("visibilitychange",       onVisibilityChange);
      document.removeEventListener("contextmenu",            onContextMenu);
      document.removeEventListener("keydown",                onKeyDown);
      document.removeEventListener("copy",                   onCopy);
      document.removeEventListener("paste",                  onPaste);
      window.removeEventListener("blur",         onBlur);
      window.removeEventListener("focus",        onFocusBack);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [interviewStarted, stopInterview, onViolation]);

  return null;
};

export default InterviewSecurityComponent;
