

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Gauge,
  Layers,
  MessageSquare,
  FileText,
  Scan,
} from "lucide-react";

// Features (with icon + number)
const benefits = [
  {
    number: "01",
    title: "AI-Powered Interviews",
    text: "Simulates real interviews and analyzes clarity, confidence, tone, and behavior.",
    icon: <Brain size={34} className="text-purple-400" />,
  },
  {
    number: "02",
    title: "Smart Auto-Scoring",
    text: "Instant AI-generated scores based on communication quality and job-role fit.",
    icon: <Gauge size={34} className="text-green-400" />,
  },
  {
    number: "03",
    title: "AI-Generated Questions",
    text: "Auto-creates role-specific interview questions using AI.",
    icon: <Layers size={34} className="text-orange-400" />,
  },
  {
    number: "04",
    title: "Personality Insights",
    text: "Analyzes tone, pace, personality traits, and speaking behavior.",
    icon: <MessageSquare size={34} className="text-pink-400" />,
  },
  {
    number: "05",
    title: "Resume Parsing",
    text: "Extracts skills, experience, education, and strengths.",
    icon: <FileText size={34} className="text-blue-400" />,
  },
  {
    number: "06",
    title: "Analytics Dashboard",
    text: "View analytics, score trends, rankings, and hiring metrics.",
    icon: <Scan size={34} className="text-yellow-400" />,
  },
];

// Group into sets of 3
const chunk = (arr) => {
  const out = [];
  for (let i = 0; i < arr.length; i += 3) out.push(arr.slice(i, i + 3));
  return out;
};

const slides = chunk(benefits);

const KeyBenefits = () => {
  const [index, setIndex] = useState(0);

  const handleDragEnd = (event, info) => {
    const threshold = 100;

    if (info.offset.x < -threshold) {
      setIndex((prev) => (prev + 1) % slides.length);
    } else if (info.offset.x > threshold) {
      setIndex((prev) => (prev - 1 + slides.length) % slides.length);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 mb-28">

      {/* Centered Heading */}
      <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
       What Makes Us Different
      </h2>

      {/* Carousel Wrapper */}
      <div className="overflow-hidden w-full">
        <motion.div
          className="flex"
          animate={{ x: `-${index * 100}%` }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          style={{ cursor: "grab" }}
        >
          {slides.map((group, slideIdx) => (
            <div
              key={slideIdx}
              className="w-full flex-shrink-0 px-2"
              style={{ width: "100%" }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

                {group.map((item, i) => (
                  <div
                    key={i}
                    className="
                      relative
                      rounded-2xl 
                  bg-gray-50
                     border-pink-400
                     
                      transition 
                      p-6
                      flex flex-col
                      items-center
                      text-center
                      mt-8 mb-8
                      text-black
                    "
                  >
                    {/* Number Badge */}
                    <span
                      className="
                        absolute top-3 left-3 
                        bg-blue-600 text-white 
                        text-xs font-semibold 
                        py-1 px-2 rounded-full
                        shadow-md
                      "
                    >
                      {item.number}
                    </span>

                    {/* Icon */}
                    <div className="w-16 h-16 rounded-2xl bg-gray-200 shadow flex items-center justify-center mb-4">
                      {item.icon}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold mb-2">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-black text-sm leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                ))}

              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Slide Indicators */}
      <div className="flex justify-center mt-6 gap-2">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`
              w-2 h-2 rounded-full transition-all 
              ${i === index ? "bg-blue-600 scale-90" : "bg-gray-400"}
            `}
          ></div>
        ))}
      </div>

    </div>
  );
};

export default KeyBenefits;
