// // src/interviewbegin/QuestionPanel.jsx
// // import React from "react";
// // import { Button } from "@/components/ui/button";

// // const QuestionPanel = ({
// //   questions,
// //   answers,
// //   currentQuestionIndex,
// //   recognitionSupported,
// //   isListening,
// //   textareaRef,
// //   handleAnswerChange,
// //   toggleListening,
// //   handlePreviousQuestion,
// //   handleNextQuestion,
// //   submitAnswer,
// //   submitInterview,
// //   isSubmitting,
// //   validateAllAnswers,
// // }) => {
// //   const currentAnswerObj = answers[currentQuestionIndex] || {};
// //   const currentQuestion =
// //     questions.length > 0 ? questions[currentQuestionIndex] : "";

// //   const allSubmitted = validateAllAnswers();

// //   return (
// //     <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 min-h-[400px] shadow-xl flex flex-col">
// //       <h2 className="text-xl font-semibold text-purple-300 mb-4">
// //         📄 Question {currentAnswerObj.questionNumber || currentQuestionIndex + 1}
// //       </h2>

// //       <div className="flex-1 flex flex-col gap-4">
// //         {questions.length > 0 ? (
// //           <>
// //             <div className="p-4 bg-white/20 rounded-lg border border-white/10 w-full">
// //               <p className="text-lg mb-2">{currentQuestion}</p>
// //               <textarea
// //                 ref={textareaRef}
// //                 value={currentAnswerObj.answer || ""}
// //                 onChange={handleAnswerChange}
// //                 onFocus={toggleListening}
// //                 onBlur={() => isListening && toggleListening()}
// //                 placeholder={
// //                   recognitionSupported
// //                     ? "Type or speak your answer..."
// //                     : "Type your answer..."
// //                 }
// //                 className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[150px]"
// //                 disabled={currentAnswerObj.submitted}
// //               />
// //               {recognitionSupported && (
// //                 <div className="mt-2 flex items-center">
// //                   <span
// //                     className={`inline-block w-3 h-3 rounded-full mr-2 ${
// //                       isListening ? "bg-green-500 animate-pulse" : "bg-gray-500"
// //                     }`}
// //                   ></span>
// //                   <span className="text-sm">
// //                     {isListening ? "Listening... Speak now" : "Click in the box to speak"}
// //                   </span>
// //                 </div>
// //               )}
// //             </div>

// //             <div className="text-sm text-white/70 text-center">
// //               Question{" "}
// //               {currentAnswerObj.questionNumber || currentQuestionIndex + 1} of{" "}
// //               {questions.length}
// //             </div>
// //           </>
// //         ) : (
// //           <p>Loading questions...</p>
// //         )}
// //       </div>

// //       <div className="flex justify-between mt-4">
// //         <Button
// //           onClick={handlePreviousQuestion}
// //           disabled={currentQuestionIndex === 0}
// //           variant="outline"
// //           className="border-white bg-white text-black"
// //         >
// //           Previous
// //         </Button>

// //         {currentAnswerObj.submitted ? (
// //           <div className="text-green-300 flex items-center">✓ Submitted</div>
// //         ) : (
// //           <Button
// //             onClick={submitAnswer}
// //             disabled={!currentAnswerObj.answer?.trim()}
// //             className="bg-green-600 hover:bg-green-700"
// //           >
// //             Submit Answer
// //           </Button>
// //         )}

// //         {currentQuestionIndex < questions.length - 1 ? (
// //           <Button
// //             onClick={handleNextQuestion}
// //             variant="outline"
// //             className="border-white text-white"
// //           >
// //             Next
// //           </Button>
// //         ) : (
// //           <Button
// //             onClick={submitInterview}
// //             disabled={isSubmitting || !allSubmitted}
// //             className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
// //           >
// //             {isSubmitting ? "Submitting..." : "Finish Interview"}
// //           </Button>
// //         )}
// //       </div>
// //     </div>
// //   );
// // };

// // export default QuestionPanel;



// // QuestionPanel.jsx

// import React from "react";
// import { Button } from "@/components/ui/button";
// import { Mic, MicOff, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";

