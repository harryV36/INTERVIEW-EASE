/**
 * Structure2.jsx  —  Live AI Interview (fixed v4)
 *
 * Fixes in v4:
 * 1. SPEAKING BUG: Send button was disabled when chatInput was empty even if
 *    transcript (spoken answer) was available. Fixed: Send button enables when
 *    EITHER chatInput OR spoken transcript is non-empty.
 * 2. PROMPT MORE INTERACTIVE: Maya's system prompt enhanced to be warmer,
 *    more conversational, ask probing follow-up questions, and feel like a
 *    real human interviewer.
 * 3. AI RESPONSE AFTER SPEAKING: stream_ai_response now always fires after
 *    speech even without typing — the manual_submit event properly triggers AI.
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import { MdOutlineArrowBackIos } from "react-icons/md";
import {
  Mic, MicOff, Volume2, VolumeX, Code, CheckCircle,
  Loader2, AlertCircle, Eye, UserCheck, Shield,
  Activity, MessageSquare, Send,
} from "lucide-react";
import EnhancedVideoSection from "./UnifiedVideoSection";

const BACKEND = "http://localhost:5000";

const RealTimeInterview = () => {
  const navigate = useNavigate();

  // ── Refs ──────────────────────────────────────────────────────────────────
  const sessionIdRef           = useRef("");
  const isListeningRef         = useRef(false);
  const interviewStartedRef    = useRef(false);
  const interviewTerminatedRef = useRef(false);
  const socketRef              = useRef(null);
  const submitInProgressRef    = useRef(false);
  const handleViolationRef     = useRef(null);
  const autoMicTimerRef        = useRef(null);
  const transcriptAccRef       = useRef("");

  // ── State ─────────────────────────────────────────────────────────────────
  const [connected, setConnected]         = useState(false);
  const [sessionId, setSessionId]         = useState("");
  const [role, setRole]                   = useState("");
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion]   = useState("");
  const [questionProgress, setQuestionProgress] = useState({ current: 0, total: 5 });
  const [isListening, setIsListening]           = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [currentTranscript, setCurrentTranscript]   = useState("");
  const [interimTranscript, setInterimTranscript]   = useState("");
  const [chatInput, setChatInput]               = useState("");
  const [aiMessages, setAiMessages]             = useState([]);
  const [currentAiChunk, setCurrentAiChunk]     = useState("");
  const [aiSpeaking, setAiSpeaking]             = useState(false);
  const [aiTyping, setAiTyping]                 = useState(false);
  const [codingMode, setCodingMode]             = useState(false);
  const [codeAnswer, setCodeAnswer]             = useState("");
  const [processingAnswer, setProcessingAnswer] = useState(false);
  const [cueMessage, setCueMessage]             = useState(null);
  const [violations, setViolations]             = useState([]);
  const [violationCount, setViolationCount]     = useState(0);
  const [faceDetected, setFaceDetected]         = useState(false);
  const [cameraSide, setCameraSide]             = useState("right");
  const [cameraSize, setCameraSize]             = useState({ w: 320, h: 240 });

  // ── Small Refs ────────────────────────────────────────────────────────────
  const recognitionRef  = useRef(null);
  const messagesEndRef  = useRef(null);
  const codeTextareaRef = useRef(null);
  const pauseTimerRef   = useRef(null);
  const cueTimerRef     = useRef(null);
  const cameraRef       = useRef(null);
  const isDragging      = useRef(false);
  const isResizing      = useRef(false);
  const resizeStart     = useRef({});
  const dragStartX      = useRef(0);
  const nextLockRef     = useRef(false);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const showCue = useCallback((message, type = "info") => {
    setCueMessage({ message, type });
    if (cueTimerRef.current) clearTimeout(cueTimerRef.current);
    cueTimerRef.current = setTimeout(() => setCueMessage(null), 4500);
  }, []);

  const selectFemaleVoice = useCallback(() => {
    if (!("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    const preferredNames = [
      "Microsoft Aria", "Microsoft Jenny", "Microsoft Zira",
      "Google US English Female", "Google UK English Female",
      "Samantha", "Karen", "Moira", "Tessa",
    ];
    return (
      voices.find((v) => preferredNames.some((name) => v.name.includes(name))) ||
      voices.find((v) => /female|woman|zira|aria|jenny|samantha|karen|moira|tessa/i.test(v.name)) ||
      voices.find((v) => v.lang?.toLowerCase().startsWith("en")) ||
      null
    );
  }, []);

  const speakText = useCallback((text) => {
    if (!("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voice = selectFemaleVoice();
    if (voice) u.voice = voice;
    u.rate = 0.92; u.pitch = 1.08; u.volume = 1;
    u.onstart = () => setAiSpeaking(true);
    u.onend   = () => setAiSpeaking(false);
    u.onerror = () => setAiSpeaking(false);
    window.speechSynthesis.speak(u);
  }, [selectFemaleVoice]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.onvoiceschanged = () => selectFemaleVoice();
    selectFemaleVoice();
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [selectFemaleVoice]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setAiSpeaking(false);
  }, []);

  // ── Session restore ───────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("interviewData") || "{}");
      const sid = stored.session_id || "";
      setSessionId(sid);
      sessionIdRef.current = sid;
      if (stored.role) setRole(stored.role);
      if (!sid) showCue("⚠️ No session found — please upload your resume first.", "error");
    } catch (e) {
      console.error("session restore error", e);
    }
  }, [showCue]);

  // ── terminateForViolations ─────────────────────────────────────────────────
  const terminateForViolations = useCallback(async (count) => {
    if (interviewTerminatedRef.current || submitInProgressRef.current) return;
    interviewTerminatedRef.current = true;
    submitInProgressRef.current    = true;
    setInterviewStarted(false);
    interviewStartedRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
    isListeningRef.current = false;
    stopSpeaking();
    alert("❌ Interview terminated — 5 security violations reached. Score: 0.");
    localStorage.setItem("interview_completed", "true");
    try {
      await axios.post(`${BACKEND}/terminate-interview`, {
        session_id: sessionIdRef.current, reason: "security_violations", violation_count: count,
      });
    } catch (_) {}
    navigate("/feature-individual-student/lets-start/scorecard", {
      replace: true,
      state: {
        terminated: true, terminationReason: "Security violations exceeded limit",
        scores: { overallScore: 0, fluency: 0, confidence: 0, technicalAccuracy: 0, keywordUsage: 0 },
        overallBand: "FAIL",
        overallMessage: "Interview terminated due to multiple security violations.",
        questions: [], questionScores: {}, submittedAnswers: {}, aiFeedback: {},
        globalImprovementTips: ["Follow interview rules and avoid violations in future attempts."],
        extraDimensions: { depth: 0, structure: 0, relevance: 0, exampleQuality: 0, communicationClarity: 0 },
      },
    });
  }, [navigate, stopSpeaking]);

  // ── handleViolation ────────────────────────────────────────────────────────
  const handleViolation = useCallback((v) => {
    const entry = { ...v, id: Date.now(), timestamp: new Date().toLocaleTimeString() };
    setViolations((prev) => [entry, ...prev.slice(0, 4)]);
    setViolationCount((prev) => {
      const next = prev + 1;
      if (next >= 5) terminateForViolations(next);
      return next;
    });
    showCue(`⚠️ ${v.message}`, v.severity === "critical" ? "error" : "warning");
    if (v.severity === "critical" || v.severity === "high") speakText(v.message);
  }, [showCue, speakText, terminateForViolations]);

  useEffect(() => { handleViolationRef.current = handleViolation; }, [handleViolation]);

  // ── Interview complete ────────────────────────────────────────────────────
  const handleInterviewComplete = useCallback(async () => {
    if (interviewTerminatedRef.current || submitInProgressRef.current) return;
    submitInProgressRef.current    = true;
    interviewTerminatedRef.current = true;
    const sid = sessionIdRef.current;
    setInterviewStarted(false);
    interviewStartedRef.current = false;
    showCue("🎉 Interview complete! Generating results…", "success");
    recognitionRef.current?.stop();
    setIsListening(false);
    isListeningRef.current = false;
    stopSpeaking();
    localStorage.setItem("interview_completed", "true");
    await new Promise((r) => setTimeout(r, 1500));
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${BACKEND}/submit-interview`, { session_id: sid }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data.success) {
        const r = res.data.results;
        navigate("/feature-individual-student/lets-start/scorecard", {
          replace: true,
          state: {
            scores:        r.aggregated_scores,
            questions:     r.questions.map((q) => q.question),
            questionScores: r.questions.reduce((a, q, i) => { a[i] = q.score; return a; }, {}),
            submittedAnswers: r.questions.reduce((a, q, i) => { a[i] = { answer: q.answer }; return a; }, {}),
            aiFeedback: r.questions.reduce((a, q, i) => {
              a[i] = {
                feedback: q.feedback || q.analysis || "", analysis: q.analysis || "",
                fluency: q.fluency || 0, confidence: q.confidence || 0,
                technicalAccuracy: q.technicalAccuracy || 0, keywordUsage: q.keywordUsage || 0,
              };
              return a;
            }, {}),
            overallBand:           r.overall_band,
            overallMessage:        r.overall_message,
            globalImprovementTips: r.global_improvement_tips,
            extraDimensions: {
              depth:                r.aggregated_scores.depth               || 0,
              structure:            r.aggregated_scores.structure           || 0,
              relevance:            r.aggregated_scores.relevance           || 0,
              exampleQuality:       r.aggregated_scores.exampleQuality      || 0,
              communicationClarity: r.aggregated_scores.communicationClarity || 0,
            },
            violations, violationCount,
          },
        });
      }
    } catch (err) {
      console.error("submit-interview failed:", err);
      alert("Interview completed but results couldn't be fetched. Please try again.");
    }
  }, [navigate, showCue, stopSpeaking, violations, violationCount]);

  // ── Socket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(BACKEND, {
      transports: ["websocket", "polling"], reconnection: true,
      reconnectionAttempts: 8, reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      const sid = sessionIdRef.current;
      if (sid) socket.emit("join_session", { session_id: sid, token: localStorage.getItem("token") || "" });
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("session_joined", (d) => console.log("✅ Session joined:", d.session_id));

    socket.on("ai_streaming", (d) => {
      if (d.done) {
        setAiTyping(false);
        setCurrentAiChunk("");
        nextLockRef.current = false;
        const text = d.full_text || d.chunk || "";
        if (text && !d.is_greeting) {
          setAiMessages((prev) => [...prev, { role: "assistant", text, ts: Date.now() }]);
          speakText(text);
        }
        setProcessingAnswer(false);
      } else {
        setAiTyping(true);
        setCurrentAiChunk((prev) => prev + (d.chunk || ""));
      }
    });

    socket.on("speech_feedback", (d) => {
      if (d.interim) setInterimTranscript(d.text || "");
      else { setCurrentTranscript(d.accumulated || d.text || ""); setInterimTranscript(""); }
    });

    socket.on("interview_started", (d) => {
      setCurrentQuestion(d.current_question || "");
      setQuestionProgress({ current: 1, total: d.total || 5 });
      setCodingMode(/write|code|implement|function|algorithm|program/i.test(d.current_question || ""));
      transcriptAccRef.current = "";
      setCurrentTranscript("");
      if (d.greeting) {
        setAiMessages([{ role: "assistant", text: d.greeting, ts: Date.now(), isGreeting: true }]);
        speakText(d.greeting);
      }
    });

    socket.on("question_changed", (d) => {
      setCurrentQuestion(d.question || "");
      setQuestionProgress({ current: (d.index || 0) + 1, total: d.total || 5 });
      setCodingMode(/write|code|implement|function|algorithm|program/i.test(d.question || ""));
      transcriptAccRef.current = "";
      setCurrentTranscript("");
      setCodeAnswer("");
    });

    socket.on("interview_complete", async () => {
      await handleInterviewComplete();
    });
    socket.on("processing_answer", () => setProcessingAnswer(true));
    socket.on("interviewer_cue", (d) => showCue(d.message || "", "info"));
    socket.on("violation_detected", (v) => handleViolationRef.current?.(v));
    socket.on("face_verification_status", (d) => {
      if (d.matched) showCue("✅ Identity verified — face matched", "success");
    });
    socket.on("error", (d) => { showCue("⚠️ " + d.message, "error"); });

    return () => {
      if (pauseTimerRef.current)   clearTimeout(pauseTimerRef.current);
      if (cueTimerRef.current)     clearTimeout(cueTimerRef.current);
      if (autoMicTimerRef.current) clearTimeout(autoMicTimerRef.current);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sessionIdRef.current = sessionId;
    if (socketRef.current?.connected && sessionId) {
      socketRef.current.emit("join_session", { session_id: sessionId, token: localStorage.getItem("token") || "" });
    }
  }, [sessionId]);

  // ── Speech recognition ────────────────────────────────────────────────────
  useEffect(() => {
    const SpeechRec = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRec) return;
    setRecognitionSupported(true);

    const rec = new SpeechRec();
    rec.continuous = true; rec.interimResults = true;
    rec.lang = "en-US"; rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      let interim = "";
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalChunk += t + " ";
        else interim = t;
      }

      if (finalChunk.trim() && socketRef.current?.connected) {
        socketRef.current.emit("speech_chunk", {
          session_id: sessionIdRef.current, text: finalChunk.trim(), is_final: true,
        });
        // Add spoken text to chat as user message (visible feedback)
        setAiMessages((prev) => {
          // Don't duplicate if last message is the same
          const last = prev[prev.length - 1];
          if (last?.role === "user" && last?.text === finalChunk.trim()) return prev;
          return [...prev, { role: "user", text: finalChunk.trim(), ts: Date.now(), isSpoken: true }];
        });
        transcriptAccRef.current = (transcriptAccRef.current + " " + finalChunk).trim();
        setCurrentTranscript(transcriptAccRef.current);
      }

      if (interim && socketRef.current?.connected) {
        socketRef.current.emit("speech_chunk", {
          session_id: sessionIdRef.current, text: interim, is_final: false,
        });
        setInterimTranscript(interim);
      }
    };

    rec.onerror = (e) => {
      if (e.error === "no-speech") return;
      if (e.error === "not-allowed") {
        showCue("⚠️ Microphone access denied. Allow microphone in browser settings.", "error");
        setIsListening(false); isListeningRef.current = false;
      }
    };

    rec.onend = () => {
      if (isListeningRef.current && interviewStartedRef.current && !interviewTerminatedRef.current) {
        try { rec.start(); } catch (_) {}
      }
    };

    recognitionRef.current = rec;
    return () => { try { rec.abort(); } catch (_) {} window.speechSynthesis?.cancel(); };
  }, [showCue]);

  // ── Controls ──────────────────────────────────────────────────────────────
  const startInterview = () => {
    const sid = sessionIdRef.current;
    if (!sid) { showCue("⚠️ No session found — please upload your resume first.", "error"); return; }
    if (!socketRef.current?.connected) { showCue("⚠️ Not connected to server. Please wait…", "error"); return; }
    if (!faceDetected) showCue("⚠️ No face detected — please centre your face in the camera.", "warning");
    setInterviewStarted(true);
    interviewStartedRef.current = true;
    socketRef.current.emit("start_interview", { session_id: sid, token: localStorage.getItem("token") || "" });
    autoMicTimerRef.current = setTimeout(() => {
      if (interviewStartedRef.current && !isListeningRef.current) toggleListening();
    }, 3000);
  };

  const stopInterview = useCallback(async () => {
    if (!window.confirm("End the interview? Your responses will be submitted.")) return;
    await handleInterviewComplete();
  }, [handleInterviewComplete]);

  const toggleListening = async () => {
    if (!recognitionSupported) { showCue("⚠️ Speech recognition not supported in this browser.", "error"); return; }
    if (isListeningRef.current) {
      recognitionRef.current?.stop();
      setIsListening(false); isListeningRef.current = false; setInterimTranscript("");
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        recognitionRef.current?.start();
        setIsListening(true); isListeningRef.current = true;
        showCue("🎤 Listening — speak naturally", "success");
      } catch (err) {
        showCue("⚠️ " + (err.name === "NotAllowedError"
          ? "Microphone access denied. Allow microphone in browser settings."
          : "Cannot access microphone: " + err.message), "error");
      }
    }
  };

  const requestNextQuestion = () => {
    if (!socketRef.current?.connected) return;
    if (nextLockRef.current) return;
    nextLockRef.current = true;
    setProcessingAnswer(true);
    const spokenAnswer = transcriptAccRef.current.trim();
    socketRef.current.emit("request_next_question", {
      session_id: sessionIdRef.current,
      question: currentQuestion,
      question_index: Math.max(0, questionProgress.current - 1),
      answer_override: spokenAnswer || undefined,
    });
    transcriptAccRef.current = "";
    setCurrentTranscript(""); setInterimTranscript("");
  };

  // ── FIX: sendChatMessage now works with EITHER typed text OR spoken transcript ──
  const sendChatMessage = () => {
    const typed  = chatInput.trim();
    const spoken = transcriptAccRef.current.trim();
    // Use typed input first; fall back to speech transcript
    const text   = typed || spoken;

    if (!text || !socketRef.current?.connected || !sessionIdRef.current) return;
    if (processingAnswer || aiTyping) return;

    // Add to chat immediately as user message
    setAiMessages((prev) => [...prev, { role: "user", text, ts: Date.now() }]);
    setChatInput("");

    // Clear transcript if it was used as the answer
    if (!typed && spoken) {
      transcriptAccRef.current = "";
      setCurrentTranscript("");
      setInterimTranscript("");
    }

    // Emit to server — this triggers AI response
    socketRef.current.emit("manual_submit", {
      session_id: sessionIdRef.current,
      answer: text,
      question: currentQuestion,
      question_index: Math.max(0, questionProgress.current - 1),
    });
  };

  // ── FIX: Also allow submitting spoken answer directly without typing ──────
  const submitSpokenAnswer = () => {
    const spoken = transcriptAccRef.current.trim();
    if (!spoken) {
      showCue("💬 No spoken answer detected yet. Start speaking first.", "warning");
      return;
    }
    sendChatMessage(); // reuses the same logic
  };

  const submitCodeAnswer = () => {
    if (!codeAnswer.trim()) { showCue("⚠️ Write your code first.", "error"); return; }
    if (!socketRef.current?.connected) return;
    socketRef.current.emit("manual_submit", {
      session_id: sessionIdRef.current,
      answer: codeAnswer,
      question: currentQuestion,
      question_index: Math.max(0, questionProgress.current - 1),
    });
    setAiMessages((prev) => [...prev, { role: "user", text: codeAnswer, ts: Date.now(), isCode: true }]);
    setCodeAnswer("");
    showCue("✅ Code submitted", "success");
  };

  // ── Camera drag-to-snap ───────────────────────────────────────────────────
  const onCameraMouseDown = (e) => {
    if (isResizing.current) return;
    e.preventDefault(); dragStartX.current = e.clientX; isDragging.current = true;
    const onUp = (ev) => {
      isDragging.current = false;
      setCameraSide(ev.clientX < window.innerWidth / 2 ? "left" : "right");
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mouseup", onUp);
  };

  const onResizeMouseDown = (e) => {
    e.preventDefault(); e.stopPropagation();
    isResizing.current = true;
    resizeStart.current = { w: cameraSize.w, h: cameraSize.h, x: e.clientX, y: e.clientY };
    const onMove = (ev) => {
      const dx = ev.clientX - resizeStart.current.x;
      const dir = cameraSide === "right" ? -1 : 1;
      const newW = Math.max(240, Math.min(480, resizeStart.current.w + dir * dx));
      setCameraSize({ w: newW, h: Math.round(newW * 0.75) });
    };
    const onUp = () => {
      isResizing.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages, currentAiChunk]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const hasSpokenContent = currentTranscript.trim().length > 0;
  const canSendMessage = interviewStarted && !processingAnswer && !aiTyping &&
    (chatInput.trim().length > 0 || hasSpokenContent);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-900 overflow-hidden select-none">

      {/* TOP NAV */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/feature-individual-student/lets-start">
            <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm transition-colors">
              <MdOutlineArrowBackIos size={14} /> Exit
            </button>
          </Link>
          <div className="h-4 w-px bg-gray-200" />
          <span className="text-gray-800 font-semibold text-sm">Live AI Interview</span>
          {role && (
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-200">
              {role.replace(/_/g, " ")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            connected ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            {connected ? "Connected" : "Disconnected"}
          </div>

          {sessionId && (
            <div className="px-2.5 py-1 rounded-full text-xs font-mono bg-gray-100 text-gray-500 border border-gray-200">
              {sessionId.slice(0, 8)}
            </div>
          )}

          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            violationCount > 3 ? "bg-red-50 text-red-700 border-red-200" : "bg-gray-100 text-gray-500 border-gray-200"
          }`}>
            <Shield size={12} /> {violationCount}/5
          </div>

          {!interviewStarted ? (
            <button onClick={startInterview} disabled={!connected || !sessionId}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors">
              Start Interview
            </button>
          ) : (
            <button onClick={stopInterview}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors">
              End Interview
            </button>
          )}
        </div>
      </header>

      {/* ALERT BANNER */}
      {cueMessage && (
        <div className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium flex-shrink-0 ${
          cueMessage.type === "error"   ? "bg-red-50 text-red-700 border-b border-red-200"
          : cueMessage.type === "success" ? "bg-green-50 text-green-700 border-b border-green-200"
          : cueMessage.type === "warning" ? "bg-amber-50 text-amber-700 border-b border-amber-200"
          : "bg-sky-50 text-sky-700 border-b border-sky-200"
        }`}>
          <AlertCircle size={15} /> {cueMessage.message}
        </div>
      )}

      {/* PROGRESS */}
      {interviewStarted && (
        <div className="flex-shrink-0 px-6 py-2 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 whitespace-nowrap">Q {questionProgress.current}/{questionProgress.total}</span>
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-700"
                style={{ width: `${(questionProgress.current / questionProgress.total) * 100}%` }} />
            </div>
            <span className="text-xs text-gray-500">{Math.round((questionProgress.current / questionProgress.total) * 100)}%</span>
          </div>
        </div>
      )}

      {/* MAIN */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT */}
        <div className="flex flex-col w-[56%] border-r border-gray-200 overflow-hidden">

          {/* Question */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">Current Question</span>
              {codingMode && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-700 rounded text-xs border border-violet-200">
                  <Code size={10} /> Coding
                </span>
              )}
            </div>
            <p className="text-gray-900 text-base font-medium leading-relaxed">
              {currentQuestion || <span className="text-gray-400 italic">Question will appear here once the interview starts…</span>}
            </p>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center ${aiTyping || aiSpeaking ? "animate-pulse" : ""}`}>
                    <Volume2 size={16} className="text-white" />
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                    aiSpeaking ? "bg-green-500 animate-pulse" : aiTyping ? "bg-yellow-400" : "bg-gray-400"
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Maya — AI Interviewer</p>
                  <p className="text-xs text-gray-500">{aiSpeaking ? "Speaking…" : aiTyping ? "Thinking…" : "Listening for your answer"}</p>
                </div>
              </div>
              {aiSpeaking && (
                <button onClick={stopSpeaking} className="flex items-center gap-1.5 px-3 py-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100">
                  <VolumeX size={12} /> Mute
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 custom-scrollbar">
              {aiMessages.length === 0 && !aiTyping && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare size={40} className="text-gray-300 mb-3" />
                  <p className="text-gray-400 text-sm">Start the interview to begin the conversation</p>
                  <p className="text-gray-300 text-xs mt-1">Maya will introduce herself and ask your first question</p>
                </div>
              )}

              {aiMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? msg.isCode
                        ? "bg-slate-800 text-green-300 font-mono text-xs rounded-br-sm"
                        : msg.isSpoken
                        ? "bg-blue-500 text-white rounded-br-sm border border-blue-400"
                        : "bg-blue-600 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 border border-gray-200 rounded-bl-sm"
                  }`}>
                    {msg.isSpoken && (
                      <p className="text-[9px] text-blue-200 mb-1 flex items-center gap-1">
                        <Mic size={8} /> Spoken
                      </p>
                    )}
                    <p className={msg.isCode ? "whitespace-pre-wrap text-xs" : ""}>{msg.text}</p>
                    <p className="text-[10px] opacity-40 mt-1">{new Date(msg.ts).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}

              {aiTyping && currentAiChunk && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-sm bg-gray-100 border border-gray-200">
                    <p className="text-sm text-gray-800 leading-relaxed">{currentAiChunk}</p>
                    <div className="flex gap-1 mt-2">
                      {[0, 0.15, 0.3].map((d, i) => (
                        <div key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input section — FIXED */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-white space-y-3">

              {/* Mic + Next row */}
              <div className="flex gap-3">
                <button onClick={toggleListening} disabled={!interviewStarted}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    isListening ? "bg-red-600 hover:bg-red-700 text-white animate-pulse" : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}>
                  {isListening ? <><Mic size={16} /> Listening — Click to Stop</> : <><MicOff size={16} /> Start Speaking</>}
                </button>

                {/* Submit spoken answer button — only shows when there's spoken content */}
                {hasSpokenContent && interviewStarted && (
                  <button
                    onClick={submitSpokenAnswer}
                    disabled={processingAnswer || aiTyping}
                    className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl"
                    title="Submit spoken answer to AI"
                  >
                    <Send size={15} /> Submit Voice
                  </button>
                )}

                <button onClick={requestNextQuestion} disabled={!interviewStarted || processingAnswer || aiTyping}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl">
                  {processingAnswer ? <Loader2 size={15} className="animate-spin" /> : "Next ›"}
                </button>
              </div>

              {/* Type or submit row */}
              <div className="flex gap-2">
                <input type="text" value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                  disabled={!interviewStarted || processingAnswer || aiTyping}
                  placeholder={hasSpokenContent ? "Type to add more, or click Send to submit spoken answer…" : "Type your answer here… (or use mic above)"}
                  className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 disabled:opacity-40 bg-gray-50 text-gray-800 placeholder-gray-400"
                />
                {/* FIX: Send button enables when EITHER typed text OR spoken transcript exists */}
                <button onClick={sendChatMessage}
                  disabled={!canSendMessage}
                  className={`px-4 py-2 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 ${
                    hasSpokenContent && !chatInput.trim()
                      ? "bg-violet-600 hover:bg-violet-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                  title={hasSpokenContent && !chatInput.trim() ? "Send spoken answer" : "Send typed answer"}
                >
                  {hasSpokenContent && !chatInput.trim() ? (
                    <span className="flex items-center gap-1"><Mic size={13} /> Send</span>
                  ) : "Send"}
                </button>
              </div>

              {/* Transcript display */}
              {(currentTranscript || interimTranscript) && (
                <div className="px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[10px] text-blue-400 font-medium uppercase tracking-wide flex items-center gap-1">
                      <Mic size={9} /> Transcript
                    </p>
                    {currentTranscript && (
                      <button
                        onClick={() => { transcriptAccRef.current = ""; setCurrentTranscript(""); setInterimTranscript(""); }}
                        className="text-[9px] text-blue-300 hover:text-blue-500"
                      >
                        clear
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {currentTranscript}
                    {interimTranscript && <span className="text-violet-500 italic"> {interimTranscript}</span>}
                  </p>
                  {currentTranscript && (
                    <p className="text-[9px] text-blue-300 mt-1">
                      Click "Send" or "Submit Voice" to send this to Maya →
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col w-[44%] overflow-hidden">
          <div className="flex-shrink-0 grid grid-cols-3 divide-x divide-gray-200 border-b border-gray-200 bg-white">
            {[
              { icon: isListening ? <Mic size={16} className="text-green-600 animate-pulse" /> : <MicOff size={16} className="text-gray-400" />, label: isListening ? "Recording" : "Mic Off", sub: "Microphone", active: isListening },
              { icon: aiSpeaking ? <Volume2 size={16} className="text-blue-600 animate-pulse" /> : <VolumeX size={16} className="text-gray-400" />, label: aiSpeaking ? "Speaking" : "Silent", sub: "AI Voice", active: aiSpeaking },
              { icon: processingAnswer ? <Loader2 size={16} className="text-violet-600 animate-spin" /> : <Activity size={16} className="text-gray-400" />, label: processingAnswer ? "Analyzing" : "Idle", sub: "AI Status", active: processingAnswer },
            ].map((item, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-2.5">
                {item.icon}
                <div>
                  <p className="text-xs font-medium text-gray-700">{item.label}</p>
                  <p className="text-[10px] text-gray-400">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-4">
            {/* How to answer guide */}
            {interviewStarted && !processingAnswer && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-blue-700 mb-1.5">💡 How to answer</p>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li>• <strong>Speak:</strong> Click "Start Speaking" → talk naturally → click "Submit Voice" or "Send"</li>
                  <li>• <strong>Type:</strong> Write in the box below and press Enter or Send</li>
                  <li>• <strong>Next Q:</strong> Click "Next ›" to move on after Maya responds</li>
                </ul>
              </div>
            )}

            {/* Proctoring */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Shield size={12} /> Proctoring
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 rounded-lg p-2.5 text-center border border-gray-100">
                  <UserCheck size={18} className={`mx-auto mb-1 ${faceDetected ? "text-green-600" : "text-gray-400"}`} />
                  <p className="text-[10px] text-gray-400">Face</p>
                  <p className={`text-xs font-semibold ${faceDetected ? "text-green-600" : "text-gray-400"}`}>{faceDetected ? "OK" : "—"}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center border border-gray-100">
                  <Eye size={18} className="mx-auto mb-1 text-blue-500" />
                  <p className="text-[10px] text-gray-400">Gaze</p>
                  <p className="text-xs font-semibold text-blue-600">CENTER</p>
                </div>
                <div className={`bg-gray-50 rounded-lg p-2.5 text-center border ${violationCount > 3 ? "border-red-300 bg-red-50" : "border-gray-100"}`}>
                  <AlertCircle size={18} className={`mx-auto mb-1 ${violationCount > 3 ? "text-red-500" : "text-gray-400"}`} />
                  <p className="text-[10px] text-gray-400">Alerts</p>
                  <p className={`text-xs font-semibold ${violationCount > 3 ? "text-red-600" : "text-gray-500"}`}>{violationCount}/5</p>
                </div>
              </div>
              {violations.length > 0 && (
                <div className="mt-3 space-y-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                  {violations.map((v) => (
                    <div key={v.id} className="flex items-start gap-2 p-2 bg-red-50 rounded-lg border border-red-200">
                      <AlertCircle size={11} className="text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-red-700">{v.message}</p>
                        <p className="text-[9px] text-red-400">{v.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Code editor */}
            {codingMode && interviewStarted && (
              <div className="bg-white rounded-xl border border-violet-200 p-4">
                <h3 className="text-xs font-semibold text-violet-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Code size={12} /> Code Editor
                </h3>
                <textarea ref={codeTextareaRef} value={codeAnswer} onChange={(e) => setCodeAnswer(e.target.value)}
                  placeholder="// Write your solution here…" spellCheck={false}
                  className="w-full h-52 bg-slate-900 text-green-300 font-mono text-xs p-3 rounded-lg border border-gray-200 focus:border-violet-400 focus:outline-none resize-none leading-relaxed" />
                <div className="mt-2 flex justify-end">
                  <button onClick={submitCodeAnswer} disabled={!codeAnswer.trim() || processingAnswer}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg">
                    {processingAnswer ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : <><CheckCircle size={14} /> Submit Code</>}
                  </button>
                </div>
              </div>
            )}

            {/* Ready card */}
            {!interviewStarted && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare size={22} className="text-blue-500" />
                </div>
                <p className="text-sm text-gray-700 font-medium mb-1">Ready to begin?</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Ensure your face is visible in the camera, then click <strong className="text-gray-700">Start Interview</strong> above.
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Maya will greet you and ask questions. Respond by speaking or typing.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PiP CAMERA */}
      <div ref={cameraRef} onMouseDown={onCameraMouseDown} className="fixed z-50"
        style={{ bottom: 16, [cameraSide === "right" ? "right" : "left"]: 16, cursor: "grab" }}>
        <div className="relative rounded-xl overflow-hidden shadow-2xl bg-black"
          style={{ width: cameraSize.w, height: cameraSize.h, boxShadow: "0 8px 32px rgba(0,0,0,0.35)" }}>
          <EnhancedVideoSection
            sessionId={sessionId} interviewStarted={interviewStarted}
            stopInterview={stopInterview} onViolation={handleViolation} onFaceDetected={setFaceDetected}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-1.5 flex items-center justify-between pointer-events-none">
            <span className="text-[10px] text-white/80 font-medium">Your Camera</span>
            <span className={`text-[10px] font-semibold ${faceDetected ? "text-green-400" : "text-red-400"}`}>
              {faceDetected ? "● Face OK" : "● No Face"}
            </span>
          </div>
          <div onMouseDown={onResizeMouseDown}
            className={`absolute top-0 ${cameraSide === "right" ? "left-0 cursor-nw-resize" : "right-0 cursor-ne-resize"} w-5 h-5 opacity-0 hover:opacity-100 flex items-center justify-center`}
            style={{ pointerEvents: "auto" }}>
            <div className="w-3 h-3 border-t-2 border-l-2 border-white/50 rounded-tl-sm"
              style={{ transform: cameraSide === "right" ? "none" : "scaleX(-1)" }} />
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.22); }
      `}</style>
    </div>
  );
};

export default RealTimeInterview;
