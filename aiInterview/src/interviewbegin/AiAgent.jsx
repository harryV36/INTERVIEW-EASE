
import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Volume2, VolumeX } from "lucide-react";

const AiAgent = ({
  showScorecard,
  agentLoading,
  isSpeaking,
  agentMessages,
  speakText,
  stopSpeaking,
  currentQuestion,
}) => {
  const videoRef = useRef(null);

  // --- CONTROL VIDEO PLAYBACK ---
  useEffect(() => {
    if (!videoRef.current) return;

    if (isSpeaking || agentLoading) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0; // reset to first frame
    }
  }, [isSpeaking, agentLoading]);

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 flex flex-col justify-between min-h-[340px]">
      {/* Avatar + status */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-20 h-20">

          {/* AI VIDEO LOADER */}
          <video
            ref={videoRef}
            src="https://cdnl.iconscout.com/lottie/premium/preview-watermark/ai-loader-animation-gif-download-12340665.mp4"
            muted
            loop
            playsInline
            className={`w-full h-full object-cover rounded-full border-4 transition-all
              ${
                isSpeaking || agentLoading
                  ? "border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.7)] animate-pulse"
                  : "border-gray-300"
              }
            `}
          />

          {/* Status Badge */}
          <span
            className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 rounded-full 
              ${
                isSpeaking
                  ? "bg-green-500 text-white"
                  : agentLoading
                  ? "bg-purple-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }
            `}
          >
            {isSpeaking
              ? "Speaking..."
              : agentLoading
              ? "Thinking..."
              : "Ready"}
          </span>
        </div>

        {/* Title */}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-1">
            <Sparkles size={16} className="text-purple-500" />
            AI Interviewer
          </h2>
          <p className="text-xs text-gray-600">
            I’ll conduct your mock interview. Respond naturally using typing or voice.
          </p>
        </div>
      </div>

      {/* Agent Messages */}
      <div className="flex-1 bg-gray-50 rounded-2xl p-3 mb-3 overflow-auto max-h-40 border border-gray-100">
        {!agentMessages?.length ? (
          <p className="text-xs text-gray-500">
            Start the interview to hear from your AI interviewer.
          </p>
        ) : (
          <div className="space-y-2 text-sm">
            {agentMessages.slice(-4).map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === "assistant" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`px-3 py-2 rounded-2xl max-w-[80%] ${
                    m.role === "assistant"
                      ? "bg-purple-50 text-gray-900 border border-purple-100"
                      : "bg-gray-900 text-gray-50"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center gap-1"
              onClick={isSpeaking ? stopSpeaking : () => speakText(currentQuestion)}
              disabled={!currentQuestion}
            >
              {isSpeaking ? (
                <>
                  <VolumeX size={14} />
                  Stop Voice
                </>
              ) : (
                <>
                  <Volume2 size={14} />
                  Read Question
                </>
              )}
            </Button>
          </div>
          <span>Tip: Use clear structure + examples in answers.</span>
        </div>
      </div>
    </div>
  );
};

export default AiAgent;

