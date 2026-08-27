import React from "react";
import { motion } from "framer-motion";
import { Pencil } from "lucide-react";

export default function ResumeScore({
  resumeData,
  isAnalyzing,
  analyzeResume,
  onEdit,
}) {
  const score = resumeData.ats_score;

  return (
    <>
      {/* ⭐ ATS SCORE CARD */}
      <motion.div
        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 reveal"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-700">ATS Score</h2>

          <span
            className={`px-4 py-1 rounded-full text-white font-bold ${
              score >= 80
                ? "bg-green-500"
                : score >= 60
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
          >
            {score}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-indigo-500"
            style={{ width: `${score}%` }}
          />
        </div>

        {/* Analyze Button */}
        {!resumeData.analyzed && (
          <button
            onClick={analyzeResume}
            disabled={isAnalyzing}
            className="w-full bg-indigo-500 hover:bg-indigo-600 py-2 rounded-xl text-white transition shadow-md"
          >
            {isAnalyzing ? "Analyzing..." : "Get Detailed Analysis"}
          </button>
        )}
      </motion.div>

      {/* ⭐ EDIT BUTTON OUTSIDE, BELOW, RIGHT ALIGNED */}
      <div className="flex justify-end mt-2">
        <button
          onClick={onEdit}
          className="
            flex items-center gap-1
            px-3 py-1.5
            text-sm
            bg-slate-100
            hover:bg-slate-200
            text-slate-700
            rounded-lg
            border border-slate-300
            transition
            shadow-sm
          "
        >
          <Pencil size={14} />
          Edit
        </button>
      </div>
    </>
  );
}
