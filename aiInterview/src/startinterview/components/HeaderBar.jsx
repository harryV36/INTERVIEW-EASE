import React from "react";
import { Link } from "react-router-dom";
import { MdOutlineArrowBackIos } from "react-icons/md";
import { motion } from "framer-motion";

export default function HeaderBar() {
  return (
    <motion.header
      className="mb-10 flex flex-col items-center"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Top Nav Row */}
      <div className="w-full flex items-center justify-between">
        {/* Back button */}
        <Link to="/">
          <button className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-100 transition">
            <MdOutlineArrowBackIos className="text-slate-700" />
          </button>
        </Link>

        {/* Branding Badge */}
        <div
          className="
            px-4 py-1 
            bg-gradient-to-r from-indigo-500 to-blue-500 
            text-white text-sm font-medium 
            rounded-full shadow-md select-none
          "
        >
          AI Interview Assistant ✨
        </div>

        <div className="w-[40px]"></div>
      </div>

      {/* Main Title */}
      {/* <h1 className="mt-6 text-4xl font-extrabold text-slate-800 tracking-tight text-center">
        Start Your AI Mock Interview
      </h1> */}

      {/* Tagline */}
      {/* <p className="mt-2 text-slate-500 text-sm text-center max-w-md">
        Upload your resume, pick topics, and let AI simulate a real, confidence-boosting interview.
      </p> */}
    </motion.header>
  );
}
