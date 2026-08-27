import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MdOutlineArrowBackIos } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { Sparkles, Lightbulb, Shield, Send, ChevronDown, ChevronUp, MessageSquare, X } from "lucide-react";
import axios from "axios";

const BACKEND = "http://localhost:5000";

// ── Tiny sub-components ───────────────────────────────────────────────────────

const TypingDots = () => (
  <div style={{ display: "flex", gap: 4, padding: "4px 2px" }}>
    {[0, 1, 2].map((i) => (
      <span key={i} style={{
        width: 7, height: 7, borderRadius: "50%", background: "#6366f1",
        display: "inline-block",
        animation: "bounce 1.2s infinite ease-in-out",
        animationDelay: `${i * 0.18}s`,
      }} />
    ))}
    <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-5px);opacity:1} }`}</style>
  </div>
);

// ── QuestionChat — one expandable chat panel per question ─────────────────────
const QuestionChat = ({ question, questionIndex, role }) => {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([]);   // {role:"user"|"assistant", content, ts}
  const [history,  setHistory]  = useState([]);   // raw history for API
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  // Seed with the coach's opening message when first opened
  const initCoach = useCallback(async () => {
    if (messages.length > 0) return;   // already initialised

    const openingMsg = `Let's work on this question together:\n\n"${question}"\n\nGo ahead — give me your answer, and I'll coach you through it step by step.`;
    setMessages([{ role: "assistant", content: openingMsg, ts: Date.now() }]);
  }, [messages.length, question]);

  useEffect(() => {
    if (open) {
      initCoach();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, initCoach]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError("");

    const userMsg = { role: "user", content: text, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data } = await axios.post(`${BACKEND}/chat-on-question`, {
        question,
        role:         role || "software engineer",
        user_message: text,
        history:      history,  // send full prior history
      }, {
        headers: localStorage.getItem("token")
          ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
          : {},
      });

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply, ts: Date.now() },
        ]);
        setHistory(data.history);  // store updated history from server
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err) {
      console.error("Chat error:", err);
      setError("⚠️ Connection failed. Make sure the Python server is running on port 5000.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I couldn't connect right now. Please check the server and try again.",
          ts: Date.now(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const msgCount = messages.filter((m) => m.role === "user").length;

  return (
    <div style={{
      marginTop: 12,
      border: "1.5px solid",
      borderColor: open ? "#6366f1" : "#e5e7eb",
      borderRadius: 14,
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}>
      {/* Toggle header */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          background: open ? "#eef2ff" : "#f9fafb",
          border: "none",
          cursor: "pointer",
          transition: "background 0.2s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MessageSquare size={16} color={open ? "#6366f1" : "#9ca3af"} />
          <span style={{ fontSize: 13, fontWeight: 600, color: open ? "#4f46e5" : "#6b7280" }}>
            Practice with AI Coach
          </span>
          {msgCount > 0 && (
            <span style={{
              background: "#6366f1", color: "#fff", fontSize: 11,
              borderRadius: 10, padding: "1px 7px", fontWeight: 700,
            }}>
              {msgCount} exchange{msgCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {open ? <ChevronUp size={16} color="#6366f1" /> : <ChevronDown size={16} color="#9ca3af" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{ background: "#fff" }}>
          {/* Messages */}
          <div style={{
            height: 340,
            overflowY: "auto",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "80%",
                  padding: "10px 14px",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : msg.isError ? "#fef2f2" : "#f3f4f6",
                  color: msg.role === "user" ? "#fff" : msg.isError ? "#dc2626" : "#1f2937",
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  border: msg.isError ? "1px solid #fecaca" : "none",
                  whiteSpace: "pre-wrap",
                }}>
                  {msg.content}
                  <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4, textAlign: "right" }}>
                    {new Date(msg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  background: "#f3f4f6",
                  borderRadius: "18px 18px 18px 4px",
                  padding: "10px 16px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}>
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Error banner */}
          {error && (
            <div style={{
              margin: "0 12px 8px",
              padding: "8px 12px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              fontSize: 12,
              color: "#dc2626",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              {error}
              <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={13} color="#dc2626" />
              </button>
            </div>
          )}

          {/* Input area */}
          <div style={{
            padding: "10px 12px",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            gap: 8,
            alignItems: "flex-end",
            background: "#fafafa",
          }}>
            <textarea
              ref={inputRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
              placeholder="Type your answer or reply… (Enter to send)"
              style={{
                flex: 1,
                padding: "9px 13px",
                fontSize: 13,
                border: "1.5px solid #d1d5db",
                borderRadius: 10,
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
                lineHeight: 1.5,
                background: "#fff",
                transition: "border-color 0.2s",
                maxHeight: 100,
              }}
              onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: "none",
                background: loading || !input.trim()
                  ? "#e5e7eb"
                  : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.2s, transform 0.1s",
              }}
              onMouseOver={(e) => { if (!loading && input.trim()) e.currentTarget.style.transform = "scale(1.07)"; }}
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <Send size={16} color={loading || !input.trim() ? "#9ca3af" : "#fff"} />
            </button>
          </div>

          {/* Hint footer */}
          <div style={{
            padding: "6px 16px 10px",
            fontSize: 11,
            color: "#9ca3af",
            textAlign: "center",
          }}>
            The coach will keep drilling deeper until you skip to the next question
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Scorecard component ──────────────────────────────────────────────────

const Scorecard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    scores = {},
    questions = [],
    questionScores = {},
    submittedAnswers = {},
    aiFeedback = {},
    overallBand = "",
    overallMessage = "",
    globalImprovementTips = [],
    extraDimensions = {},
    violations: navViolations = [],
    violationCount: navViolationCount = 0,
    terminated = false,
    terminationReason = "",
  } = location.state || {};

  const [generatedAnswers, setGeneratedAnswers] = useState({});
  const [loadingIndex,     setLoadingIndex]     = useState(null);
  const [errorIndex,       setErrorIndex]       = useState(null);
  const [role,             setRole]             = useState("");
  const [sessionId,        setSessionId]        = useState("");
  const [violations,       setViolations]       = useState(navViolations);
  const [totalViolations,  setTotalViolations]  = useState(
    navViolationCount > 0 ? navViolationCount : navViolations.length
  );
  const savedRef = useRef(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("interviewData") || "{}");
      setRole(stored.role || "");
      setSessionId(stored.session_id || stored.sessionId || "");
      if (navViolations.length === 0 && Array.isArray(stored.violations)) {
        setViolations(stored.violations);
        setTotalViolations(stored.violations.length);
      }
    } catch (e) {
      console.warn("Could not read interviewData from localStorage", e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (savedRef.current) return;
    if (!questions.length || !role) return;
    savedRef.current = true;

    const save = async () => {
      try {
        const token = localStorage.getItem("token");
        await axios.post(
          "http://localhost:8000/api/scorecards",
          {
            scores, questions, questionScores, submittedAnswers,
            aiFeedback, overallBand, overallMessage,
            globalImprovementTips, extraDimensions,
            role, sessionId,
          },
          { headers: { Authorization: token ? `Bearer ${token}` : "" } }
        );
      } catch (err) {
        console.error("Failed to save scorecard:", err);
      }
    };
    save();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, sessionId, questions.length]);

  const cleanAnswerText = (text = "") =>
    text.replace(/\r\n/g, "\n").replace(/\*\*(.*?)\*\*/g, "$1");

  const handleGenerateAnswer = async (index, question) => {
    try {
      setLoadingIndex(index);
      setErrorIndex(null);
      const res = await axios.post(`${BACKEND}/generate-answer`, {
        question,
        role: role || "",
      }, {
        headers: localStorage.getItem("token")
          ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
          : {},
      });
      if (!res.data?.success) throw new Error(res.data?.error || "Failed");
      setGeneratedAnswers((prev) => ({ ...prev, [index]: res.data.answer || "" }));
    } catch (err) {
      console.error("Generate answer error:", err);
      setErrorIndex(index);
    } finally {
      setLoadingIndex(null);
    }
  };

  const bandMeta = (() => {
    if (terminated) return { label: "Terminated", emoji: "⛔", bg: "bg-red-100", text: "text-red-700", border: "border-red-300" };
    const band = (overallBand || "").toLowerCase();
    if (band === "excellent")   return { label: "Excellent",  emoji: "🚀", bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300" };
    if (band === "good")        return { label: "Good",       emoji: "👍", bg: "bg-blue-100",    text: "text-blue-700",    border: "border-blue-300" };
    if (band === "average")     return { label: "Average",    emoji: "📊", bg: "bg-amber-100",   text: "text-amber-700",   border: "border-amber-300" };
    if (band.includes("needs")) return { label: "Needs Work", emoji: "📚", bg: "bg-red-100",     text: "text-red-700",     border: "border-red-300" };
    if (band === "fail")        return { label: "Fail",       emoji: "⛔", bg: "bg-red-100",     text: "text-red-700",     border: "border-red-300" };
    return                             { label: "Summary",    emoji: "📊", bg: "bg-gray-100",    text: "text-gray-700",    border: "border-gray-300" };
  })();

  const overallScorePct  = Math.min(100, Number(scores?.overallScore || 0) * 10);
  const fluencyVal       = Number(scores?.fluency           || 0);
  const confidenceVal    = Number(scores?.confidence        || 0);
  const technicalVal     = Number(scores?.technicalAccuracy || 0);
  const keywordVal       = Number(scores?.keywordUsage      || 0);
  const questionScoresArr = questions.map((_, i) => Number(questionScores[i] || 0));

  const extra = extraDimensions || {};
  const extraItems = [
    { key: "depth",                label: "Depth",     value: extra.depth                || 0 },
    { key: "structure",            label: "Structure", value: extra.structure            || 0 },
    { key: "relevance",            label: "Relevance", value: extra.relevance            || 0 },
    { key: "exampleQuality",       label: "Examples",  value: extra.exampleQuality       || 0 },
    { key: "communicationClarity", label: "Clarity",   value: extra.communicationClarity || 0 },
  ];

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800">

      {/* Header */}
      <div className="relative flex items-center justify-between mb-8">
        <Button
          onClick={() => navigate("/")}
          className="bg-white border shadow-sm text-gray-700 hover:bg-gray-100 rounded-full px-3 py-2"
        >
          <MdOutlineArrowBackIos size={18} />
        </Button>

        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-bold tracking-wide text-gray-800">🏆 Interview Results</h1>
          {role && (
            <div className="mt-1 text-sm text-gray-600">
              Role: <span className="font-medium">{role.replace(/_/g, " ")}</span>
            </div>
          )}
          {sessionId && (
            <div className="mt-1 text-xs text-gray-400">Session: {String(sessionId).slice(0, 8)}…</div>
          )}
        </div>

        <div className="w-[40px]" />
      </div>

      {terminated && (
        <div className="max-w-6xl mx-auto mb-6 p-5 bg-red-50 border-2 border-red-300 rounded-3xl">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⛔</span>
            <div>
              <h2 className="text-lg font-bold text-red-800">Interview Terminated</h2>
              <p className="text-sm text-red-700">{terminationReason || "Your interview was terminated early."}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top row */}
        <div className="grid md:grid-cols-[1.4fr,1fr] gap-6">

          {/* Performance card */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-700">
                <span>{bandMeta.emoji}</span> Your Performance Summary
              </h2>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${bandMeta.bg} ${bandMeta.text} ${bandMeta.border}`}>
                {bandMeta.emoji} {bandMeta.label}
              </span>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex flex-col items-center">
                <div className="relative w-40 h-40 mb-2">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                    <circle
                      cx="50" cy="50" r="45"
                      fill="none"
                      stroke="url(#scoreGrad)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${overallScorePct * 2.83} 283`}
                      transform="rotate(-90 50 50)"
                    />
                    <defs>
                      <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="50%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#22c55e" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-3xl font-bold text-gray-700">{overallScorePct.toFixed(1)}%</span>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Overall</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center">Based on all questions and AI evaluation</p>
              </div>

              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Fluency",           score: fluencyVal,    accent: "bg-blue-100 text-blue-700" },
                    { label: "Confidence",         score: confidenceVal, accent: "bg-emerald-100 text-emerald-700" },
                    { label: "Technical Accuracy", score: technicalVal,  accent: "bg-amber-100 text-amber-700 col-span-2" },
                    { label: "Keyword Usage",      score: keywordVal,    accent: "bg-pink-100 text-pink-700" },
                  ].map((item, i) => (
                    <div key={i} className={`px-3 py-2 rounded-xl border border-gray-200 shadow-sm flex flex-col ${item.accent}`}>
                      <span className="text-[11px] uppercase tracking-wide opacity-75">{item.label}</span>
                      <span className="text-lg font-semibold">{item.score.toFixed(1)} / 10</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Deeper Breakdown</p>
                  {extraItems.map((item) => (
                    <div key={item.key} className="flex items-center gap-2">
                      <span className="w-20 text-[11px] text-gray-600">{item.label}</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-400 via-blue-400 to-emerald-400 rounded-full"
                          style={{ width: `${Math.min(100, (item.value || 0) * 10)}%` }}
                        />
                      </div>
                      <span className="w-8 text-[11px] text-gray-600 text-right">
                        {typeof item.value?.toFixed === "function" ? item.value.toFixed(1) : "0.0"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-700">
              {overallMessage || (
                overallScorePct >= 75
                  ? "You demonstrated strong technical knowledge and communication skills."
                  : overallScorePct >= 50
                  ? "Good understanding, but some areas need refinement."
                  : "Consider reviewing core concepts and practising more."
              )}
            </div>
          </div>

          {/* Tips card */}
          <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Lightbulb size={18} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700">How to Improve Next Time</h3>
                <p className="text-xs text-gray-500">Suggestions from your answer analysis</p>
              </div>
            </div>
            {globalImprovementTips?.length ? (
              <ul className="space-y-2 text-sm text-gray-700">
                {globalImprovementTips.map((tip, i) => (
                  <li key={i} className="flex gap-2 items-start">
                    <span className="mt-1 text-amber-500 text-xs">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500">No specific tips generated. Focus on clarity, structure, and real examples.</p>
            )}
            <div className="mt-3 text-[11px] text-gray-400 border-t pt-2">
              Use these points before your next interview.
            </div>
          </div>
        </div>

        {/* Violations */}
        {totalViolations > 0 && (
          <div className="bg-white border border-red-200 rounded-3xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Shield size={20} className="text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">Interview Violations</h3>
                <p className="text-xs text-gray-500">Security issues detected during your session</p>
              </div>
              <span className="px-4 py-2 bg-red-100 text-red-700 font-bold rounded-full text-lg">
                {totalViolations} / 5
              </span>
            </div>

            {totalViolations >= 5 && (
              <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-xl">
                <p className="text-sm font-bold text-red-800">⛔ Maximum Violations Reached</p>
                <p className="text-xs text-red-700 mt-1">Your interview was terminated.</p>
              </div>
            )}

            <div className="space-y-2">
              {violations.length > 0 ? violations.map((v, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <span className="text-xl">
                    {v.type?.includes("fullscreen") ? "📺" : v.type?.includes("eye") ? "👁️" : v.type?.includes("face") ? "😶" : "⚠️"}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">{v.message || v.type || "Violation"}</p>
                    {v.timestamp && <p className="text-[10px] text-red-500">{v.timestamp}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    v.severity === "critical" ? "bg-red-200 text-red-800"
                    : v.severity === "high"   ? "bg-orange-100 text-orange-700"
                    : "bg-yellow-100 text-yellow-700"
                  }`}>{v.severity || "medium"}</span>
                </div>
              )) : (
                <p className="text-sm text-gray-500">No detailed violation records available.</p>
              )}
            </div>
          </div>
        )}

        {/* ── Question Feedback + AI Chat ──────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-indigo-700 flex items-center gap-2">
              🧠 Detailed Question Feedback
            </h2>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-full">
              <MessageSquare size={14} className="text-indigo-600" />
              <span className="text-xs font-medium text-indigo-700">AI coaching available on each question</span>
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">No question data available for this session.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question, index) => {
                const qScore    = questionScoresArr[index] || 0;
                const answer    = submittedAnswers[index];
                const answerTxt =
                  typeof answer === "string"  ? answer
                  : answer?.answer            ? answer.answer
                  : "No answer provided";
                const fb        = aiFeedback[index];
                const fbText    =
                  typeof fb === "string" ? fb
                  : fb?.feedback         ? fb.feedback
                  : fb?.analysis         ? fb.analysis
                  : "";

                return (
                  <div key={index} className="bg-gray-50 border border-gray-200 p-4 rounded-2xl shadow-sm">
                    {/* Question header */}
                    <div className="flex flex-col md:flex-row justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">Question {index + 1}</h3>
                        <p className="text-sm text-gray-600">{question}</p>
                      </div>
                      <div className="flex items-center gap-3 self-start">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-indigo-400 text-indigo-600 hover:bg-indigo-100 flex items-center gap-1 text-xs"
                          onClick={() => handleGenerateAnswer(index, question)}
                          disabled={loadingIndex === index}
                        >
                          {loadingIndex === index ? "Generating…" : <><Sparkles size={14} /> Generate Answer</>}
                        </Button>
                        <div className="flex flex-col items-end">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            qScore >= 8 ? "bg-emerald-100 text-emerald-700"
                            : qScore >= 5 ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                          }`}>
                            {qScore.toFixed(1)} / 10
                          </span>
                          <span className="text-[10px] text-gray-400 mt-1">Question score</span>
                        </div>
                      </div>
                    </div>

                    {/* Your answer */}
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Your Answer</h4>
                      <p className="bg-white border p-3 rounded-xl text-sm text-gray-700 shadow-sm whitespace-pre-wrap">
                        {answerTxt}
                      </p>
                    </div>

                    {/* AI Feedback */}
                    {fb && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">AI Feedback</h4>
                        <div className="bg-white border border-gray-200 p-3 rounded-xl text-sm shadow-sm">
                          {fbText && <p className="mb-2 text-gray-700 whitespace-pre-wrap">{fbText}</p>}
                          {typeof fb === "object" && (
                            <div className="flex flex-wrap gap-2 text-[11px]">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Fluency: {Number(fb.fluency || 0).toFixed(1)}/10</span>
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">Confidence: {Number(fb.confidence || 0).toFixed(1)}/10</span>
                              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full">Technical: {Number(fb.technicalAccuracy || 0).toFixed(1)}/10</span>
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">Keywords: {Number(fb.keywordUsage || 0).toFixed(1)}/10</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* AI suggested answer */}
                    {generatedAnswers[index] && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-indigo-600 uppercase mb-1">AI Suggested Answer</h4>
                        <p className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl text-sm text-indigo-700 whitespace-pre-wrap shadow-sm">
                          {cleanAnswerText(generatedAnswers[index])}
                        </p>
                      </div>
                    )}

                    {errorIndex === index && (
                      <p className="mt-2 text-xs text-red-600">Failed to generate answer. Please try again.</p>
                    )}

                    {/* ★ AI Coaching Chat — the key new feature */}
                    <QuestionChat
                      question={question}
                      questionIndex={index}
                      role={role}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 mb-10 text-center">
          <Button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 px-8 py-2 rounded-full text-sm font-medium text-white shadow-md"
          >
            Finish Interview &amp; Go Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Scorecard;
