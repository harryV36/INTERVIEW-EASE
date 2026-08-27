import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Award,
  TrendingUp,
  TrendingDown,
  User,
  Filter,
  Search,
  Eye,
  BarChart3,
  Target,
  Download,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  Percent,
  Users,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
} from "lucide-react";

const MemberScoresPage = () => {
  const [members, setMembers] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("score");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedMember, setSelectedMember] = useState(null);
  const [eligibilityThreshold, setEligibilityThreshold] = useState(60);
  const [showThresholdModal, setShowThresholdModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      const membersRes = await axios.get(
        "http://localhost:8000/api/organization/members/performance",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const membersList = membersRes.data.members || [];
      setMembers(membersList);

      const scoresData = {};
      for (const member of membersList) {
        try {
          const scoreRes = await axios.get(
            `http://localhost:8000/api/organization/member/${member.userId}/scores`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (scoreRes.data.success) {
            scoresData[member.userId] = scoreRes.data.scores || [];
          }
        } catch {
          scoresData[member.userId] = [];
        }
      }

      setScores(scoresData);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateMemberStats = (memberId) => {
    const memberScores = scores[memberId] || [];

    if (memberScores.length === 0) {
      return {
        totalInterviews: 0,
        averageScore: 0,
        bestScore: 0,
        worstScore: 0,
        improvement: 0,
        consistency: 0,
        passRate: 0,
        recentTrend: "stable",
        strengthAreas: [],
        weakAreas: [],
      };
    }

    const overallScores = memberScores.map((s) => s.overallScore || 0);
    const sum = overallScores.reduce((acc, score) => acc + score, 0);
    const average = Math.round(sum / memberScores.length);
    const best = Math.max(...overallScores);
    const worst = Math.min(...overallScores);

    const variance =
      overallScores.reduce(
        (acc, score) => acc + Math.pow(score - average, 2),
        0
      ) / overallScores.length;
    const stdDev = Math.sqrt(variance);
    const consistency = Math.max(0, 100 - stdDev);

    const passed = overallScores.filter(
      (s) => s >= eligibilityThreshold
    ).length;
    const passRate = Math.round((passed / overallScores.length) * 100);

    let improvement = 0;
    let recentTrend = "stable";
    if (memberScores.length >= 3) {
      const recent = memberScores.slice(0, 3);
      const old = memberScores.slice(-3);

      const recentAvg =
        recent.reduce((acc, s) => acc + (s.overallScore || 0), 0) /
        recent.length;
      const oldAvg =
        old.reduce((acc, s) => acc + (s.overallScore || 0), 0) / old.length;

      improvement = Math.round(recentAvg - oldAvg);

      if (improvement > 5) recentTrend = "improving";
      else if (improvement < -5) recentTrend = "declining";
    }

    const avgScores = {
      fluency: 0,
      confidence: 0,
      technicalAccuracy: 0,
      keywordUsage: 0,
      count: 0,
    };

    memberScores.forEach((s) => {
      if (s.scores) {
        avgScores.fluency += s.scores.fluency || 0;
        avgScores.confidence += s.scores.confidence || 0;
        avgScores.technicalAccuracy += s.scores.technicalAccuracy || 0;
        avgScores.keywordUsage += s.scores.keywordUsage || 0;
        avgScores.count++;
      }
    });

    const areas = [];
    if (avgScores.count > 0) {
      areas.push({
        name: "Fluency",
        score: Math.round(avgScores.fluency / avgScores.count),
      });
      areas.push({
        name: "Confidence",
        score: Math.round(avgScores.confidence / avgScores.count),
      });
      areas.push({
        name: "Technical",
        score: Math.round(avgScores.technicalAccuracy / avgScores.count),
      });
      areas.push({
        name: "Keywords",
        score: Math.round(avgScores.keywordUsage / avgScores.count),
      });
    }

    areas.sort((a, b) => b.score - a.score);
    const strengthAreas = areas.slice(0, 2);
    const weakAreas = areas.slice(-2).reverse();

    return {
      totalInterviews: memberScores.length,
      averageScore: average,
      bestScore: best,
      worstScore: worst,
      improvement,
      consistency: Math.round(consistency),
      passRate,
      recentTrend,
      strengthAreas,
      weakAreas,
    };
  };

  const enrichedMembers = members.map((member) => ({
    ...member,
    stats: calculateMemberStats(member.userId),
  }));

  let filteredMembers = enrichedMembers.filter((member) => {
    if (!searchQuery && filterStatus === "all") return true;

    let matchesSearch = true;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      matchesSearch =
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query);
    }

    let matchesStatus = true;
    if (filterStatus === "eligible") {
      matchesStatus = member.stats.averageScore >= eligibilityThreshold;
    } else if (filterStatus === "failed") {
      matchesStatus =
        member.stats.averageScore < eligibilityThreshold &&
        member.stats.totalInterviews > 0;
    }

    return matchesSearch && matchesStatus;
  });

  if (sortBy === "name") {
    filteredMembers.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === "score") {
    filteredMembers.sort(
      (a, b) => b.stats.averageScore - a.stats.averageScore
    );
  } else if (sortBy === "interviews") {
    filteredMembers.sort(
      (a, b) => b.stats.totalInterviews - a.stats.totalInterviews
    );
  }

  const orgStats = {
    totalMembers: members.length,
    totalInterviews: enrichedMembers.reduce(
      (acc, m) => acc + m.stats.totalInterviews,
      0
    ),
    avgScore: Math.round(
      enrichedMembers.reduce((acc, m) => acc + m.stats.averageScore, 0) /
        (members.length || 1)
    ),
    eligible: enrichedMembers.filter(
      (m) =>
        m.stats.averageScore >= eligibilityThreshold &&
        m.stats.totalInterviews > 0
    ).length,
    failed: enrichedMembers.filter(
      (m) =>
        m.stats.averageScore < eligibilityThreshold &&
        m.stats.totalInterviews > 0
    ).length,
  };

  const downloadExcel = () => {
    const eligibleMembers = enrichedMembers.filter(
      (m) =>
        m.stats.averageScore >= eligibilityThreshold &&
        m.stats.totalInterviews > 0
    );

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent +=
      "Name,Email,Average Score,Best Score,Total Interviews,Pass Rate,Consistency,Trend,Strengths,Weak Areas,Status\n";

    eligibleMembers.forEach((member) => {
      const strengths = member.stats.strengthAreas
        .map((a) => `${a.name}(${a.score})`)
        .join("; ");
      const weaknesses = member.stats.weakAreas
        .map((a) => `${a.name}(${a.score})`)
        .join("; ");

      csvContent += `"${member.name}","${member.email}",${member.stats.averageScore},${member.stats.bestScore},${member.stats.totalInterviews},${member.stats.passRate}%,${member.stats.consistency}%,${member.stats.recentTrend},"${strengths}","${weaknesses}",Eligible\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `eligible_members_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllScores = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Name,Email,Average Score,Status\n";

    enrichedMembers.forEach((member) => {
      const status =
        member.stats.totalInterviews === 0
          ? "Not Attempted"
          : member.stats.averageScore >= eligibilityThreshold
          ? "Eligible"
          : "Failed";

      csvContent += `"${member.name}","${member.email}",${member.stats.averageScore},${status}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `all_members_scores_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-blue-800 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex items-center gap-3 flex-wrap">
        <Award size={18} className="text-blue-800" />
        <h1 className="text-base font-bold text-gray-900 flex-1">
          Member Performance
        </h1>

        <div className="relative w-44">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50"
          />
        </div>

        <button
          onClick={() => setShowThresholdModal(true)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 flex items-center gap-1.5"
        >
          <Target size={14} className="text-blue-800" />
          Threshold: {eligibilityThreshold}%
        </button>

        <button
          onClick={downloadAllScores}
          className="px-3 py-2 bg-gray-700 text-white rounded-xl text-sm flex items-center gap-1.5 hover:bg-gray-800"
        >
          <Download size={14} />
          All Scores
        </button>

        <button
          onClick={downloadExcel}
          className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-sm flex items-center gap-1.5 hover:bg-emerald-700"
        >
          <Download size={14} />
          Eligible Only
        </button>
      </div>

      {/* Main Content */}
      <div className="p-6 flex-1">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mb-2">
              <Users size={16} className="text-blue-700" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {orgStats.totalMembers}
            </p>
            <p className="text-xs text-gray-400">Total Members</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center mb-2">
              <BarChart3 size={16} className="text-indigo-700" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {orgStats.totalInterviews}
            </p>
            <p className="text-xs text-gray-400">Total Interviews</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center mb-2">
              <Target size={16} className="text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {orgStats.avgScore}%
            </p>
            <p className="text-xs text-gray-400">Avg Score</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mb-2">
              <CheckCircle size={16} className="text-emerald-700" />
            </div>
            <p className="text-2xl font-bold text-emerald-800">
              {orgStats.eligible}
            </p>
            <p className="text-xs text-gray-400">Eligible</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center mb-2">
              <XCircle size={16} className="text-rose-600" />
            </div>
            <p className="text-2xl font-bold text-rose-700">
              {orgStats.failed}
            </p>
            <p className="text-xs text-gray-400">Failed</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 mb-5 flex items-center gap-3 flex-wrap">
          <Filter size={15} className="text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="all">All Status</option>
            <option value="eligible">Eligible ({orgStats.eligible})</option>
            <option value="failed">Failed ({orgStats.failed})</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="score">Sort by Score</option>
            <option value="name">Sort by Name</option>
            <option value="interviews">Sort by Interviews</option>
          </select>
        </div>

        {/* Member Cards */}
        {filteredMembers.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMembers.map((member) => (
              <MemberCard
                key={member.userId}
                member={member}
                eligibilityThreshold={eligibilityThreshold}
                onViewDetails={() => setSelectedMember(member)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-20 text-center">
            <User size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-500">
              No members found
            </p>
          </div>
        )}
      </div>

      {selectedMember && (
        <MemberDetailsModal
          member={selectedMember}
          scores={scores[selectedMember.userId] || []}
          eligibilityThreshold={eligibilityThreshold}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {showThresholdModal && (
        <ThresholdModal
          threshold={eligibilityThreshold}
          onSave={(newThreshold) => {
            setEligibilityThreshold(newThreshold);
            setShowThresholdModal(false);
          }}
          onClose={() => setShowThresholdModal(false)}
        />
      )}
    </div>
  );
};

const getAvatarColor = (name) => {
  const letter = (name || "A").charAt(0).toUpperCase();
  const code = letter.charCodeAt(0);
  if (code <= 69) return "bg-blue-700";
  if (code <= 74) return "bg-violet-700";
  if (code <= 79) return "bg-emerald-700";
  if (code <= 84) return "bg-amber-600";
  return "bg-rose-600";
};

const MemberCard = ({ member, eligibilityThreshold, onViewDetails }) => {
  const { stats } = member;
  const hasAttempted = stats.totalInterviews > 0;
  const isEligible =
    hasAttempted && stats.averageScore >= eligibilityThreshold;
  const isFailed =
    hasAttempted && stats.averageScore < eligibilityThreshold;

  const borderColor = isEligible
    ? "border-emerald-200"
    : isFailed
    ? "border-rose-200"
    : "border-gray-200";

  const stripColor = isEligible
    ? "bg-emerald-500"
    : isFailed
    ? "bg-rose-400"
    : "bg-gray-200";

  const scoreBoxBg = isEligible
    ? "bg-emerald-50"
    : isFailed
    ? "bg-rose-50"
    : "bg-gray-50";

  const scoreTextColor = isEligible
    ? "text-emerald-700"
    : isFailed
    ? "text-rose-600"
    : "text-gray-400";

  const btnClass = isEligible
    ? "bg-emerald-700 text-white hover:bg-emerald-800"
    : isFailed
    ? "bg-rose-600 text-white hover:bg-rose-700"
    : "bg-gray-600 text-white hover:bg-gray-700";

  return (
    <div
      className={`bg-white rounded-2xl border-2 shadow-sm transition-all hover:shadow-md ${borderColor}`}
    >
      {/* Top strip */}
      <div className={`h-2 rounded-t-2xl ${stripColor}`} />

      <div className="p-4">
        {/* Status badge */}
        {isEligible && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 bg-emerald-100 text-emerald-700">
            <CheckCircle size={10} />
            Eligible
          </span>
        )}
        {isFailed && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 bg-rose-100 text-rose-600">
            <XCircle size={10} />
            Failed
          </span>
        )}
        {!hasAttempted && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 bg-gray-100 text-gray-500">
            Not Started
          </span>
        )}

        {/* Avatar + info */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 ${getAvatarColor(
              member.name
            )}`}
          >
            {member.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {member.name}
            </p>
            <p className="text-xs text-gray-400 truncate">{member.email}</p>
          </div>
        </div>

        {/* Avg score box */}
        <div
          className={`rounded-xl p-3 mb-3 flex items-center justify-between ${scoreBoxBg}`}
        >
          <p className="text-xs text-gray-500">Avg Score</p>
          <div className="flex items-center gap-2">
            {stats.totalInterviews >= 3 &&
              (stats.recentTrend === "improving" ? (
                <TrendingUp size={14} className="text-green-500" />
              ) : stats.recentTrend === "declining" ? (
                <TrendingDown size={14} className="text-red-500" />
              ) : null)}
            <span className={`text-2xl font-bold ${scoreTextColor}`}>
              {stats.averageScore}%
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-400">Interviews</p>
            <p className="font-semibold text-gray-800 text-sm">
              {stats.totalInterviews}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-400">Pass Rate</p>
            <p className="font-semibold text-blue-800 text-sm">
              {stats.passRate}%
            </p>
          </div>
          <div className="bg-indigo-50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-400">Best</p>
            <p className="font-semibold text-indigo-700 text-sm">
              {stats.bestScore}%
            </p>
          </div>
        </div>

        {/* Strengths */}
        {stats.strengthAreas.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <CheckCircle size={10} className="text-emerald-600 flex-shrink-0" />
            <span>{stats.strengthAreas.map((a) => a.name).join(" · ")}</span>
          </div>
        )}

        {/* View button */}
        <button
          onClick={onViewDetails}
          className={`w-full mt-2 px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition ${btnClass}`}
        >
          <Eye size={14} />
          View Analysis
        </button>
      </div>
    </div>
  );
};

const MemberDetailsModal = ({
  member,
  scores,
  eligibilityThreshold,
  onClose,
}) => {
  const [expandedScore, setExpandedScore] = useState(null);

  const isEligible =
    member.stats.averageScore >= eligibilityThreshold &&
    member.stats.totalInterviews > 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-gray-900">{member.name}</h2>
              {member.stats.totalInterviews > 0 && (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isEligible
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-600"
                  }`}
                >
                  {isEligible ? (
                    <CheckCircle size={10} />
                  ) : (
                    <XCircle size={10} />
                  )}
                  {isEligible ? "Eligible" : "Failed"}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400">{member.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div
              className={`rounded-xl p-4 text-center ${
                isEligible ? "bg-emerald-50" : "bg-rose-50"
              }`}
            >
              <p className="text-xs text-gray-500 mb-1">Avg Score</p>
              <p
                className={`text-3xl font-bold ${
                  isEligible ? "text-emerald-700" : "text-rose-600"
                }`}
              >
                {member.stats.averageScore}%
              </p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Pass Rate</p>
              <p className="text-3xl font-bold text-indigo-700">
                {member.stats.passRate}%
              </p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Consistency</p>
              <p className="text-3xl font-bold text-amber-600">
                {member.stats.consistency}%
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Score Range</p>
              <p className="text-lg font-bold text-gray-700">
                {member.stats.worstScore}–{member.stats.bestScore}%
              </p>
            </div>
          </div>

          {/* Strengths / Weak areas */}
          {(member.stats.strengthAreas.length > 0 ||
            member.stats.weakAreas.length > 0) && (
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <h3 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-1.5">
                  <CheckCircle size={14} />
                  Key Strengths
                </h3>
                <div className="space-y-2">
                  {member.stats.strengthAreas.map((area, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{area.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-emerald-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full"
                            style={{ width: `${area.score * 10}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-emerald-700 w-8">
                          {area.score}/10
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
                <h3 className="text-sm font-semibold text-rose-700 mb-3 flex items-center gap-1.5">
                  <XCircle size={14} />
                  Areas for Improvement
                </h3>
                <div className="space-y-2">
                  {member.stats.weakAreas.map((area, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{area.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-rose-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-500 rounded-full"
                            style={{ width: `${area.score * 10}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-rose-600 w-8">
                          {area.score}/10
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Interview history */}
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar size={15} className="text-blue-800" />
            Interview History
          </h3>

          {scores.length > 0 ? (
            <div className="space-y-3">
              {scores.map((score, idx) => {
                const isPassed = score.overallScore >= eligibilityThreshold;
                const isExpanded = expandedScore === idx;

                return (
                  <div
                    key={score.id || idx}
                    className={`rounded-xl border-2 overflow-hidden ${
                      isPassed
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-rose-200 bg-rose-50"
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {score.role || "Interview"} #{scores.length - idx}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              isPassed
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-600"
                            }`}
                          >
                            {isPassed ? "PASS" : "FAIL"}
                          </span>
                        </div>
                        <span
                          className={`text-2xl font-bold ${
                            isPassed ? "text-emerald-700" : "text-rose-600"
                          }`}
                        >
                          {score.overallScore}%
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(score.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(score.createdAt).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {[
                          {
                            label: "Technical",
                            val: score.scores?.technicalAccuracy,
                          },
                          { label: "Fluency", val: score.scores?.fluency },
                          {
                            label: "Confidence",
                            val: score.scores?.confidence,
                          },
                          {
                            label: "Keywords",
                            val: score.scores?.keywordUsage,
                          },
                        ].map(({ label, val }) => (
                          <div
                            key={label}
                            className="bg-white/60 rounded-lg p-2 text-center"
                          >
                            <p className="text-xs text-gray-500">{label}</p>
                            <p className="text-sm font-bold text-gray-800">
                              {val || 0}/10
                            </p>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() =>
                          setExpandedScore(isExpanded ? null : idx)
                        }
                        className="w-full px-3 py-1.5 bg-white/70 hover:bg-white border border-gray-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp size={13} />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown size={13} />
                            Show Details
                          </>
                        )}
                      </button>

                      {isExpanded && score.overallMessage && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-600 mb-1">
                            Feedback:
                          </p>
                          <p className="text-xs text-gray-500">
                            {score.overallMessage}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-12 text-center">
              <BarChart3 size={36} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">
                No interview history available
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ThresholdModal = ({ threshold, onSave, onClose }) => {
  const [newThreshold, setNewThreshold] = useState(threshold);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-blue-800" />
            <h2 className="text-base font-bold text-gray-900">
              Eligibility Threshold
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition"
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-5">
          Members scoring at or above this percentage are marked eligible.
        </p>

        <div className="mb-5">
          <div className="relative mb-4">
            <input
              type="number"
              min="0"
              max="100"
              value={newThreshold}
              onChange={(e) =>
                setNewThreshold(
                  Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                )
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 text-4xl font-bold text-center text-gray-900"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-300">
              %
            </span>
          </div>

          <div className="h-2.5 bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 rounded-full relative">
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-4 border-blue-800 rounded-full shadow-md"
              style={{ left: `${newThreshold}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-gray-400">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(newThreshold)}
            className="flex-1 px-4 py-2.5 bg-blue-800 text-white rounded-xl text-sm font-medium hover:bg-blue-900 transition"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberScoresPage;
