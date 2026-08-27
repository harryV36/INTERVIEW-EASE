import React from "react";
import { motion } from "framer-motion";
import { Video, HelpCircle, Smartphone, Star, Settings, BarChart2 } from "lucide-react";
import middleimg from "../../assets/middleimg.jpg";

const features = [
  {
    title: "Know what was happening",
    text: "See candidate sessions and recordings so you never miss a moment — review on your schedule.",
    icon: Video,
    align: "left",
  },
  {
    title: "Suggested or custom questions",
    text: "Use our question library or design your own to fit any role and culture.",
    icon: HelpCircle,
    align: "left",
  },
  {
    title: "Interview anywhere",
    text: "Candidates can interview on any device — no more scheduling stress.",
    icon: Smartphone,
    align: "left",
  },
  {
    title: "Find your super hires",
    text: "Surface top candidates using data-driven signals before final rounds.",
    icon: Star,
    align: "right",
  },
  {
    title: "Recalibrate easily",
    text: "Adjust scoring rubrics as roles evolve — adapt in minutes, not weeks.",
    icon: Settings,
    align: "right",
  },
  {
    title: "Trust your instincts",
    text: "Back intuition with data — contextual reports to support hiring decisions.",
    icon: BarChart2,
    align: "right",
  },
];

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" },
  viewport: { once: true, amount: 0.2 },
};

const FeatureCard = ({ title, text, icon: Icon, align }) => (
  <motion.div {...fadeIn} className={`flex ${align === "right" ? "justify-end" : "justify-start"}`}>
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 w-full max-w-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon size={17} className="text-blue-600" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  </motion.div>
);

const HiringAssistantDetails = () => (
  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <motion.div {...fadeIn} className="mb-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">All-in-one platform</p>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
        Your Personal All-In-One Hiring Assistant
      </h2>
    </motion.div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
      {/* Left features */}
      <div className="space-y-4">
        {features.filter((f) => f.align === "left").map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>

      {/* Center image */}
      <motion.div {...fadeIn} className="flex justify-center order-first md:order-none">
        <div className="rounded-2xl overflow-hidden border-2 border-blue-100 shadow-md w-full max-w-xs">
          <img
            src={middleimg}
            alt="Hiring Assistant"
            className="w-full h-auto"
            loading="lazy"
          />
        </div>
      </motion.div>

      {/* Right features */}
      <div className="space-y-4">
        {features.filter((f) => f.align === "right").map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>
    </div>
  </div>
);

export default HiringAssistantDetails;
