import React, { useState, useRef } from "react";
import Webcam from "react-webcam";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { MdOutlineArrowBackIos } from "react-icons/md";
import axios from "axios";

const StartInterview = () => {
  const [resumeFile, setResumeFile] = useState(null);
  const [topicInput, setTopicInput] = useState("");
  const [topics, setTopics] = useState([]);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const webcamRef = useRef(null);
  const navigate = useNavigate();

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Please upload a PDF or Word document.");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size too large. Maximum 5MB allowed.");
      return;
    }

    setError(null);
    setResumeFile(file);
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
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);

    // Convert base64 to Blob
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

    axios.post("http://localhost:5000/upload-face", formData)
      .then((res) => {
        console.log("✅ Image uploaded:", res.data);
      })
      .catch((err) => {
        console.error("❌ Upload failed:", err);
      });
  };

  const startInterview = async () => {
    if (!resumeFile) {
      setError("Please upload a resume first");
      return;
    }
  
    setIsLoading(true);
    setError(null);
  
    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("topics", topics.join(","));

      const response = await axios.post(
        "http://localhost:5000/upload-resume",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {}),
          },
          timeout: 60000, // 10-second timeout
        }
      );
  
      if (!response.data?.questions || !response.data?.skills) {
        throw new Error("Server returned invalid data");
      }
  
      localStorage.setItem("interviewData", JSON.stringify({
        questions: response.data.questions,
        skills: response.data.skills,
        topics: topics,
        timestamp: new Date().toISOString()
      }));
  
      navigate("/lets-start/interview-begin");
  
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
            <span>{error}</span>
            <button 
              onClick={() => setError(null)} 
              className="ml-auto"
            >
              <X size={16} />
            </button>
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
          <Button 
            onClick={startInterview}
            className="bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg hover:scale-105 transition-transform"
            disabled={isLoading}
          >
            {isLoading ? (
              "Processing..."
            ) : (
              <>
                <Sparkles size={18} className="mr-2" /> Let's start
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StartInterview;
