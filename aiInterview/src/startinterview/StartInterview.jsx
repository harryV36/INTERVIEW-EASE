import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import {
  AlertCircle, X, Upload, FileText, ChevronDown, ChevronUp,
  Loader2, ArrowRight, Check, Sparkles, TrendingUp, AlertTriangle,
  Lightbulb, Tag, Eye, Shield,
} from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { MdOutlineArrowBackIos } from "react-icons/md";
import TopicsInput from "./components/TopicsInput.jsx";
import PhotoCapture from "./components/PhotoCapture.jsx";
import useSessionId from "./hooks/useSessionId.jsx";

const ROLE_LABELS = {
  frontend: "Frontend Engineer",
  backend: "Backend Engineer",
  fullstack: "Full-stack Engineer",
  data_scientist: "Data Scientist",
  ml_engineer: "ML Engineer",
  devops: "DevOps / SRE",
  mobile: "Mobile Engineer",
  qa: "QA / Test Engineer",
  security: "Security Engineer",
  data_engineer: "Data Engineer",
  product: "Product Manager",
  uiux: "UI/UX Designer",
  manager: "Engineering Manager",
};

const BACKEND = "http://localhost:5000";
const API = "http://localhost:8000";

export default function StartInterview() {
  const navigate = useNavigate();
  const location = useLocation();
  const webcamRef = useRef(null);
  const sessionId = useSessionId();

  const [resumeFile, setResumeFile]     = useState(null);
  const [topics, setTopics]             = useState([]);
  const [topicInput, setTopicInput]     = useState("");
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [resumeData, setResumeData]     = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [isLoading, setIsLoading]       = useState(false);
  const [isAnalyzing, setIsAnalyzing]   = useState(false);
  const [error, setError]               = useState(null);
  const [role, setRole]                 = useState("frontend");
  const [openRole, setOpenRole]         = useState(false);
  const [scheduledToken, setScheduledToken] = useState(null);
  const [scheduledConfig, setScheduledConfig] = useState(null);
  const [scheduledLoading, setScheduledLoading] = useState(false);
  const [scheduledError, setScheduledError] = useState(null);
  const [scheduledNotReadyTime, setScheduledNotReadyTime] = useState(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("interviewData") || "{}");
      if (saved?.role) setRole(saved.role);
    } catch (_) {}
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isScheduled = params.get("scheduled") === "true";
    const token = params.get("token");

    if (!isScheduled) return;
    if (!token) {
      setScheduledError("Invalid scheduled interview link.");
      return;
    }

    setScheduledToken(token);
    setScheduledLoading(true);
    setScheduledError(null);

    axios
      .get(`${API}/api/scheduling/config/${token}`)
      .then((res) => {
        if (res.data?.success) {
          setScheduledConfig(res.data.config);
        } else {
          setScheduledError("Invalid or expired interview link");
        }
      })
      .catch((err) => {
        const status = err.response?.status;
        const scheduledTime = err.response?.data?.scheduledTime;

        if (status === 403 && scheduledTime) {
          setScheduledNotReadyTime(scheduledTime);
          setScheduledError(err.response?.data?.msg || "Interview has not started yet");
          return;
        }

        setScheduledError(err.response?.data?.msg || "Invalid or expired interview link");
      })
      .finally(() => {
        setScheduledLoading(false);
      });
  }, [location.search]);

  const removeTopic = (i) => setTopics((p) => p.filter((_, idx) => idx !== i));

  const startScheduledInterview = async () => {
    if (!scheduledConfig || !scheduledToken) return;

    const authToken = localStorage.getItem("token");
    if (!authToken) {
      setScheduledError("Please log in to start your scheduled interview.");
      return;
    }

    setIsLoading(true);
    setScheduledError(null);

    try {
      const payload = {
        targetJobRole: scheduledConfig.targetJobRole,
        targetCompany: scheduledConfig.targetCompany,
        experienceLevel: scheduledConfig.experienceLevel,
        interviewType: scheduledConfig.interviewType,
        duration: scheduledConfig.duration,
        numberOfQuestions: scheduledConfig.numberOfQuestions,
        difficulty: scheduledConfig.difficulty,
        techStack: scheduledConfig.techStack,
        interviewFocus: scheduledConfig.interviewFocus,
        preferredLanguage: scheduledConfig.preferredLanguage,
        feedbackStyle: scheduledConfig.feedbackStyle,
        customNotes: scheduledConfig.customNotes,
      };

      const sessionRes = await axios.post(
        `${API}/api/ai-interviews/start`,
        payload,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (sessionRes.data?.success && sessionRes.data?.sessionId) {
        await axios.post(
          `${API}/api/scheduling/join`,
          { token: scheduledToken, sessionId: sessionRes.data.sessionId },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

        localStorage.setItem("interviewSessionId", sessionRes.data.sessionId);
        navigate("/feature-individual-student/lets-start/interview-begin");
      } else {
        setScheduledError("Failed to start scheduled interview.");
      }
    } catch (err) {
      setScheduledError(err.response?.data?.msg || "Failed to start scheduled interview.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Upload resume → auto-analyze ──────────────────────────────────────────
  const handleResumeChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeFile(file);
    setResumeData(null);
    setShowAnalysis(true);
    setError(null);

    // Immediately upload & get ATS score + questions
    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append("resume", file);
      fd.append("topics", topics.join(","));
      fd.append("session_id", sessionId);
      fd.append("role", role);
      const token = localStorage.getItem("token");

      const res = await axios.post(`${BACKEND}/upload-resume`, fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = {
        ...res.data,
        session_id: res.data.session_id || sessionId,
        analyzed: false,
      };
      setResumeData(data);

      // Persist to localStorage so interview page has session_id + questions
      localStorage.setItem("interviewSessionId", data.session_id);
      localStorage.setItem("interviewData", JSON.stringify({
        session_id: data.session_id,
        questions:  data.questions,
        role,
        topics,
        ats_score:  data.ats_score,
      }));

      // Auto-trigger deep analysis right after upload
      await runAnalysis(data);
    } catch (err) {
      setError("Resume upload failed: " + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Deep resume analysis ──────────────────────────────────────────────────
  const runAnalysis = async (data) => {
    const textToAnalyze = data?.text_summary || resumeData?.text_summary;
    if (!textToAnalyze) return;
    setIsAnalyzing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${BACKEND}/analyze-resume`, {
        text:       textToAnalyze,
        session_id: sessionId,
        role,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setResumeData((prev) => ({
        ...(prev || data),
        analysis: res.data.analysis,
        analyzed: true,
      }));
      setShowAnalysis(true);
    } catch (err) {
      console.error("Analysis error:", err);
      // Non-fatal — user can retry
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Start interview ───────────────────────────────────────────────────────
  const startInterview = async () => {
    if (!resumeFile)     return setError("Upload your resume first.");
    if (!capturedImage)  return setError("Capture your photo first.");
    if (!sessionId)      return setError("Session ID missing — please refresh.");
    if (!resumeData)     return setError("Resume is still processing, please wait.");

    // Re-upload with final role/topics in case they changed after initial upload
    setIsLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("resume", resumeFile);
      fd.append("topics", topics.join(","));
      fd.append("session_id", sessionId);
      fd.append("role", role);
      const token = localStorage.getItem("token");

      const res = await axios.post(`${BACKEND}/upload-resume`, fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const canonicalId = res.data.session_id || sessionId;
      localStorage.setItem("interviewSessionId", canonicalId);
      localStorage.setItem("interviewData", JSON.stringify({
        session_id: canonicalId,
        questions:  res.data.questions,
        role,
        topics,
        ats_score:  res.data.ats_score,
      }));

      navigate("/feature-individual-student/lets-start/interview-begin");
    } catch (err) {
      setError("Failed to start: " + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const atsScore   = resumeData?.ats_score ?? null;
  const analysis   = resumeData?.analysis;
  const readyToStart = resumeFile && capturedImage;

  const atsColor = atsScore >= 80 ? "text-green-600" : atsScore >= 60 ? "text-yellow-600" : "text-red-600";
  const atsBg    = atsScore >= 80 ? "bg-green-500"  : atsScore >= 60 ? "bg-yellow-500"  : "bg-red-500";
  const atsLabel = atsScore >= 80 ? "Excellent" : atsScore >= 60 ? "Good" : "Needs Work";

  const isScheduledLink = new URLSearchParams(location.search).get("scheduled") === "true";

  if (isScheduledLink) {
    const scheduledDate = scheduledConfig?.scheduledDate
      ? new Date(scheduledConfig.scheduledDate).toLocaleString()
      : null;
    const notReadyDate = scheduledNotReadyTime
      ? new Date(scheduledNotReadyTime).toLocaleString()
      : null;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <Link to="/">
            <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm transition-colors">
              <MdOutlineArrowBackIos size={14} /> Back
            </button>
          </Link>
          <span className="text-sm font-semibold text-gray-700">Scheduled Interview</span>
          <span className="text-xs text-gray-400 font-mono">scheduled</span>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-10">
          {scheduledError && (
            <div className="mb-5 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              <AlertCircle size={16} />
              <span className="flex-1">{scheduledError}</span>
              <button onClick={() => setScheduledError(null)}><X size={14} /></button>
            </div>
          )}
          {notReadyDate && (
            <div className="mb-5 flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-sm">
              <AlertCircle size={16} />
              <span className="flex-1">Scheduled for {notReadyDate}. Please come back later.</span>
            </div>
          )}

          {scheduledLoading ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm text-center">
              <Loader2 size={24} className="animate-spin mx-auto mb-3 text-blue-600" />
              <p className="text-sm text-gray-500">Loading interview details...</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                {scheduledConfig?.title || "Interview"}
              </h1>
              <p className="text-sm text-gray-500 mb-4">
                {scheduledConfig?.description || "Your interview is ready to start."}
              </p>

              <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-600">
                <div><strong>Role:</strong> {scheduledConfig?.targetJobRole || "-"}</div>
                <div><strong>Duration:</strong> {scheduledConfig?.duration || "-"} min</div>
                <div><strong>Questions:</strong> {scheduledConfig?.numberOfQuestions || "-"}</div>
                <div><strong>Difficulty:</strong> {scheduledConfig?.difficulty || "-"}</div>
                {scheduledDate && <div><strong>Scheduled:</strong> {scheduledDate}</div>}
              </div>

              <button
                onClick={startScheduledInterview}
                disabled={isLoading || !scheduledConfig}
                className="w-full flex items-center justify-center gap-2 py-3.5 mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-colors shadow-sm text-sm"
              >
                {isLoading
                  ? <><Loader2 size={16} className="animate-spin" /> Starting…</>
                  : <><ArrowRight size={16} /> Start Interview</>}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <Link to="/">
          <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm transition-colors">
            <MdOutlineArrowBackIos size={14} /> Back
          </button>
        </Link>
        <span className="text-sm font-semibold text-gray-700">AI Mock Interview Setup</span>
        {sessionId && (
          <span className="text-xs text-gray-400 font-mono">{sessionId.slice(0, 8)}…</span>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Set up your interview</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload your resume — we'll analyse it and generate personalised questions instantly.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <AlertCircle size={16} />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)}><X size={14} /></button>
          </div>
        )}

        {/* Start button */}
        <button
          onClick={startInterview}
          disabled={!readyToStart || isLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 mb-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-colors shadow-sm text-sm"
        >
          {isLoading
            ? <><Loader2 size={16} className="animate-spin" /> Processing…</>
            : <><ArrowRight size={16} /> Start Interview</>}
        </button>

        {/* Checklist */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm mb-6 flex items-center gap-6 flex-wrap">
          {[
            { label: "Resume uploaded",  done: !!resumeFile },
            { label: "Photo captured",   done: !!capturedImage },
            { label: "Photo verified",   done: uploadSuccess },
            { label: "Resume analysed",  done: !!analysis },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? "bg-green-500" : "bg-gray-200"}`}>
                {item.done && <Check size={11} className="text-white" />}
              </div>
              <span className={`text-sm ${item.done ? "text-gray-800 font-medium" : "text-gray-400"}`}>{item.label}</span>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* LEFT */}
          <div className="space-y-5">

            {/* Resume Upload */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText size={15} className="text-blue-500" /> Resume
              </h2>
              <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl px-4 py-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100">
                  <Upload size={18} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {resumeFile ? resumeFile.name : "Click to upload resume"}
                  </p>
                  <p className="text-xs text-gray-400">PDF or DOCX — auto-analysed on upload</p>
                </div>
                {resumeFile && <Check size={16} className="text-green-500 flex-shrink-0" />}
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeChange} />
              </label>

              {/* Loading state */}
              {(isLoading || isAnalyzing) && (
                <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-xl border border-blue-100">
                  <Loader2 size={16} className="text-blue-500 animate-spin flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      {isLoading ? "Uploading & generating questions…" : "Analysing your resume…"}
                    </p>
                    <p className="text-xs text-blue-500">This takes a few seconds</p>
                  </div>
                </div>
              )}

              {/* ATS Score Card */}
              {atsScore !== null && !isLoading && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-indigo-500" /> ATS Score
                    </span>
                    <span className={`px-3 py-0.5 rounded-full text-white text-xs font-bold ${atsBg}`}>
                      {atsScore}/100 · {atsLabel}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className={`h-2 rounded-full ${atsBg} transition-all duration-700`} style={{ width: `${atsScore}%` }} />
                  </div>
                  {resumeData?.matched_keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {resumeData.matched_keywords.map((kw) => (
                        <span key={kw} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-full text-[10px] font-medium">
                          ✓ {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Resume Analysis Panel */}
              {analysis && !isAnalyzing && (
                <div className="mt-4 rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setShowAnalysis((p) => !p)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Sparkles size={14} className="text-violet-500" /> Resume Analysis
                    </span>
                    {showAnalysis ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </button>

                  {showAnalysis && (
                    <div className="px-4 pb-4 pt-2 space-y-4 bg-white">

                      {/* Overall impression */}
                      {analysis.overall_impression && (
                        <div className="px-3 py-2.5 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-xs font-semibold text-blue-600 mb-1 flex items-center gap-1">
                            <Eye size={11} /> Overall Impression
                          </p>
                          <p className="text-xs text-blue-800 leading-relaxed">{analysis.overall_impression}</p>
                        </div>
                      )}

                      {/* Strengths */}
                      {analysis.strengths?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1.5">
                            <Check size={12} /> Strengths
                          </h4>
                          <ul className="space-y-1">
                            {analysis.strengths.map((s, i) => (
                              <li key={i} className="text-xs text-gray-600 flex gap-2">
                                <span className="text-green-500 flex-shrink-0 mt-0.5">●</span>{s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Weaknesses */}
                      {(analysis.weaknesses || analysis.improvements)?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-yellow-700 mb-2 flex items-center gap-1.5">
                            <AlertTriangle size={12} /> Areas to Improve
                          </h4>
                          <ul className="space-y-1">
                            {(analysis.weaknesses || analysis.improvements).map((w, i) => (
                              <li key={i} className="text-xs text-gray-600 flex gap-2">
                                <span className="text-yellow-500 flex-shrink-0 mt-0.5">●</span>{w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Suggestions */}
                      {analysis.suggestions?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
                            <Lightbulb size={12} /> Suggestions
                          </h4>
                          <ul className="space-y-1">
                            {analysis.suggestions.map((s, i) => (
                              <li key={i} className="text-xs text-gray-600 flex gap-2">
                                <span className="text-blue-500 flex-shrink-0 mt-0.5">→</span>{s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Missing keywords */}
                      {analysis.keywords_missing?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1.5">
                            <Tag size={12} /> Missing Keywords
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {analysis.keywords_missing.map((kw, i) => (
                              <span key={i} className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded-full text-[10px] font-medium">
                                + {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ATS Tips */}
                      {analysis.ats_tips?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-indigo-700 mb-2 flex items-center gap-1.5">
                            <Shield size={12} /> ATS Formatting Tips
                          </h4>
                          <ul className="space-y-1">
                            {analysis.ats_tips.map((t, i) => (
                              <li key={i} className="text-xs text-gray-600 flex gap-2">
                                <span className="text-indigo-500 flex-shrink-0 mt-0.5">✓</span>{t}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Analysing indicator */}
              {isAnalyzing && (
                <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-violet-50 rounded-lg border border-violet-100">
                  <Loader2 size={13} className="text-violet-500 animate-spin" />
                  <span className="text-xs text-violet-700 font-medium">Generating resume insights…</span>
                </div>
              )}
            </div>

            {/* Role */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Target Role</h2>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenRole((p) => !p)}
                  className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 hover:border-blue-400 focus:outline-none bg-white transition-colors"
                >
                  <span>{ROLE_LABELS[role]}</span>
                  <ChevronDown size={15} className={`text-gray-400 transition-transform ${openRole ? "rotate-180" : ""}`} />
                </button>
                {openRole && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => { setRole(key); setOpenRole(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          key === role ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Questions will be personalised to this role using your resume content.
              </p>
            </div>

            {/* Topics */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Focus Topics <span className="text-gray-400 font-normal">(optional)</span></h2>
              <TopicsInput
                topicInput={topicInput}
                setTopicInput={setTopicInput}
                topics={topics}
                setTopics={setTopics}
                removeTopic={removeTopic}
              />
            </div>
          </div>

          {/* RIGHT: Photo + Tips */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <PhotoCapture
                capturedImage={capturedImage}
                setCapturedImage={setCapturedImage}
                webcamRef={webcamRef}
                sessionId={sessionId}
                setError={setError}
                uploadSuccess={uploadSuccess}
                setUploadSuccess={setUploadSuccess}
              />
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-blue-700 mb-2">Tips for best results</p>
              <ul className="text-xs text-blue-600 space-y-1">
                <li>• Ensure good lighting on your face</li>
                <li>• Keep background plain and neutral</li>
                <li>• Make sure your full face is visible</li>
                <li>• Questions are tailored to your exact resume — be ready to discuss your projects</li>
              </ul>
            </div>

            {/* Questions preview */}
            {resumeData?.questions?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Sparkles size={14} className="text-violet-500" />
                  Your {resumeData.questions.length} Questions (Preview)
                </h3>
                <ol className="space-y-2">
                  {resumeData.questions.map((q, i) => (
                    <li key={i} className="flex gap-2 text-xs text-gray-600">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-[10px]">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{q}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
