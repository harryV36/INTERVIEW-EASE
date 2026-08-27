// src/components/interviewQuestion/InterviewSetup.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

/* ============================================================
   CUSTOM MULTI-SELECT DROPDOWN (NO DEPENDENCIES)
============================================================ */
const MultiSelect = ({ label, name, options, selectedValues, onChange }) => {
  const [open, setOpen] = useState(false);

  const toggleValue = (value) => {
    if (selectedValues.includes(value)) {
      onChange(name, selectedValues.filter((v) => v !== value));
    } else {
      onChange(name, [...selectedValues, value]);
    }
  };

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-slate-700 mb-1">
        {label}
      </label>

      {/* Container with visible border on open */}
      <div
        className={`input-like cursor-pointer min-h-[48px] flex items-center flex-wrap gap-2 ${
          open ? "border-indigo-500 border-[2px]" : ""
        }`}
        onClick={() => setOpen(!open)}
      >
        {selectedValues.length === 0 ? (
          <span className="text-slate-400 text-sm">Select options…</span>
        ) : (
          selectedValues.map((val) => (
            <span
              key={val}
              className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
            >
              {val}
            </span>
          ))
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-30 mt-2 w-full bg-white 
          shadow-xl border border-slate-300 rounded-xl p-3 animate-dropdown"
          style={{ borderRight: "2px solid #6366f1" }}
        >
          <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto">
            {options.map((opt) => {
              const isSelected = selectedValues.includes(opt);
              return (
                <div
                  key={opt}
                  onClick={() => toggleValue(opt)}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition 
                    ${
                      isSelected
                        ? "bg-indigo-100 text-indigo-700"
                        : "hover:bg-slate-100"
                    }
                  `}
                >
                  <input type="checkbox" readOnly checked={isSelected} />
                  <span className="text-sm">{opt}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes dropdownAnim {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-dropdown {
          animation: dropdownAnim 0.18s ease-out;
        }
      `}</style>
    </div>
  );
};

/* ============================================================
   MAIN PAGE COMPONENT
============================================================ */
const InterviewSetup = () => {
  const navigate = useNavigate();

  const interviewRoundOptions = [
    "DSA",
    "System Design",
    "Aptitude",
    "Technical Round",
    "HR Round",
  ];

  const [formData, setFormData] = useState({
    category: "",
    targetJobRole: "",
    customJobRole: "",
    targetCompany: "",
    customCompany: "",
    experienceLevel: "",
    interviewType: [],
    duration: "",
    numberOfQuestions: "",
    difficulty: "Medium",
    techStack: [],
    interviewFocus: [],
    preferredLanguage: "English",
    feedbackStyle: "Balanced",
    customNotes: "",
  });

  const [starting, setStarting] = useState(false);

  /* ------------------------------------------------------------
      HANDLERS
  ------------------------------------------------------------ */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // MULTISELECT UPDATE
  const updateMultiSelect = (name, values) => {
    setFormData((prev) => ({ ...prev, [name]: values }));
  };

  // CATEGORY AUTO-SELECT LOGIC
  const handleCategoryChange = (value) => {
    let updatedRounds = formData.interviewType;

    if (value === "General") {
      updatedRounds = [...interviewRoundOptions]; // select all
    } else if (value === "Coding") {
      updatedRounds = ["DSA", "System Design", "Technical Round"];
    }

    setFormData((prev) => ({
      ...prev,
      category: value,
      interviewType: updatedRounds,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      finalJobRole:
        formData.targetJobRole === "Other"
          ? formData.customJobRole
          : formData.targetJobRole,
      finalCompany:
        formData.targetCompany === "Other"
          ? formData.customCompany
          : formData.targetCompany,
    };

    try {
      setStarting(true);
      const token = localStorage.getItem("token");

      const res = await axios.post(
        "http://localhost:8000/api/ai-interviews/start",
        payload,
        {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        }
      );

      if (res.data.success && res.data.sessionId) {
        console.log("Created interview session:", res.data);
        // ✅ Go to questions page with real session id
        navigate(`/interview/${res.data.sessionId}`);
      } else {
        console.error("Start interview unexpected response:", res.data);
        alert("Failed to start interview (no sessionId). Check server logs.");
      }
    } catch (err) {
      console.error("Error starting AI interview:", err);
      alert("Error starting interview. Check console/server.");
    } finally {
      setStarting(false);
    }
  };

  /* ------------------------------------------------------------
      OPTION LISTS
  ------------------------------------------------------------ */
  const categories = ["Coding", "General"];

  const jobRoles = [
    "Frontend Engineer",
    "Backend Engineer",
    "Full-stack Engineer",
    "Data Scientist",
    "ML Engineer",
    "DevOps / SRE",
    "Mobile Developer",
    "QA Engineer",
    "Security Engineer",
    "UI/UX Designer",
    "Engineering Manager",
    "Other",
  ];

  const companies = [
    "Google",
    "Amazon",
    "Meta",
    "Netflix",
    "Microsoft",
    "Infosys",
    "TCS",
    "Wipro",
    "Startup / Small Company",
    "Other",
  ];

  const experienceLevels = [
    "Student / Fresher",
    "0–1 years",
    "1–3 years",
    "3–5 years",
    "5–8 years",
    "8+ years",
  ];

  const durations = ["15", "30", "45", "60"];
  const questionCounts = ["3", "5", "8", "10", "15"];

  const techStacks = [
    "React",
    "Node.js",
    "Express",
    "MongoDB",
    "SQL",
    "Java",
    "Python",
    "C++",
    "Spring Boot",
    "Django",
    "AWS",
    "Docker",
    "Kubernetes",
  ];

  const focusAreas = [
    "DSA / Problem Solving",
    "System Design",
    "Core CS Subjects",
    "Language Fundamentals",
    "Project Deep Dive",
    "Behavioral / HR",
  ];

  const languages = ["English", "Hindi", "English + Hindi Mix"];
  const feedbackStyles = ["Supportive", "Balanced", "Strict"];

  /* ============================================================
     FORM UI
  ============================================================ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-100 p-6 md:p-10">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-8 md:p-10 space-y-10 border border-slate-200">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Configure Your AI Interview
          </h1>
          <p className="text-slate-600 mt-2 text-sm">
            Set up your preferences and get a fully personalized AI-powered mock interview.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* ------------- CATEGORY FIELD ------------- */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Category
            </label>
            <select
              className="input-like w-full"
              value={formData.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="">Select category…</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>

            <p className="text-[11px] text-slate-500 mt-1">
              General = All rounds selected automatically
            </p>
          </div>

          {/* ------------------------ JOB + COMPANY + EXPERIENCE ------------------------ */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Job Role */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Target Job Role *
              </label>
              <select
                name="targetJobRole"
                value={formData.targetJobRole}
                onChange={handleChange}
                className="input-like w-full"
                required
              >
                <option value="">Select a role...</option>
                {jobRoles.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>

              {formData.targetJobRole === "Other" && (
                <input
                  type="text"
                  name="customJobRole"
                  placeholder="Enter custom role"
                  className="input-like w-full mt-2"
                  value={formData.customJobRole}
                  onChange={handleChange}
                />
              )}
            </div>

            {/* Company */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Target Company
              </label>
              <select
                name="targetCompany"
                value={formData.targetCompany}
                onChange={handleChange}
                className="input-like w-full"
              >
                <option value="">Select a company...</option>
                {companies.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>

              {formData.targetCompany === "Other" && (
                <input
                  type="text"
                  name="customCompany"
                  placeholder="Enter company name"
                  className="input-like w-full mt-2"
                  value={formData.customCompany}
                  onChange={handleChange}
                />
              )}
            </div>

            {/* Experience */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Experience Level
              </label>
              <select
                name="experienceLevel"
                value={formData.experienceLevel}
                onChange={handleChange}
                className="input-like w-full"
              >
                <option value="">Select experience...</option>
                {experienceLevels.map((lvl) => (
                  <option key={lvl}>{lvl}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ------------------------ CATEGORY-AFFECTED INTERVIEW ROUNDS ------------------------ */}
          <MultiSelect
            label="Interview Rounds"
            name="interviewType"
            options={interviewRoundOptions}
            selectedValues={formData.interviewType}
            onChange={updateMultiSelect}
          />

          {/* ------------------------ DURATION + QUESTIONS ------------------------ */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Duration */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Duration (minutes)
              </label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="input-like w-full"
                required
              >
                <option value="">Choose duration...</option>
                {durations.map((d) => (
                  <option key={d} value={d}>
                    {d} minutes
                  </option>
                ))}
              </select>
            </div>

            {/* Number of Questions */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Number of Questions
              </label>
              <select
                name="numberOfQuestions"
                value={formData.numberOfQuestions}
                onChange={handleChange}
                className="input-like w-full"
                required
              >
                <option value="">Choose…</option>
                {questionCounts.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ------------------------ DIFFICULTY + LANGUAGE + FEEDBACK ------------------------ */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Difficulty */}
            <div>
              <label className="block text-xs font-medium mb-1">Difficulty</label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="input-like w-full"
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>

            {/* Preferred Language */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Preferred Language
              </label>
              <select
                name="preferredLanguage"
                value={formData.preferredLanguage}
                onChange={handleChange}
                className="input-like w-full"
              >
                {languages.map((lang) => (
                  <option key={lang}>{lang}</option>
                ))}
              </select>
            </div>

            {/* Feedback Style */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Feedback Style
              </label>
              <select
                name="feedbackStyle"
                value={formData.feedbackStyle}
                onChange={handleChange}
                className="input-like w-full"
              >
                {feedbackStyles.map((style) => (
                  <option key={style}>{style}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ------------------------ TECH STACK + FOCUS AREAS ------------------------ */}
          <div className="grid gap-6 md:grid-cols-2">
            <MultiSelect
              label="Preferred Tech Stack"
              name="techStack"
              options={techStacks}
              selectedValues={formData.techStack}
              onChange={updateMultiSelect}
            />

            <MultiSelect
              label="Interview Focus Areas"
              name="interviewFocus"
              options={focusAreas}
              selectedValues={formData.interviewFocus}
              onChange={updateMultiSelect}
            />
          </div>

          {/* NOTES */}
          <div>
            <label className="block text-xs font-medium mb-1">
              Custom Notes for AI
            </label>
            <textarea
              name="customNotes"
              value={formData.customNotes}
              onChange={handleChange}
              className="input-like w-full h-24 resize-none"
              placeholder="Add any special instructions..."
            />
          </div>

          {/* SUBMIT */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              Your settings will be used to generate a personalized AI interview.
            </p>
            <button
              type="submit"
              disabled={starting}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 
              text-white rounded-full shadow-md hover:opacity-90 transition text-sm font-semibold disabled:opacity-60"
            >
              {starting ? "Starting..." : "Save & Start Interview"}
            </button>
          </div>
        </form>
      </div>

      {/* Input styling */}
      <style>{`
        .input-like {
          padding: 10px 12px;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          background: #fff;
          font-size: 0.9rem;
          color: #0f172a;
          outline: none;
          transition: 0.15s;
        }
        .input-like:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
        }
      `}</style>
    </div>
  );
};

export default InterviewSetup;
