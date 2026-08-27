


import React from "react";

// SAMPLE IMAGE
const sampleImage =
  "https://images.unsplash.com/photo-1581091215367-59ab6b28fd5d?auto=format&fit=crop&w=800&q=80";

const InteractiveHero3D = () => {
  return (
    <section className="bg-gradient-to-br from-blue-50 via-gray-50 to-white py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">

          {/* LEFT CONTENT */}
          <div className="md:w-6/12 lg:w-7/12 text-center md:text-left">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 mb-2">
              The Future of Hiring is Here
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-4">
              A Smarter, Modern <span className="text-blue-600">AI Experience</span>
            </h1>

            <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto md:mx-0">
              Clean, simple and modern — no animations, just a professional hero section
              with a right-side preview image.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition">
                Get Started
              </button>

              <button className="px-8 py-3 bg-white text-gray-800 font-semibold rounded-full border border-gray-300 shadow-md hover:bg-gray-50 transition">
                Learn More
              </button>
            </div>
          </div>

          {/* RIGHT SIDE — SIMPLE DIV WITH IMAGE */}
          <div className="md:w-6/12 lg:w-5/12 flex justify-center">
            <div className="p-4 rounded-2xl shadow-xl bg-white">
              <img
                src={sampleImage}
                alt="AI Illustration"
                className="w-72 sm:w-80 md:w-96 rounded-2xl shadow-xl"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default InteractiveHero3D;

