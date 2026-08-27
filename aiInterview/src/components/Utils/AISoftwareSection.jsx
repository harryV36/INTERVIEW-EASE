import React from "react";
import { motion } from "framer-motion";
import sideimage from "../../assets/sideimg.jpg"
const AISoftwareSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* LEFT TEXT CONTENT */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
            Interview Ease #1 End-to-End AI<br /> 
            Video Interview Software
          </h2>

          {/* underline */}
          <div className="w-40 h-[3px] bg-blue-500 rounded-full mb-6"></div>

          <p className="text-gray-600 leading-relaxed text-lg">
            <span className="text-blue-600 font-semibold">Interview Ease</span> 
            {" "}is all about efficiency. It's a state-of-the-art AI recruiting software that uses 
            <span className="font-medium"> Generative AI</span> and 
            <span className="font-medium"> Explainable AI</span> to automate job descriptions, suggest interview questions,
            and intelligently shortlist candidates.
          </p>

          <p className="text-gray-600 leading-relaxed text-lg mt-4">
            Our advanced smart interview platform significantly reduces time spent on unnecessary pre-interviews, allowing you to focus on what truly matters — your company. 
          </p>

          <p className="text-gray-600 leading-relaxed text-lg mt-4">
            Equipped with cutting-edge hiring technology, it provides detailed psychological, behavioral, and technical insights for every candidate — helping streamline your entire recruitment process.
          </p>
        </motion.div>

        {/* RIGHT IMAGE WITH DECORATION */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative flex justify-center"
        >
          {/* Blue dots behind the image (top left) */}
          <div className="absolute -top-8 -left-8 grid grid-cols-6 gap-2 opacity-50">
            {Array.from({ length: 18 }).map((_, i) => (
              <span key={i} className="w-2 h-2 bg-blue-300 rounded-full"></span>
            ))}
          </div>

          {/* Orange dots behind the image (bottom right) */}
          <div className="absolute -bottom-8 -right-8 grid grid-cols-6 gap-2 opacity-50">
            {Array.from({ length: 18 }).map((_, i) => (
              <span key={i} className="w-2 h-2 bg-orange-300 rounded-full"></span>
            ))}
          </div>

          <div className="rounded-2xl overflow-hidden shadow-xl bg-white relative z-10">
            <img
              src= {sideimage}
              alt="AI Interview Example"
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AISoftwareSection;
