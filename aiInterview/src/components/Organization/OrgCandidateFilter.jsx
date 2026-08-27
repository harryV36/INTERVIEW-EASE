// Organization/OrgCandidateFilter.jsx
// AI-powered candidate filter: org admin enters natural language criteria →
// AI converts to DB query → only matching members shown.
import React, { useState } from "react";
import axios from "axios";
import {
  Search, Sparkles, Loader2, User, GraduationCap,
  Code, MapPin, AlertCircle, CheckCircle, X, Filter,
} from "lucide-react";

const OrgCandidateFilter = () => {
  const [criteria, setCriteria]     = useState("");
  const [profiles, setProfiles]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [searched, setSearched]     = useState(false);
  const [error, setError]           = useState("");
  const [appliedFilter, setAppliedFilter] = useState(null);
  const [totalFound, setTotalFound] = useState(0);

  const examples = [
    "12th marks above 90",
    "10th marks between 75 and 95",
    "skilled in React and Python",
    "from CBSE board",
    "graduated in 2025",
    "marks12th above 85 and skilled in JavaScript",
  ];

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!criteria.trim()) return;

    const token = localStorage.getItem("token");
    if (!token) { setError("Authentication required."); return; }

    try {
      setLoading(true);
      setError("");
      setProfiles([]);
      setAppliedFilter(null);

      const res = await axios.post(
        "http://localhost:8000/api/organization/filter-candidates",
        { criteria },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setProfiles(res.data.profiles || []);
        setTotalFound(res.data.total || 0);
        setAppliedFilter(res.data.appliedFilter || {});
        setSearched(true);
      } else {
        setError(res.data.msg || "Filter failed.");
      }
    } catch (err) {
      const msg = err.response?.data?.msg || err.response?.data?.error || err.message;
      setError(msg || "Request failed. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setCriteria("");
    setProfiles([]);
    setSearched(false);
    setError("");
    setAppliedFilter(null);
  };

  /* ── Profile card ── */
  const ProfileCard = ({ p }) => {
    const letter   = (p.fullName || "?")[0].toUpperCase();
    const colorMap = { A: "bg-blue-700", B: "bg-violet-700", C: "bg-emerald-700", D: "bg-amber-600", E: "bg-rose-700" };
    const idx      = letter.charCodeAt(0) % 5;
    const colors   = ["bg-blue-700", "bg-violet-700", "bg-emerald-700", "bg-amber-600", "bg-rose-700"];
    const bg       = colors[idx];

    return (
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 hover:shadow-md transition">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
            {letter}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{p.fullName || "Unknown"}</p>
            <p className="text-xs text-gray-500 truncate">{p.email}</p>
            {p.role && <p className="text-xs text-blue-700 mt-0.5">{p.role}</p>}
          </div>
        </div>

        {/* Academic info */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {p.marks12th != null && (
            <div className="flex items-center gap-1.5 p-2 bg-indigo-50 rounded-lg">
              <GraduationCap size={12} className="text-indigo-600 flex-shrink-0" />
              <span className="text-xs text-indigo-700 font-semibold">12th: {p.marks12th}%</span>
            </div>
          )}
          {p.marks10th != null && (
            <div className="flex items-center gap-1.5 p-2 bg-violet-50 rounded-lg">
              <GraduationCap size={12} className="text-violet-600 flex-shrink-0" />
              <span className="text-xs text-violet-700 font-semibold">10th: {p.marks10th}%</span>
            </div>
          )}
          {p.college && (
            <div className="col-span-2 flex items-center gap-1.5 p-2 bg-blue-50 rounded-lg">
              <User size={12} className="text-blue-600 flex-shrink-0" />
              <span className="text-xs text-blue-700 truncate">{p.college}{p.graduationYear ? ` (${p.graduationYear})` : ""}</span>
            </div>
          )}
          {p.location && (
            <div className="flex items-center gap-1.5">
              <MapPin size={11} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-500 truncate">{p.location}</span>
            </div>
          )}
        </div>

        {/* Skills */}
        {p.skills?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {p.skills.slice(0, 5).map((s) => (
              <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full">{s}</span>
            ))}
            {p.skills.length > 5 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-full">+{p.skills.length - 5}</span>
            )}
          </div>
        )}
      </div>
    );
  };

  /* ── Render ── */
  return (
    <div className="min-h-full bg-gray-50 flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex items-center gap-3">
        <Filter size={18} className="text-blue-700" />
        <span className="text-base font-bold text-gray-900">AI Candidate Filter</span>
        <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
          <Sparkles size={12} className="text-amber-500" />
          Powered by AI
        </span>
      </div>

      <div className="p-6 flex-1">
        <div className="max-w-3xl mx-auto">

          {/* Search form */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={15} className="text-amber-500" />
              <span className="text-sm font-semibold text-gray-800">Describe your ideal candidate</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Type a natural language description. AI converts it to a database query and shows only matching members.
            </p>

            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={criteria}
                  onChange={(e) => setCriteria(e.target.value)}
                  placeholder='e.g. "12th marks above 90 and skilled in React"'
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !criteria.trim()}
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center gap-2"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                Filter
              </button>
              {(searched || criteria) && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="px-3 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50"
                >
                  <X size={14} className="text-gray-400" />
                </button>
              )}
            </form>

            {/* Example queries */}
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-1.5">Try these examples:</p>
              <div className="flex flex-wrap gap-1.5">
                {examples.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setCriteria(ex)}
                    className="px-2.5 py-1 text-[11px] border border-dashed border-gray-300 rounded-full text-gray-500 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {/* Results */}
          {searched && !loading && (
            <>
              {/* Summary */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-600" />
                  <span className="text-sm font-semibold text-gray-800">
                    {totalFound} candidate{totalFound !== 1 ? "s" : ""} matched
                  </span>
                  <span className="text-xs text-gray-400">for "{criteria}"</span>
                </div>
                {appliedFilter && Object.keys(appliedFilter).length > 0 && (
                  <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded-lg truncate max-w-[200px]">
                    {JSON.stringify(appliedFilter)}
                  </span>
                )}
              </div>

              {profiles.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Search size={24} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-600">No candidates matched</p>
                  <p className="text-xs text-gray-400 mt-1">Try adjusting your criteria or checking if members have filled their profiles.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {profiles.map((p) => (
                    <ProfileCard key={p._id || p.email} p={p} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Initial state */}
          {!searched && !loading && (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Sparkles size={24} className="text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-gray-700">Enter criteria above to filter candidates</p>
              <p className="text-xs text-gray-400 mt-1">AI converts your plain English into database queries. Costs 4 credits per search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrgCandidateFilter;
