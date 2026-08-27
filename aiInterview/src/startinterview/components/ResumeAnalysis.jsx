import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ResumeAnalysis({ resumeData, showAnalysis, setShowAnalysis }) {

  console.log("Resume Data:", resumeData);
  console.log("Show Analysis:", showAnalysis);
  // console.log("Set Show Analysis:", setShowAnalysis);
  return (
    <motion.div
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm reveal"
    >
      <button
        className="w-full text-left font-semibold text-slate-800 mb-3"
        onClick={() => setShowAnalysis(!showAnalysis)}
      >
        Resume Analysis {showAnalysis ? "▲" : "▼"}
      </button>

      <AnimatePresence>
        {showAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 25 }}
            className="space-y-4 text-slate-600"
          >
            <Section title="Strengths" color="text-green-600" items={resumeData.analysis.strengths || []} />
            <Section title="Areas to Improve" color="text-yellow-600" items={resumeData.analysis.weaknesses || resumeData.analysis.improvements || []} />
            <Section title="Suggestions" color="text-blue-600" items={resumeData.analysis.suggestions || []} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Section({ title, color, items }) {
  return (
    <div>
      <h3 className={`${color} font-semibold mb-2`}>{title}</h3>
    
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-slate-500 text-sm">• {item}</li>
        ))}
      </ul>
    </div>
  );
}
