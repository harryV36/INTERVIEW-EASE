import React from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";

export default function TopicsInput({
  topicInput,
  setTopicInput,
  topics,
  setTopics,
  removeTopic
}) {
  const onEnter = (e) => {
    if (e.key === "Enter" && topicInput.trim()) {
      if (!topics.includes(topicInput.trim())) {
        setTopics([...topics, topicInput.trim()]);
      }
      setTopicInput("");
      e.preventDefault();
    }
  };

  return (
    <motion.div className="reveal">
      <label className="font-semibold text-slate-700 mb-2 block">Interview Topics</label>

      <input
        value={topicInput}
        onChange={(e) => setTopicInput(e.target.value)}
        onKeyDown={onEnter}
        placeholder="React, DSA, ML..."
        className="w-full bg-white p-3 rounded-xl border border-slate-300 shadow-sm text-slate-700"
      />

      <div className="flex flex-wrap gap-2 mt-4">
        {topics.map((t, i) => (
          <span key={i} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full flex items-center">
            {t}
            <button onClick={() => removeTopic(i)} className="ml-2 text-red-500 hover:text-red-700">
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
    </motion.div>
  );
}
