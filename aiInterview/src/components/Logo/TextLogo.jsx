import React, { useRef, useEffect } from "react";
import gsap from "gsap";

const TextLogo = () => {
  const logoRef = useRef(null);

  // Fade-in animation on mount
  useEffect(() => {
    gsap.fromTo(
      logoRef.current,
      {
        opacity: 0,
        y: -10,
        scale: 0.97,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "power3.out",
      }
    );
  }, []);

  return (
    <div
      ref={logoRef}
      className="select-none inline-flex items-baseline gap-2"
      style={{ willChange: "transform, opacity" }}
    >
      {/* Interview */}
      <span
        className="
          text-[19px] sm:text-[20px]
          font-bold
          tracking-tight
          text-slate-900
        "
      >
        Interview
      </span>

      {/* ease */}
      <span
        className="
          text-[21px] sm:text-[22px]
          font-extrabold
          bg-gradient-to-r from-blue-500 to-sky-400
          bg-clip-text
          text-transparent
          tracking-tight
          font-['Pacifico','cursive']
        "
      >
        ease
      </span>
    </div>
  );
};

export default TextLogo;
