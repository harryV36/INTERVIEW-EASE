import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  ListChecks, Calendar, Search, ChevronRight,
  CheckCircle2, Clock, X, FileText, ShieldAlert,
} from "lucide-react";

/** Deduplicate by session_id or _id */
const deduplicateInterviews = (list = []) => {
  const seen = new Set();
  return list.filter((item) => {
    const key = item.session_id || item._id || item.id || JSON.stringify(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const InterviewsPage = () => {
  const [interviews, setInterviews] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState(null);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:8000/api/interviews/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success) {
          const normalized = deduplicateInterviews(
            (res.data.interviews || []).map((it) => ({
              ...it,
              role: it.role?.trim() || "Unknown Role",
              id: it.id || it._id,
              createdAt: it.date || it.createdAt,
            }))
          );
          setInterviews(normalized);
        } else {
          setInterviews([]);
        }
      } catch {
        setInterviews([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInterviews();
  }, []);

  const filtered = interviews.filter((item) =>
    item.role.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading interview history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* ── Sticky Header + Search ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-700 rounded-xl flex items-center justify-center">
              <ListChecks size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Interview History</h1>
              <p className="text-xs text-gray-400">
                {interviews.length} session{interviews.length !== 1 ? "s" : ""} recorded
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
          <Search size={15} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by role..."
            className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 transition">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((item) => (
              <InterviewCard
                key={item.id || item.session_id}
                item={item}
                onView={() => fetchDetails(item.id, setSelectedInterview)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ListChecks size={22} className="text-blue-700" />
            </div>
            <p className="text-gray-700 font-semibold mb-1">No interviews found</p>
            <p className="text-gray-400 text-sm">
              {search ? `No results for "${search}"` : "Complete your first mock interview to see results here."}
            </p>
          </div>
        )}
      </div>

      {selectedInterview && (
        <DetailsModal data={selectedInterview} onClose={() => setSelectedInterview(null)} />
      )}
    </div>
  );
};

async function fetchDetails(id, setSelected) {
  if (!id) return;
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get(
      `http://localhost:8000/api/interviews/details/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.data?.success) {
      const raw = res.data.session;
      setSelected({
        ...raw,
        role: raw.role?.trim() || "Unknown Role",
        createdAt: raw.createdAt,
        transcript: raw.transcript || "No transcript available.",
        questions: raw.questions || [],
      });
    }
  } catch (err) {
    console.error("Failed loading details", err);
  }
}

const InterviewCard = ({ item, onView }) => {
  const isCompleted = item.status === "Completed";
  const formattedDate = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Unknown";
  const score = item.score !== undefined && item.score !== null ? Number(item.score) : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition truncate capitalize">
            {item.role}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
            <Calendar size={11} />
            {formattedDate}
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
          isCompleted ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
        }`}>
          {isCompleted ? <CheckCircle2 size={11} /> : <Clock size={11} />}
          {item.status || "Unknown"}
        </span>
      </div>

      {isCompleted && score !== null && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-400">Score</span>
            <span className="text-xs font-semibold text-blue-700">{score.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full">
            <div className="h-1.5 bg-blue-700 rounded-full transition-all duration-500" style={{ width: `${score}%` }} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{score.toFixed(1)}%</p>
        </div>
      )}

      <button
        onClick={onView}
        className="flex items-center gap-1.5 text-blue-700 hover:text-blue-800 transition text-xs font-semibold mt-2"
      >
        View Details <ChevronRight size={13} />
      </button>
    </div>
  );
};

const DetailsModal = ({ data, onClose }) => {
  if (!data) return null;
  const createdAt = data.createdAt ? new Date(data.createdAt).toLocaleString() : "Unknown";
  const score = data.scores?.overallScore ?? data.score;
  const latestPhotoUrl = data.latestPhotoUrl || data.photo;
  const totalViolations = data.totalViolations || data.violations?.length || 0;
  const violationsList = data.violations || [];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-gray-100 relative">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-gray-900">Interview Details</h2>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Role", value: data.role },
              { label: "Date", value: createdAt },
              { label: "Score", value: score != null ? `${Number(score).toFixed(1)}%` : "N/A", highlight: true },
              { label: "Violations", value: `${totalViolations}/5`, warning: totalViolations > 0 },
            ].map(({ label, value, highlight, warning }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                <p className={`text-sm font-semibold ${highlight ? "text-blue-700" : warning ? "text-red-600" : "text-gray-800"}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {latestPhotoUrl && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <FileText size={12} /> Captured Photo
              </p>
              <img src={latestPhotoUrl} alt="Interview" className="w-full max-h-52 object-cover rounded-xl border border-gray-200" />
            </div>
          )}

          {violationsList.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <ShieldAlert size={12} /> Violations ({totalViolations}/5)
              </p>
              <div className="space-y-2">
                {violationsList.map((v, idx) => (
                  <div key={idx} className="bg-red-50 border border-red-100 p-3 rounded-xl">
                    <p className="text-xs text-red-800 font-medium">{v.type || "Violation"}: {v.message || v.description || "No details"}</p>
                    {v.timestamp && <p className="text-xs text-red-400 mt-0.5">{new Date(v.timestamp).toLocaleTimeString()}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Transcript</p>
            <p className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 leading-relaxed border border-gray-100">
              {data.transcript || "No transcript available."}
            </p>
          </div>

          {data.questions?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Questions Asked</p>
              <ul className="space-y-1.5">
                {data.questions.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-blue-700 font-semibold flex-shrink-0">Q{idx + 1}.</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewsPage;