// const QuestionPanel = ({
//   questions,
//   answers,
//   currentQuestionIndex,
//   recognitionSupported,
//   isListening,
//   textareaRef,
//   handleAnswerChange,
//   toggleListening,
//   handlePreviousQuestion,
//   handleNextQuestion,
//   submitAnswer,
//   submitInterview,
//   isSubmitting,
//   validateAllAnswers,
// }) => {
//   const currentAnswerObj = answers[currentQuestionIndex] || {};
//   const currentQuestion =
//     questions.length > 0 ? questions[currentQuestionIndex] : "";
//   const allSubmitted = validateAllAnswers();

//   return (
//     <div className="bg-[#FAFAFC] rounded-3xl p-6 border border-gray-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col min-h-[420px] transition">

//       {/* Header */}
//       <div className="mb-4 flex items-center justify-between">
//         <h2 className="text-xl font-bold text-gray-800">
//           Question {currentAnswerObj.questionNumber || currentQuestionIndex + 1}
//         </h2>
//         <span className="text-gray-500 text-sm">
//           {currentQuestionIndex + 1}/{questions.length}
//         </span>
//       </div>

//       {/* Question Box */}
//       <div className="p-4 rounded-xl bg-[#F1F3F6] border border-gray-200/50 mb-4 shadow-inner">
//         <p className="text-lg text-gray-700 leading-relaxed">
//           {currentQuestion}
//         </p>
//       </div>

//       {/* Textarea */}
//       <textarea
//         ref={textareaRef}
//         value={currentAnswerObj.answer || ""}
//         onChange={handleAnswerChange}
//         placeholder={
//           recognitionSupported
//             ? "Speak or type your answer..."
//             : "Type your answer..."
//         }
//         className="w-full min-h-[150px] rounded-xl p-4 bg-white border border-gray-300/70 
//                    focus:ring-2 focus:ring-blue-300 focus:outline-none resize-none transition 
//                    text-gray-800 shadow-sm"
//         disabled={currentAnswerObj.submitted}
//         onFocus={toggleListening}
//         onBlur={() => isListening && toggleListening()}
//       />

//       {/* Listening Status */}
//       {recognitionSupported && (
//         <div className="flex items-center mt-2">
//           <div
//             className={`w-3 h-3 rounded-full mr-2 ${
//               isListening ? "bg-green-500 animate-pulse" : "bg-gray-400"
//             }`}
//           ></div>
//           <span className="text-sm text-gray-500">
//             {isListening ? "Listening… Speak now" : "Click inside the box to start speaking"}
//           </span>
//         </div>
//       )}

//       {/* Buttons Section */}
//       <div className="mt-6 flex flex-col gap-4">

//         {/* Submit Button */}
//         {currentAnswerObj.submitted ? (
//           <div className="flex items-center text-green-600 font-semibold gap-1 justify-center">
//             <CheckCircle size={22} />
//             Submitted
//           </div>
//         ) : (
//           <Button
//             onClick={submitAnswer}
//             disabled={!currentAnswerObj.answer?.trim()}
//             className="w-full bg-blue-500 hover:bg-blue-600 text-white text-md py-3 rounded-xl"
//           >
//             Submit Answer
//           </Button>
//         )}

//         {/* Navigation */}
//         <div className="flex justify-between items-center mt-2">

//           {/* Previous */}
//           <Button
//             onClick={handlePreviousQuestion}
//             disabled={currentQuestionIndex === 0}
//             className="flex items-center gap-2 bg-[#E8EAED] hover:bg-[#E0E3E7] 
//                        text-gray-700 px-4 py-2 rounded-xl shadow-sm disabled:opacity-40"
//           >
//             <ArrowLeft size={18} />
//             Prev
//           </Button>

//           {/* Next or Finish */}
//           {currentQuestionIndex < questions.length - 1 ? (
//             <Button
//               onClick={handleNextQuestion}
//               className="flex items-center gap-2 bg-[#E8EAED] hover:bg-[#E0E3E7] 
//                          text-gray-700 px-4 py-2 rounded-xl shadow-sm"
//             >
//               Next
//               <ArrowRight size={18} />
//             </Button>
//           ) : (
//             <Button
//               onClick={submitInterview}
//               disabled={isSubmitting || !allSubmitted}
//               className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl shadow-md"
//             >
//               {isSubmitting ? "Submitting…" : "Finish Interview"}
//             </Button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default QuestionPanel;


