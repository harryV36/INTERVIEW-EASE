import React from "react";
import { motion } from "framer-motion";

export default function ResumeUpload({
  resumeFile,
  setResumeFile,
  setResumeData,
  setShowAnalysis,
  setError
}) {
  const upload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    if (!allowed.includes(file.type)) {
      setError("Only PDF & DOCX allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Maximum size: 5MB");
      return;
    }

    setError(null);
    setResumeFile(file);
    setResumeData(null);
    setShowAnalysis(false);
  };

  return (
    <motion.div
      className="reveal"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <label className="font-semibold text-slate-700 mb-2 block">
        Upload Resume (PDF/DOCX)
        {resumeFile && (
          <span className="ml-2 text-indigo-500">{resumeFile.name}</span>
        )}
      </label>

      <input
        type="file"
        onChange={upload}
        className="w-full bg-white p-3 rounded-xl shadow-sm border border-slate-300 text-slate-700"
      />
    </motion.div>
  );
}
