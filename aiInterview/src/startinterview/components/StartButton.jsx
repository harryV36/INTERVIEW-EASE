// import React from "react";
// import { Sparkles } from "lucide-react";
// import { motion } from "framer-motion";

// export default function StartButton({
//   resumeFile,
//   resumeData,
//   startInterview,
//   navigate,
//   isLoading,
// }) {
//   // LOAD QUESTIONS FROM LOCALSTORAGE (correct source)
//   const stored = JSON.parse(localStorage.getItem("interviewData") || "{}");
//   const hasQuestions =
//     stored.questions && Array.isArray(stored.questions) && stored.questions.length === 5;

//   return (
//     <motion.div className="reveal text-center">
//       {/* STEP 1: Process resume */}
//       {!resumeData ? (
//         <button
//           onClick={startInterview}
//           disabled={!resumeFile || isLoading}
//           className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl text-white shadow-md hover:scale-105 transition disabled:opacity-40"
//         >
//           {isLoading ? (
//             "Processing..."
//           ) : (
//             <>
//               <Sparkles className="inline mr-2" /> Continue
//             </>
//           )}
//         </button>
//       ) : (
//         // STEP 2: Navigate to interview
//         <button
//           onClick={() => {
//             if (!hasQuestions) {
//               alert(
//                 "Questions not ready. Please re-process your resume."
//               );
//               return;
//             }

//             // ⭐ Correct page for Structure.jsx
//             navigate("/feature-individual-student/lets-start/interview-begin");
//           }}
//           disabled={!hasQuestions}
//           className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl text-white shadow-md hover:scale-105 transition disabled:opacity-40"
//         >
//           Start Interview
//         </button>
//       )}
//     </motion.div>
//   );
// }


// import React from "react";
// import { ArrowRight, Loader2 } from "lucide-react";

// const StartButton = ({
//   resumeFile,
//   resumeData,
//   capturedImage,
//   uploadSuccess,
//   startInterview,
//   isLoading,
//   navigate,
// }) => {
//   // Check if all requirements are met
//   const canStart = resumeFile && resumeData && capturedImage && uploadSuccess;

//   // Get specific missing requirement message
//   const getMissingRequirement = () => {
//     if (!resumeFile) return "Please upload your resume";
//     if (!resumeData) return "Please wait for resume processing";
//     if (!capturedImage) return "Please capture your photo";
//     if (!uploadSuccess) return "Please upload your captured photo";
//     return "";
//   };

//   const handleClick = () => {
//     if (!canStart) {
//       return;
//     }

//     // Check if questions were generated
//     if (resumeData?.questions && resumeData.questions.length > 0) {
//       navigate("/feature-individual-student/lets-start/interview-begin");
//     } else {
//       // No questions yet, upload resume first
//       startInterview();
//     }
//   };

//   return (
//     <div className="flex flex-col items-end gap-2">
//       {/* Missing Requirement Message */}
//       {!canStart && (
//         <div className="text-xs text-amber-600 font-medium">
//           {getMissingRequirement()}
//         </div>
//       )}

//       {/* Start Button */}
//       <button
//         type="button"
//         onClick={handleClick}
//         disabled={!canStart || isLoading}
//         className={`
//           px-8 py-3 rounded-xl font-semibold
//           flex items-center gap-2
//           transition-all duration-200
//           ${
//             canStart && !isLoading
//               ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
//               : "bg-slate-300 text-slate-500 cursor-not-allowed"
//           }
//         `}
//       >
//         {isLoading ? (
//           <>
//             <Loader2 size={20} className="animate-spin" />
//             Processing...
//           </>
//         ) : (
//           <>
//             Start Interview
//             <ArrowRight size={20} />
//           </>
//         )}
//       </button>

//       {/* Helper Text */}
//       {canStart && (
//         <div className="text-xs text-slate-500">
//           All requirements met ✓
//         </div>
//       )}
//     </div>
//   );
// };

// export default StartButton;

import React from "react";
import { Sparkles, Loader2 } from "lucide-react";

export default function StartButton({
  resumeFile,
  resumeData,
  capturedImage,
  uploadSuccess,
  startInterview,
  isLoading,
  navigate,
}) {
  // Determine what state we're in
  const hasResumeFile = Boolean(resumeFile);
  const hasResumeData = Boolean(resumeData);
  const hasPhoto = Boolean(capturedImage);
  const photoUploaded = Boolean(uploadSuccess);

  // Check if we can proceed to interview (all requirements met)
  const canStartInterview = hasResumeFile && hasResumeData && hasPhoto && photoUploaded;

  // Get missing requirement message
  const getMissingRequirement = () => {
    if (!hasResumeFile) return "Please upload your resume";
    if (!hasResumeData) return "Please process your resume first";
    if (!hasPhoto) return "Please capture your photo";
    if (!photoUploaded) return "Please upload your captured photo";
    return "";
  };

  // Button handler
  const handleClick = () => {
    if (canStartInterview) {
      // All requirements met, navigate to interview
      const stored = JSON.parse(localStorage.getItem("interviewData") || "{}");
      const hasQuestions =
        stored.questions && Array.isArray(stored.questions) && stored.questions.length > 0;

      if (!hasQuestions) {
        alert("Questions not ready. Please re-process your resume.");
        return;
      }

      navigate("/feature-individual-student/lets-start/interview-begin");
    } else if (hasResumeFile && !hasResumeData) {
      // Resume uploaded but not processed yet, process it
      startInterview();
    }
  };

  // Determine button text
  const getButtonText = () => {
    if (isLoading) return "Processing...";
    if (canStartInterview) return "Start Interview";
    if (hasResumeFile && !hasResumeData) return "Process Resume";
    return "Continue";
  };

  // Determine if button should be disabled
  const isDisabled = isLoading || !hasResumeFile || (hasResumeData && (!hasPhoto || !photoUploaded));

  return (
    <div className="flex flex-col items-end gap-2">
      {/* Missing Requirement Message */}
      {!canStartInterview && !isLoading && (
        <div className="text-xs text-amber-600 font-medium">
          {getMissingRequirement()}
        </div>
      )}

      {/* Progress Checklist */}
      <div className="text-xs text-slate-500 space-y-1 mb-2">
        <div className={hasResumeFile ? "text-emerald-600" : ""}>
          {hasResumeFile ? "✓" : "○"} Resume uploaded
        </div>
        <div className={hasResumeData ? "text-emerald-600" : ""}>
          {hasResumeData ? "✓" : "○"} Resume processed
        </div>
        <div className={hasPhoto ? "text-emerald-600" : ""}>
          {hasPhoto ? "✓" : "○"} Photo captured
        </div>
        <div className={photoUploaded ? "text-emerald-600" : ""}>
          {photoUploaded ? "✓" : "○"} Photo uploaded
        </div>
      </div>

      {/* Main Button */}
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={`
          px-8 py-3 rounded-xl font-semibold
          flex items-center gap-2
          transition-all duration-200
          ${
            !isDisabled
              ? "bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
              : "bg-slate-300 text-slate-500 cursor-not-allowed"
          }
        `}
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            {getButtonText()}
          </>
        ) : (
          <>
            <Sparkles size={20} />
            {getButtonText()}
          </>
        )}
      </button>

      {/* Success Message */}
      {canStartInterview && (
        <div className="text-xs text-emerald-600 font-medium">
          All requirements met! Ready to start ✓
        </div>
      )}
    </div>
  );
}