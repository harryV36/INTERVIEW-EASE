import React, { useEffect, useRef } from "react";

const VideoComponent = () => {
  const imgRef = useRef(null);

  useEffect(() => {
    imgRef.current.src = "http://localhost:5000/video";

    return () => {
      // Stop camera when component unmounts
      fetch("http://localhost:5000/stop");
    };
  }, []);

  return (
    <img
      ref={imgRef}
      alt="Face Stream"
      className="w-full h-auto rounded-lg object-cover"
    />
  );
};

export default VideoComponent;