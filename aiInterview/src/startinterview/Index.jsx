import React, { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import { X, ChevronDown, ChevronUp, Sparkles, CircleCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Link, useNavigate } from "react-router-dom";
import { MdOutlineArrowBackIos } from "react-icons/md";
import axios from "axios";

const ROLE_OPTIONS = [
  { value: "frontend", label: "Frontend Engineer" },
  { value: "backend", label: "Backend Engineer" },
  { value: "fullstack", label: "Full-stack Engineer" },
  { value: "data_scientist", label: "Data Scientist" },
  { value: "ml_engineer", label: "ML Engineer" },
  { value: "devops", label: "DevOps / SRE" },
  { value: "mobile", label: "Mobile Engineer" },
  { value: "qa", label: "QA / Test Engineer" },
  { value: "security", label: "Security Engineer" },
  { value: "data_engineer", label: "Data Engineer" },
  { value: "product", label: "Product Manager" },
  { value: "uiux", label: "UI/UX Designer" },
  { value: "manager", label: "Engineering Manager" },
];

const StartInterview = () => {
  const [resumeFile, setResumeFile] = useState(null);
  const [topicInput, setTopicInput] = useState("");
  const [topics, setTopics] = useState([]);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [role, setRole] = useState(ROLE_OPTIONS[0].value);
  const webcamRef = useRef(null);
  const navigate = useNavigate();

  // Generate or retrieve session ID on component mount
  useEffect(() => {
    const storedSessionId = localStorage.getItem("interviewSessionId");
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = crypto?.randomUUID ? crypto.randomUUID() :
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      setSessionId(newSessionId);
      localStorage.setItem("interviewSessionId", newSessionId);
    }

    // Restore role if previously picked
    try {
      const stored = JSON.parse(localStorage.getItem("interviewData") || "{}");
      if (stored.role) setRole(stored.role);
    } catch (e) {
      // ignore
    }
  }, []);

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Please upload a PDF or Word document.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size too large. Maximum 5MB allowed.");
      return;
    }

    setError(null);
    setResumeFile(file);
    setResumeData(null);
    setShowAnalysis(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && topicInput.trim()) {
      e.preventDefault();
      if (!topics.includes(topicInput.trim())) {
        setTopics([...topics, topicInput.trim()]);
      }
      setTopicInput("");
    }
  };

  const removeTopic = (index) => {
    const updated = [...topics];
    updated.splice(index, 1);
    setTopics(updated);
  };

  const capturePhoto = () => {
    if (!sessionId) {
      setError("Session ID not available. Please refresh the page.");
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);

    const byteString = atob(imageSrc.split(",")[1]);
    const mimeString = imageSrc.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });

    const formData = new FormData();
    formData.append("image", blob, "reference.jpg");
    formData.append("session_id", sessionId);

    axios.post("http://localhost:5000/upload-image", formData)
      .then((res) => {
        console.log("✅ Image uploaded:", res.data);
      })
      .catch((err) => {
        console.error("❌ Upload failed:", err);
        setError("Failed to upload image. Please try again.");
      });
  };

  const startInterview = async () => {
    if (!resumeFile) {
      setError("Please upload a resume first");
      return;
    }

    if (!sessionId) {
      setError("Session ID not available. Please refresh the page.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("topics", topics.join(","));
      formData.append("session_id", sessionId);
      formData.append("role", role);

      const response = await axios.post(
        "http://localhost:5000/upload-resume",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {}),
          },
          timeout: 60000,
        }
      );

      if (!response.data?.questions || !response.data?.skills) {
        throw new Error("Server returned invalid data");
      }

      setResumeData({
        ...response.data,
        analyzed: response.data.analysis ? true : false
      });

      localStorage.setItem("interviewData", JSON.stringify({
        session_id: sessionId,
        questions: response.data.questions,
        skills: response.data.skills,
        topics: topics,
        role: role,
        timestamp: new Date().toISOString()
      }));

      // don't auto-navigate — let user review & continue
    } catch (err) {
      const errorMessage = err.response?.data?.error ||
                         err.message ||
                         "Failed to process resume. Please try again.";
      setError(errorMessage);
      console.error("Upload error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeResume = async () => {
    if (!resumeData?.text_summary) {
      setError("No resume text available for analysis");
      return;
    }

    if (!sessionId) {
      setError("Session ID not available. Please refresh the page.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await axios.post(
        "http://localhost:5000/analyze-resume",
        {
          text: resumeData.text_summary,
          session_id: sessionId
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...(localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {}),
          },
          timeout: 120000,
        }
      );

      if (!response.data?.analysis) {
        throw new Error("Analysis failed");
      }

      setResumeData(prev => ({
        ...prev,
        analysis: response.data.analysis,
        analyzed: true
      }));

      setShowAnalysis(true);

    } catch (err) {
      const errorMessage = err.response?.data?.error ||
                         err.message ||
                         "Failed to analyze resume. Please try again.";
      setError(errorMessage);
      console.error("Analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white px-6 md:px-20 py-10">
      <div className="relative flex items-center justify-between mb-8">
        <Link to={"/"}>
          <Button className="bg-white text-black hover:bg-gray-200">
            <MdOutlineArrowBackIos />
          </Button>
        </Link>
        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-3xl font-bold tracking-wide text-white drop-shadow-lg">
          🤖 Start Your AI Mock Interview
        </h1>
      </div>

      <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20 space-y-8">
        {error && (
          <div className="bg-red-500/20 text-red-200 p-3 rounded-lg flex items-center">
            <AlertCircle className="mr-2" size={18} />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {sessionId && (
          <div className="text-xs text-gray-400 text-right">
            Session ID: {sessionId.substring(0, 8)}...
          </div>
        )}

        <div>
          <label className="block font-semibold text-gray-200 mb-2">
            Upload Your Resume (PDF or DOCX)
            {resumeFile && (
              <span className="ml-2 text-sm text-green-300">
                Selected: {resumeFile.name}
              </span>
            )}
          </label>
          <Input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleResumeUpload}
            className="bg-white text-black"
            required
          />
        </div>

        {resumeData?.ats_score !== undefined && (
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg flex items-center">
                <CircleCheck className="mr-2 text-green-400" size={18} />
                Resume ATS Score
              </h3>
              <div className="flex items-center">
                <span className={`px-3 py-1 rounded-full ${getScoreColor(resumeData.ats_score)} text-white font-bold`}>
                  {resumeData.ats_score}
                </span>
                <span className="ml-2 text-sm text-gray-300">/ 100</span>
              </div>
            </div>
            <Progress value={resumeData.ats_score} className="h-2" />
            <p className="text-sm text-gray-300 mt-2">
              {resumeData.ats_score >= 80
                ? "Excellent! Your resume is well optimized for ATS systems."
                : resumeData.ats_score >= 60
                ? "Good, but could use some improvements to better pass ATS filters."
                : "Needs work. Consider revising to improve ATS compatibility."}
            </p>

            {!resumeData.analyzed && (
              <Button
                onClick={analyzeResume}
                className="mt-4 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  "Analyzing..."
                ) : (
                  <>
                    <Sparkles size={18} className="mr-2" />
                    Get Detailed Analysis
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {resumeData?.analysis && (
          <div className="bg-gray-800/50 rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 hover:bg-gray-700/50 transition-colors"
              onClick={() => setShowAnalysis(!showAnalysis)}
            >
              <h3 className="font-semibold text-lg flex items-center">
                <Sparkles className="mr-2 text-purple-400" size={18} />
                Resume Analysis
              </h3>
              {showAnalysis ? <ChevronUp /> : <ChevronDown />}
            </button>

            {showAnalysis && (
              <div className="p-4 pt-0 space-y-4">
                <div>
                  <h4 className="font-medium text-green-400 mb-2">Strengths</h4>
                  <ul className="space-y-2">
                    {resumeData.analysis.strengths.map((strength, i) => (
                      <li key={i} className="flex items-start">
                        <CircleCheck className="mr-2 mt-1 flex-shrink-0 text-green-400" size={16} />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-yellow-400 mb-2">Areas for Improvement</h4>
                  <ul className="space-y-2">
                    {resumeData.analysis.improvements.map((improvement, i) => (
                      <li key={i} className="flex items-start">
                        <AlertCircle className="mr-2 mt-1 flex-shrink-0 text-yellow-400" size={16} />
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-blue-400 mb-2">Actionable Suggestions</h4>
                  <ul className="space-y-2">
                    {resumeData.analysis.suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start">
                        <span className="mr-2 mt-1 flex-shrink-0">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block font-semibold text-gray-200 mb-2">
            Enter Interview Topics (Optional)
          </label>
          <Input
            type="text"
            placeholder="e.g., React, DSA, AI"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-white text-black"
          />
          <div className="flex flex-wrap gap-2 mt-4">
            {topics.map((topic, index) => (
              <span
                key={index}
                className="flex items-center bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
              >
                {topic}
                <button
                  className="ml-2 text-purple-500 hover:text-purple-700"
                  onClick={() => removeTopic(index)}
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Role selector */}
        <div>
          <label className="block font-semibold text-gray-200 mb-2">Select Target Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full p-2 rounded-md bg-white text-black"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">This helps the AI tailor questions and feedback to your target role.</p>
        </div>

        <div>
          <label className="block font-semibold text-gray-200 mb-2">
            Live Photo Capture (Optional)
          </label>
          <div className="flex flex-col items-center space-y-4">
            {!capturedImage ? (
              <>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  width={280}
                  className="rounded-lg border border-gray-400"
                />
                <Button variant="secondary" onClick={capturePhoto}>
                  Capture Photo
                </Button>
              </>
            ) : (
              <img
                src={capturedImage}
                alt="Captured"
                className="w-48 rounded-lg shadow-lg"
              />
            )}
          </div>
        </div>

        <div className="text-center">
          {!resumeData ? (
            <Button
              onClick={startInterview}
              className="bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg hover:scale-105 transition-transform"
              disabled={isLoading || !resumeFile}
            >
              {isLoading ? (
                "Processing..."
              ) : (
                <>
                  <Sparkles size={18} className="mr-2" />
                  Let's Start
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => navigate("/lets-start/interview-begin")}
              className="bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg hover:scale-105 transition-transform"
            >
              <Sparkles size={18} className="mr-2" />
              Continue to Interview
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StartInterview;
