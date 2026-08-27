import React, { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, Star, Trophy, Target, TrendingUp, Clock, Award, Activity, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const getUserFromStorage = () => {
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
};

/** Deduplicate interviews by session_id or _id */
const deduplicateInterviews = (list = []) => {
  const seen = new Set();
  return list.filter((item) => {
    const key = item.session_id || item._id || item.id || JSON.stringify(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const UserProfile = () => {
  const navigate = useNavigate();
  const storedUser = getUserFromStorage();
  const email = storedUser?.email;
  const token = localStorage.getItem("token");

  const [profile, setProfile] = useState(null);
  const [latestScore, setLatestScore] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [scorecards, setScorecards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalInterviews: 0, averageScore: 0, improvement: 0, upcomingInterviews: 0 });

  useEffect(() => {
    if (!email) { navigate("/home/login", { replace: true }); return; }
    fetchAll();
  }, [email, token, navigate]);

  const fetchAll = async () => {
    try {
      const resProfile = await axios.get(`http://localhost:8000/api/profile/${email}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resProfile.data.success) {
        setProfile(resProfile.data.profile);
      } else {
        navigate("/profile/create", { replace: true });
        return;
      }

      const resScore = await axios.get("http://localhost:8000/api/scorecards/latest", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resScore.data.success) setLatestScore(resScore.data.scorecard);

      const resAllScores = await axios.get("http://localhost:8000/api/scorecards/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allScores = resAllScores.data.success ? (resAllScores.data.scorecards || []) : [];
      setScorecards(allScores);

      const resHistory = await axios.get("http://localhost:8000/api/interviews/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const raw = resHistory.data.success ? (resHistory.data.interviews || []) : [];
      const deduped = deduplicateInterviews(raw);
      setInterviews(deduped);

      calculateStats(allScores, deduped);
    } catch (err) {
      console.error("Dashboard load error:", err);
      if (err.response?.status === 404) navigate("/profile/create", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (allScores, allInterviews) => {
    const totalInterviews = allInterviews.length;
    let averageScore = 0;
    if (allScores.length > 0) {
      averageScore = Math.round(
        allScores.reduce((acc, s) => acc + (s.scores?.overallScore || 0), 0) / allScores.length
      );
    }
    let improvement = 0;
    if (allScores.length >= 2) {
      const recent = allScores.slice(0, Math.min(3, allScores.length));
      const old = allScores.slice(-Math.min(3, allScores.length));
      const recentAvg = recent.reduce((acc, s) => acc + (s.scores?.overallScore || 0), 0) / recent.length;
      const oldAvg = old.reduce((acc, s) => acc + (s.scores?.overallScore || 0), 0) / old.length;
      improvement = Math.round(recentAvg - oldAvg);
    }
    setStats({ totalInterviews, averageScore, improvement, upcomingInterviews: 0 });
  };

  if (loading) {
    return (
      <div className="h-full flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-full flex justify-center items-center">
        <div className="text-center">
          <p className="text-gray-700 mb-4">Redirecting to profile creation...</p>
          <button onClick={() => navigate("/profile/create")}
            className="bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition text-sm">
            Create Profile
          </button>
        </div>
      </div>
    );
  }

  const name = profile.fullName;
  const role = profile.role || "Aspiring Developer";
  const overall = latestScore?.scores?.overallScore || 0;
  const communication = latestScore?.scores?.fluency || 0;
  const technical = latestScore?.scores?.technicalAccuracy || 0;
  const confidence = latestScore?.scores?.confidence || 0;
  const suggestions = generateSuggestions(latestScore, stats);
  const initials = name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  return (
    <div className="min-h-full bg-gray-50">
      {/* Sticky dashboard header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 shadow-sm">
        <h1 className="text-lg font-bold text-gray-900">Welcome back, {name?.split(" ")[0]}</h1>
        <p className="text-gray-400 text-xs mt-0.5">Here's your interview performance overview</p>
      </div>

      <div className="p-6">
        {/* Stats row */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<Trophy size={20} />} title="Total Interviews" value={stats.totalInterviews} color="yellow" />
          <StatCard icon={<Target size={20} />} title="Average Score" value={`${stats.averageScore}%`} color="blue" />
          <StatCard
            icon={<TrendingUp size={20} />}
            title="Improvement"
            value={stats.improvement > 0 ? `+${stats.improvement}%` : `${stats.improvement}%`}
            color={stats.improvement >= 0 ? "green" : "red"}
          />
          <StatCard icon={<Clock size={20} />} title="Upcoming" value={stats.upcomingInterviews} color="blue" />
        </div>

        {/* Profile banner — STATIC avatar, no random photo */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6 flex items-center gap-4">
          {/* Static initials avatar */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900 truncate">{name}</h2>
            <p className="text-sm text-gray-500">{role}</p>
            <p className="text-xs text-gray-400 mt-0.5">{email}</p>
          </div>
          <button
            onClick={() => navigate("/profile/my-profile")}
            className="px-4 py-2 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition text-sm font-medium flex-shrink-0"
          >
            View Profile
          </button>
        </div>

        {/* Performance scores */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Activity size={15} className="text-blue-700" /> Latest Performance
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ScoreCard title="Overall" value={overall} color="blue" />
            <ScoreCard title="Communication" value={communication} color="sky" />
            <ScoreCard title="Technical" value={technical} color="indigo" />
            <ScoreCard title="Confidence" value={confidence} color="green" />
          </div>
        </div>

        {/* History + suggestions */}
        <div className="grid lg:grid-cols-2 gap-5 mb-6">
          {/* Interview history */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar size={15} className="text-blue-700" /> Recent Interviews
              </h3>
              <button onClick={() => navigate("/profile/interviews")}
                className="text-blue-700 text-xs font-medium hover:text-blue-800">
                View All →
              </button>
            </div>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {interviews.length === 0 ? (
                <div className="text-center py-10">
                  <Calendar size={36} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-sm text-gray-400 mb-4">No interviews yet</p>
                  <button onClick={() => navigate("/feature-individual-student")}
                    className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 text-sm">
                    Start First Interview
                  </button>
                </div>
              ) : (
                interviews.slice(0, 5).map((interview, idx) => (
                  <InterviewCard key={interview.session_id || interview.id || idx} interview={interview} navigate={navigate} />
                ))
              )}
            </div>
          </div>

          {/* Suggestions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Star size={15} className="text-yellow-500" /> Personalized Suggestions
            </h3>
            <ul className="space-y-2.5 max-h-64 overflow-y-auto pr-1 mb-4">
              {suggestions.map((tip, i) => (
                <li key={i} className="bg-blue-50 border border-blue-100 text-blue-900 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">💡</span> {tip}
                </li>
              ))}
            </ul>
            <button onClick={() => navigate("/feature-individual-student")}
              className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-medium transition">
              Practice Now
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          <QuickActionCard
            icon={<Target size={28} />}
            title="Start Mock Interview"
            desc="Practice with AI"
            onClick={() => navigate("/feature-individual-student")}
            from="from-blue-700" to="to-blue-900"
          />
          <QuickActionCard
            icon={<Award size={28} />}
            title="View All Scores"
            desc="Track performance"
            onClick={() => navigate("/profile/scores")}
            from="from-indigo-600" to="to-indigo-800"
          />
          <QuickActionCard
            icon={<Trophy size={28} />}
            title="Explore Jobs"
            desc="Find opportunities"
            onClick={() => navigate("/profile/jobs")}
            from="from-slate-700" to="to-slate-900"
          />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, color }) => {
  const colors = {
    yellow: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
  };
  const [bg, text] = (colors[color] || "bg-gray-50 text-gray-600").split(" ");
  return (
    <div className={`${bg} rounded-2xl border border-gray-100 p-4 shadow-sm`}>
      <div className={`${text} mb-2`}>{icon}</div>
      <p className="text-gray-500 text-xs font-medium">{title}</p>
      <p className={`text-2xl font-bold ${text} mt-1`}>{value}</p>
    </div>
  );
};

const ScoreCard = ({ title, value, color }) => {
  const map = {
    blue:   { text: "text-blue-700",   bar: "bg-blue-700",   bg: "bg-blue-50" },
    sky:    { text: "text-sky-700",    bar: "bg-sky-600",    bg: "bg-sky-50" },
    indigo: { text: "text-indigo-700", bar: "bg-indigo-700", bg: "bg-indigo-50" },
    green:  { text: "text-green-700",  bar: "bg-green-600",  bg: "bg-green-50" },
  };
  const c = map[color] || map.blue;
  return (
    <div className={`${c.bg} rounded-xl border border-gray-100 p-4`}>
      <p className="text-gray-500 text-xs font-medium mb-2">{title}</p>
      <p className={`text-3xl font-bold ${c.text} mb-3`}>{value}%</p>
      <div className="w-full bg-white rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${c.bar}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
};

const InterviewCard = ({ interview, navigate }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition group">
    {/* Static icon placeholder instead of photo */}
    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
      <User size={16} className="text-blue-700" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-800 truncate capitalize">{interview.role || "Interview"}</p>
      <p className="text-xs text-gray-400">
        {interview.date
          ? new Date(interview.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : "—"}
      </p>
      {interview.totalViolations > 0 && (
        <span className="text-xs text-red-600 font-medium">⚠️ {interview.totalViolations} violation{interview.totalViolations > 1 ? "s" : ""}</span>
      )}
    </div>
    <div className="text-right flex-shrink-0">
      <p className={`text-sm font-bold ${interview.score === 0 ? "text-red-500" : "text-blue-700"}`}>
        {interview.score ?? "—"}%
      </p>
      <button
        onClick={() => interview.id && navigate(`/scorecard/${interview.id}`)}
        className="text-xs text-blue-700 hover:underline mt-0.5"
      >
        Details
      </button>
    </div>
  </div>
);

const QuickActionCard = ({ icon, title, desc, onClick, from, to }) => (
  <button
    onClick={onClick}
    className={`bg-gradient-to-br ${from} ${to} p-5 rounded-2xl text-white hover:shadow-lg transition text-left`}
  >
    <div className="mb-3 opacity-90">{icon}</div>
    <h4 className="text-sm font-bold mb-0.5">{title}</h4>
    <p className="text-xs opacity-80">{desc}</p>
  </button>
);

function generateSuggestions(scorecard, stats) {
  const tips = [];
  if (!scorecard) {
    return [
      "Take your first mock interview to get personalized feedback!",
      "Practice regularly to build confidence and improve skills.",
      "Review common interview questions in your target role.",
    ];
  }
  const s = scorecard.scores;
  if (s.overallScore < 50) tips.push("Focus on fundamentals — review basic concepts in your field.");
  else if (s.overallScore < 70) tips.push("You're making progress! Focus on technical depth and clarity.");
  else tips.push("Great performance! Keep practicing to maintain consistency.");
  if (s.fluency < 60) tips.push("Improve communication by practicing the STAR method.");
  if (s.technicalAccuracy < 60) tips.push("Strengthen technical knowledge with hands-on coding practice.");
  if (s.confidence < 60) tips.push("Build confidence through regular mock interviews.");
  if (stats.improvement < 0) tips.push("Review past interviews and learn from mistakes.");
  else if (stats.improvement > 10) tips.push("Excellent improvement! You're on the right track.");
  if (stats.totalInterviews < 3) tips.push("Take more practice interviews to identify patterns.");
  tips.push("Research the company and role before every interview.");
  return tips.slice(0, 5);
}

export default UserProfile;
