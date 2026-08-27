import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart2, Activity, TrendingUp, Star, AlertTriangle,
  Target, Zap, Brain, MessageCircle, Layers, ChevronRight,
} from "lucide-react";

const ScoresPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLatestScorecard = async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:8000/api/scorecards/latest", {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        if (!res.data?.success || !res.data.scorecard) {
          throw new Error(res.data?.error || "No scorecard found");
        }
        setData(res.data.scorecard);
      } catch (err) {
        setError("Could not load your latest interview result.");
      } finally {
        setLoading(false);
      }
    };
    fetchLatestScorecard();
  }, []);

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading your performance data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex flex-col items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm max-w-sm">
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart2 size={24} className="text-blue-500" />
          </div>
          <p className="text-gray-800 font-semibold mb-2">No results yet</p>
          <p className="text-gray-500 text-sm">{error || "Complete a mock interview to see your performance profile."}</p>
        </div>
      </div>
    );
  }

  const {
    scores,
    questionScores = [],
    mcqSummary = {},
    codingSummary = {},
    overallBand,
    overallMessage,
    globalImprovementTips = [],
    createdAt,
  } = data;

  const bandColor =
    overallBand === "Excellent"
      ? "text-emerald-600 bg-emerald-50"
      : overallBand === "Good"
      ? "text-blue-600 bg-blue-50"
      : "text-amber-600 bg-amber-50";

  const scorePercent = scores.overallScore ?? 0;
  const scoreArc = Math.min(scorePercent, 100);

  const metrics = [
    { label: "Technical Accuracy", value: scores.technicalAccuracy ?? 0, icon: Brain, color: "blue" },
    { label: "Fluency", value: scores.fluency ?? 0, icon: MessageCircle, color: "indigo" },
    { label: "Confidence", value: scores.confidence ?? 0, icon: Zap, color: "violet" },
    { label: "Keyword Usage", value: scores.keywordUsage ?? 0, icon: Target, color: "sky" },
    { label: "AI Video Score", value: scores.aiVideoScore ?? 0, icon: Activity, color: "blue" },
    { label: "Consistency", value: scores.consistencyScore ?? 0, icon: Layers, color: "indigo" },
  ];

  const colorMap = {
    blue:   { text: "text-blue-700",   bg: "bg-blue-100",   bar: "bg-blue-700",   ring: "ring-blue-100" },
    indigo: { text: "text-indigo-700", bg: "bg-indigo-100", bar: "bg-indigo-700", ring: "ring-indigo-100" },
    violet: { text: "text-violet-700", bg: "bg-violet-100", bar: "bg-violet-600", ring: "ring-violet-100" },
    sky:    { text: "text-sky-700",    bg: "bg-sky-100",    bar: "bg-sky-600",    ring: "ring-sky-100" },
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-700 rounded-xl flex items-center justify-center">
            <BarChart2 size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Performance Scorecard</h1>
            {createdAt && (
              <p className="text-xs text-gray-400">
                Last updated: {new Date(createdAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 md:p-8">

      {/* Overall Score Hero */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500 mb-1">Overall Score</p>
          <p className="text-gray-600 text-sm mb-3">Your performance in the mock interview</p>
          {overallBand && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${bandColor}`}>
              <Star size={13} />
              {overallBand}
            </span>
          )}
          {overallMessage && (
            <p className="text-gray-500 text-sm mt-3 max-w-md leading-relaxed">{overallMessage}</p>
          )}
        </div>

        {/* Score donut visual */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-28 h-28">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#E0EAFF" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke="#1D4ED8"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - scoreArc / 100)}`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">{scorePercent.toFixed(0)}%</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <TrendingUp size={13} />
            Latest Result
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {metrics.map(({ label, value, icon: Icon, color }) => {
          const c = colorMap[color] || colorMap.blue;
          return (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center`}>
                  <Icon size={15} className={c.text} />
                </div>
                <p className="text-xs text-gray-500 font-medium leading-tight">{label}</p>
              </div>
              <p className={`text-3xl font-bold ${c.text} mb-3`}>{value.toFixed(1)}%</p>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${c.bar} transition-all duration-500`}
                  style={{ width: `${Math.min(100, value)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-5 flex items-center gap-2">
          <Activity size={16} className="text-blue-500" />
          Category Breakdown
        </h3>
        <div className="space-y-4">
          {metrics.map(({ label, value, color }) => {
            const c = colorMap[color] || colorMap.blue;
            return (
              <div key={label}>
                <div className="flex justify-between text-sm text-gray-600 mb-1.5">
                  <span>{label}</span>
                  <span className={`font-semibold ${c.text}`}>{value.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div
                    className={`h-2 rounded-full ${c.bar} transition-all duration-500`}
                    style={{ width: `${Math.min(100, value)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Improvement Tips */}
      {globalImprovementTips.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            Improvement Suggestions
          </h3>
          <ul className="space-y-2">
            {globalImprovementTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <ChevronRight size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      </div>   {/* end flex-1 content wrapper */}
    </div>
  );
};

export default ScoresPage;