// src/interviewbegin/QuestionPanel.jsx
import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";

const QuestionPanel = ({
  questions,
  answers,
  currentQuestionIndex,
  recognitionSupported,
  isListening,
  textareaRef,
  handleAnswerChange,
  toggleListening,
  handlePreviousQuestion,
  handleNextQuestion,
  submitAnswer,
  submitInterview,
  isSubmitting,
  validateAllAnswers,
}) => {
  const currentAnswerObj = answers[currentQuestionIndex] || {};
  const currentQuestion =
    questions.length > 0 ? questions[currentQuestionIndex] : "";
  const allSubmitted = validateAllAnswers();

  return (
    <div className="bg-[#FAFAFC] rounded-3xl p-6 border border-gray-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col min-h-[420px] transition">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">
          Question {currentAnswerObj.questionNumber || currentQuestionIndex + 1}
        </h2>
        <span className="text-gray-500 text-sm">
          {currentQuestionIndex + 1}/{questions.length}
        </span>
      </div>

      {/* Question Box */}
      <div className="p-4 rounded-xl bg-[#F1F3F6] border border-gray-200/50 mb-4 shadow-inner">
        <p className="text-lg text-gray-700 leading-relaxed">
          {currentQuestion || "No question loaded."}
        </p>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={currentAnswerObj.answer || ""}
        onChange={handleAnswerChange}
        placeholder={
          recognitionSupported
            ? "Speak or type your answer (you can also write code here)..."
            : "Type your answer (you can also write code here)..."
        }
        className="w-full min-h-[150px] rounded-xl p-4 bg-white border border-gray-300/70 
                   focus:ring-2 focus:ring-blue-300 focus:outline-none resize-none transition 
                   text-gray-800 shadow-sm"
        disabled={currentAnswerObj.submitted}
        onFocus={() => {
          if (recognitionSupported && !currentAnswerObj.submitted) {
            toggleListening();
          }
        }}
        onBlur={() => {
          if (recognitionSupported && isListening) {
            toggleListening();
          }
        }}
      />

      {/* Listening Status */}
      {recognitionSupported && (
        <div className="flex items-center mt-2">
          <div
            className={`w-3 h-3 rounded-full mr-2 ${
              isListening ? "bg-green-500 animate-pulse" : "bg-gray-400"
            }`}
          ></div>
          <span className="text-sm text-gray-500">
            {isListening
              ? "Listening… Speak now"
              : "Click inside the box to start speaking"}
          </span>
        </div>
      )}

      {/* Buttons Section */}
      <div className="mt-6 flex flex-col gap-4">
        {/* Submit Button */}
        {currentAnswerObj.submitted ? (
          <div className="flex items-center text-green-600 font-semibold gap-1 justify-center">
            <CheckCircle size={22} />
            Submitted
          </div>
        ) : (
          <Button
            onClick={submitAnswer}
            disabled={!currentAnswerObj.answer?.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-md py-3 rounded-xl"
          >
            Submit Answer
          </Button>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-2">
          {/* Previous */}
          <Button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 bg-[#E8EAED] hover:bg-[#E0E3E7] 
                       text-gray-700 px-4 py-2 rounded-xl shadow-sm disabled:opacity-40"
          >
            <ArrowLeft size={18} />
            Prev
          </Button>

          {/* Next or Finish */}
          {currentQuestionIndex < questions.length - 1 ? (
            <Button
              onClick={handleNextQuestion}
              className="flex items-center gap-2 bg-[#E8EAED] hover:bg-[#E0E3E7] 
                         text-gray-700 px-4 py-2 rounded-xl shadow-sm"
            >
              Next
              <ArrowRight size={18} />
            </Button>
          ) : (
            <Button
              onClick={submitInterview}
              disabled={isSubmitting || !allSubmitted}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl shadow-md"
            >
              {isSubmitting ? "Submitting…" : "Finish Interview"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionPanel;
