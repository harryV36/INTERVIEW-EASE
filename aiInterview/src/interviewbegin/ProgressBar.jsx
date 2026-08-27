// src/interviewbegin/ProgressBar.jsx
import React, { useState } from "react";
import { ListChecks, LayoutGrid, Rows } from "lucide-react";

const ProgressBar = ({ questions, answers, onJumpToQuestion }) => {
  const [mode, setMode] = useState("bar"); // "bar" | "box"

  const submittedCount = Object.values(answers).filter(
    (a) => a.submitted
  ).length;

  const toggleMode = () => {
    setMode((prev) => (prev === "bar" ? "box" : "bar"));
  };

  return (
    <div
      className="
        md:col-span-2 
        bg-white border border-gray-200
        rounded-3xl p-6 shadow-lg
        w-full 
        max-w-[730px]
      "
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <ListChecks className="w-6 h-6 text-gray-800" />
          Progress
        </h2>

        {/* MODE SWITCH BUTTON */}
        <button
          onClick={toggleMode}
          className="
            px-4 py-2 rounded-lg 
            bg-gray-100 hover:bg-gray-200 
            text-gray-700 font-medium 
            flex items-center gap-2 transition
          "
        >
          {mode === "bar" ? (
            <>
              <LayoutGrid className="w-4 h-4" />
              Box View
            </>
          ) : (
            <>
              <Rows className="w-4 h-4" />
              Bar View
            </>
          )}
        </button>
      </div>

      {/* =============================== */}
      {/* BAR MODE */}
      {/* =============================== */}
      {mode === "bar" && (
        <div>
          <div className="grid grid-cols-6 gap-2">
            {questions.map((_, index) => {
              const isSubmitted = answers[index]?.submitted;

              return (
                <div
                  key={index}
                  className={`
                    h-2 rounded-full transition-all
                    ${
                      isSubmitted
                        ? "bg-blue-700"
                        : "bg-gray-300"
                    }
                  `}
                ></div>
              );
            })}
          </div>

          <div className="mt-3 text-sm text-gray-600">
            {submittedCount} of {questions.length} questions submitted
          </div>
        </div>
      )}

      {/* =============================== */}
      {/* BOX MODE */}
      {/* =============================== */}
      {mode === "box" && (
        <div>
          <div className="grid grid-cols-5 gap-3 mt-2">
            {questions.map((_, index) => {
              const isSubmitted = answers[index]?.submitted;

              return (
                <button
                  key={index}
                  onClick={() => onJumpToQuestion(index)}
                  className={`
                    p-4 rounded-xl border shadow-sm text-center text-sm font-medium
                    transition-all cursor-pointer w-full
                    ${
                      isSubmitted
                        ? "bg-blue-600 text-white border-blue-700 shadow-md scale-[1.02]"
                        : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                    }
                  `}
                >
                  Q{index + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-3 text-sm text-gray-600">
            {submittedCount} of {questions.length} questions completed
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
