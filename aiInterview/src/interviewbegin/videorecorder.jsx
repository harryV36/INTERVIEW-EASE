import React, { useEffect, useRef, useState } from "react";

const VedioRecorder = () => {
  const videoRef = useRef(null);
  const [recordedVideoURL, setRecordedVideoURL] = useState(null);

  const mediaRecorderRef = useRef(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const audioChunks = useRef([]);

  useEffect(() => {
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        videoRef.current.srcObject = stream;
        setMediaStream(stream);
      } catch (err) {
        console.error("Error accessing media devices.", err);
      }
    };

    getMedia();

    return () => {
      mediaStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const startRecording = () => {
    audioChunks.current = [];
    const recorder = new MediaRecorder(mediaStream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunks.current.push(e.data);
      }
    };

    // recorder.onstop = () => {
    //   const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
    //   console.log("Audio Blob ready:", audioBlob);
    //   // 🔜 You can send audioBlob to your backend here
    // };

    recorder.onstop = () => {
      const audioBlob = new Blob(audioChunks.current, { type: "video/webm" });
      const videoURL = URL.createObjectURL(audioBlob);
      setRecordedVideoURL(videoURL); // 👈 Set the URL for playback
    };

    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 flex flex-col items-center justify-center min-h-[400px]">
      <h2 className="text-lg font-semibold mb-4">🎥 Video Section</h2>

      {recordedVideoURL && (
        <div className="mt-6 w-full">
          <h3 className="text-md font-semibold mb-2">🎬 Recorded Video:</h3>
          <video
            src={recordedVideoURL}
            controls
            className="w-full rounded shadow"
          />
        </div>
      )}

      <div className="bg-black w-full h-64 rounded-lg flex items-center justify-center text-white overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          className="w-full h-full object-cover"
        />
      </div>

      <div className="space-x-4 mt-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Stop Recording
          </button>
        )}
      </div>
    </div>
  );
};

export default VedioRecorder;