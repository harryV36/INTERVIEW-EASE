    // import React from "react";

    // const StartInterviewControls = ({
    // interviewStarted,
    // startInterview,
    // stopInterview
    // }) => {
    // return (
    //     <div className="flex items-center gap-2">
    //     {!interviewStarted ? (
    //         <button
    //         onClick={startInterview}
    //         className="bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-2 rounded-full text-white font-semibold shadow-lg hover:scale-105 transition"
    //         >
    //         🚀 Start Interview
    //         </button>
    //     ) : (
    //         <button
    //         onClick={stopInterview}
    //         className="bg-gradient-to-r from-red-500 to-red-700 px-6 py-2 rounded-xl text-white font-semibold shadow-lg hover:scale-105 transition"
    //         >
    //         ⏹ Stop
    //         </button>
    //     )}
    //     </div>
    // );
    // };

    // export default StartInterviewControls;


    import React from "react";

const StartInterviewControls = ({
  interviewStarted,
  startInterview,
  stopInterview,
}) => {
  return (
    <div className="flex items-center gap-2">
      {!interviewStarted ? (
        <button
          onClick={startInterview}
         className="
  px-6 py-2.5 rounded-xl font-semibold text-white transition-all
  bg-gradient-to-r from-blue-500 to-blue-700
  shadow-[0_4px_14px_rgba(59,130,246,0.45)]
  hover:shadow-[0_8px_24px_rgba(59,130,246,0.55)]
  hover:scale-[1.03] active:scale-[0.98]
"
        >
          Start Interview
        </button>
      ) : (
        <button
          onClick={stopInterview}
          className="
            px-6 py-2.5 
            rounded-xl 
            font-semibold 
            text-white 
            transition-all 
            bg-gradient-to-r from-red-500 to-rose-600
            shadow-[0_4px_14px_rgba(244,63,94,0.45)]
            hover:shadow-[0_8px_24px_rgba(244,63,94,0.55)]
            hover:scale-[1.03]
            active:scale-[0.98]
          "
        >
          Stop Interview
        </button>
      )}
    </div>
  );
};

export default StartInterviewControls;

