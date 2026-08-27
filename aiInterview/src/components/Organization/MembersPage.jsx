import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Users, UserPlus, Mail, Trash2, Shield, Search,
  TrendingUp, Upload, Download, X, FileSpreadsheet,
  Loader2, CheckCircle2, XCircle, AlertCircle, Star,
} from "lucide-react";

const API_BASE = "http://localhost:8000";

const MembersPage = () => {
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [bulkEmails, setBulkEmails] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/organization/members/performance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setMembers(res.data.members);
    } catch (err) { console.error("Fetch members error:", err); }
    finally { setLoading(false); }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    try {
      setInviting(true);
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE}/api/organization/invite`, { email: inviteEmail }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Invitation sent successfully!");
      setInviteEmail("");
    } catch (err) { alert(err.response?.data?.msg || "Failed to send invitation"); }
    finally { setInviting(false); }
  };

  const handleBulkInvite = async () => {
    const emails = bulkEmails.split(/[\n,;]/).map((e) => e.trim()).filter((e) => e);
    if (emails.length === 0) { alert("Please enter at least one email address"); return; }
    try {
      setInviting(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE}/api/organization/invite/bulk`, { emails }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBulkResult(res.data);
      setBulkEmails("");
    } catch (err) { alert(err.response?.data?.msg || "Failed to send invitations"); }
    finally { setInviting(false); }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = [];
        text.split("\n").forEach((line) => { const m = line.match(emailRegex); if (m) emails.push(...m); });
        if (emails.length > 0) setBulkEmails(emails.join("\n"));
        else alert("No valid email addresses found in file");
      } catch { alert("Error reading file. Please ensure it's a valid CSV file."); }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const csv = "Email\nuser1@example.com\nuser2@example.com\nuser3@example.com";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "member_invitation_template.csv"; a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Remove this member?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE}/api/organization/member/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Member removed");
      fetchMembers();
      setSelectedMembers([]);
    } catch { alert("Failed to remove member"); }
  };

  const handleBulkRemove = async () => {
    if (selectedMembers.length === 0) { alert("Please select members to remove"); return; }
    if (!window.confirm(`Remove ${selectedMembers.length} selected member(s)?`)) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(`${API_BASE}/api/organization/members/bulk`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { memberIds: selectedMembers },
      });
      alert(`${res.data.results.removed} member(s) removed successfully`);
      fetchMembers();
      setSelectedMembers([]);
    } catch { alert("Failed to remove members"); }
  };

  const toggleMemberSelection = (memberId) =>
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const selectAll = () =>
    setSelectedMembers(selectedMembers.length === filtered.length ? [] : filtered.map((m) => m.userId));

  const activeMembers = members.filter((m) => (m.performance?.totalInterviews || 0) > 0).length;
  const avgScore = members.length > 0
    ? Math.round(members.reduce((sum, m) => sum + (m.performance?.avgScore || 0), 0) / members.length)
    : 0;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-blue-800 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Users size={18} className="text-blue-800 flex-shrink-0" />
          <h1 className="text-base font-bold text-gray-900">Team Members</h1>
          <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full ml-1">{members.length}</span>
        </div>
        <div className="relative w-52 flex-shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Search members..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-gray-50"
          />
        </div>
        {selectedMembers.length > 0 && (
          <button
            onClick={handleBulkRemove}
            className="px-3 py-2 bg-red-600 text-white text-sm rounded-xl hover:bg-red-700 flex items-center gap-1.5 flex-shrink-0"
          >
            <Trash2 size={14} /> Remove {selectedMembers.length}
          </button>
        )}
        <button
          onClick={() => setShowBulkModal(true)}
          className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm rounded-xl flex items-center gap-2 flex-shrink-0"
        >
          <UserPlus size={15} /> Bulk Invite
        </button>
      </div>

      <div className="p-6 flex-1">
        {/* Two-column layout */}
        <div className="grid md:grid-cols-[1fr_340px] gap-5 mb-6">
          {/* Quick invite card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Mail size={15} className="text-indigo-600" /> Invite Member
            </h2>
            <form onSubmit={handleInvite} className="flex gap-3">
              <input
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              />
              <button
                type="submit"
                disabled={inviting || !inviteEmail}
                className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl disabled:opacity-50 text-sm font-medium"
              >
                {inviting ? "Sending..." : "Send Invite"}
              </button>
            </form>
            <p className="text-xs text-gray-400 mt-3">
              💡 Or use Bulk Invite to add multiple members at once
            </p>
          </div>

          {/* Team stats card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Team Overview</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-blue-800 font-bold text-xl">{members.length}</p>
                <p className="text-xs text-gray-500">Total Members</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3">
                <p className="text-emerald-700 font-bold text-xl">{activeMembers}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
              <div className="bg-violet-50 rounded-xl p-3">
                <p className="text-violet-700 font-bold text-xl">{avgScore}%</p>
                <p className="text-xs text-gray-500">Avg Score</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3">
                <p className="text-amber-700 font-bold text-xl">{selectedMembers.length}</p>
                <p className="text-xs text-gray-500">Selected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Members section */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">
            Members <span className="text-gray-400 font-normal">({filtered.length})</span>
          </span>
          {filtered.length > 0 && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedMembers.length === filtered.length && filtered.length > 0}
                onChange={selectAll}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <span className="text-sm text-gray-500">Select all</span>
            </label>
          )}
        </div>

        {filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((member) => (
              <MemberCard
                key={member._id}
                member={member}
                onRemove={handleRemoveMember}
                isSelected={selectedMembers.includes(member.userId)}
                onToggleSelect={toggleMemberSelection}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <Users size={48} className="mx-auto mb-4 text-gray-200" />
            <h2 className="text-sm font-semibold text-gray-500 mb-1">
              {search ? `No results for "${search}"` : "No members yet"}
            </h2>
            <p className="text-xs text-gray-400">Use Quick Invite or Bulk Invite to add team members</p>
          </div>
        )}
      </div>

      {showBulkModal && (
        <BulkInviteModal
          bulkEmails={bulkEmails}
          setBulkEmails={setBulkEmails}
          inviting={inviting}
          onInvite={handleBulkInvite}
          onClose={() => { setShowBulkModal(false); setBulkResult(null); }}
          onFileUpload={handleFileUpload}
          onDownloadTemplate={downloadTemplate}
          result={bulkResult}
        />
      )}
    </div>
  );
};

const getAvatarColor = (name) => {
  const first = (name?.[0] || "A").toUpperCase();
  const code = first.charCodeAt(0);
  if (code >= 65 && code <= 69) return "bg-blue-700";
  if (code >= 70 && code <= 74) return "bg-violet-700";
  if (code >= 75 && code <= 79) return "bg-emerald-700";
  if (code >= 80 && code <= 84) return "bg-amber-600";
  return "bg-rose-700";
};

const MemberCard = ({ member, onRemove, isSelected, onToggleSelect }) => {
  const performance = member.performance || {};
  const initials = member.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  const avatarColor = getAvatarColor(member.name);

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm transition-all ${
      isSelected
        ? "border-indigo-400 bg-indigo-50/20"
        : "border-gray-200 hover:border-gray-300 hover:shadow-md"
    }`}>
      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start gap-3 mb-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(member.userId)}
            className="w-4 h-4 accent-indigo-600 rounded mt-1 flex-shrink-0"
          />
          <div className={`w-12 h-12 rounded-2xl ${avatarColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm truncate">{member.name}</h3>
            <p className="text-xs text-gray-400 truncate">{member.email}</p>
          </div>
          {member.role === "admin" && (
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs flex items-center gap-1 flex-shrink-0">
              <Shield size={10} /> Admin
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 my-3">
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-xs text-gray-400">Interviews</p>
            <p className="font-bold text-gray-800 text-sm">{performance.totalInterviews || 0}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-2.5 text-center">
            <p className="text-xs text-gray-400">Avg Score</p>
            <p className="font-bold text-blue-800 text-sm">{performance.avgScore || 0}%</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
            <p className="text-xs text-gray-400">Best Score</p>
            <p className="font-bold text-emerald-700 text-sm">{performance.bestScore || 0}%</p>
          </div>
        </div>

        {/* Recent scores */}
        {performance.recentScores?.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
              <TrendingUp size={11} /> Recent
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {performance.recentScores.slice(0, 5).map((score, i) => (
                <span key={i} className="rounded text-[10px] px-1.5 py-0.5 bg-gray-100 font-medium text-gray-700">
                  {score.score}%
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Remove button */}
        <button
          onClick={() => onRemove(member.userId)}
          className="w-full py-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl flex items-center justify-center gap-2 text-xs transition"
        >
          <Trash2 size={13} /> Remove Member
        </button>
      </div>
    </div>
  );
};

const BulkInviteModal = ({ bulkEmails, setBulkEmails, inviting, onInvite, onClose, onFileUpload, onDownloadTemplate, result }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
      <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <UserPlus size={18} className="text-blue-800" /> Bulk Invite Members
        </h2>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl transition">
          <X size={18} />
        </button>
      </div>
      <div className="p-5">
        {!result ? (
          <>
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FileSpreadsheet size={14} /> Upload CSV
              </h3>
              <div className="flex gap-2">
                <label className="flex-1 px-4 py-3 border-2 border-dashed border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-blue-800 font-medium text-sm">
                  <Upload size={15} /> Choose File
                  <input type="file" accept=".csv,.txt" onChange={onFileUpload} className="hidden" />
                </label>
                <button onClick={onDownloadTemplate} className="px-3 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 flex items-center gap-1.5 text-sm">
                  <Download size={15} /> Template
                </button>
              </div>
            </div>
            <div className="mb-4 text-center text-gray-400 text-sm">— OR —</div>
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Enter Emails (one per line)</h3>
              <textarea
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                placeholder={"user1@example.com\nuser2@example.com"}
                className="w-full h-40 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 font-mono text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                {bulkEmails.split(/[\n,;]/).filter((e) => e.trim()).length} emails entered
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 text-sm font-medium">
                Cancel
              </button>
              <button
                onClick={onInvite}
                disabled={inviting || !bulkEmails.trim()}
                className="flex-1 px-4 py-2.5 bg-blue-800 text-white rounded-xl hover:bg-blue-900 disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
              >
                {inviting ? <><Loader2 size={15} className="animate-spin" /> Sending...</> : <><Mail size={15} /> Send Invitations</>}
              </button>
            </div>
          </>
        ) : (
          <BulkInviteResults result={result} onClose={onClose} />
        )}
      </div>
    </div>
  </div>
);

const BulkInviteResults = ({ result, onClose }) => {
  const { results, details } = result;
  return (
    <div>
      <h3 className="text-sm font-bold text-gray-900 mb-4">Invitation Results</h3>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { icon: <CheckCircle2 size={16} className="text-green-600" />, label: "Success", value: results.successful, bg: "bg-green-50 border-green-200 text-green-900" },
          { icon: <XCircle size={16} className="text-red-600" />, label: "Failed", value: results.failed, bg: "bg-red-50 border-red-200 text-red-900" },
          { icon: <AlertCircle size={16} className="text-yellow-600" />, label: "Already Member", value: results.alreadyMember, bg: "bg-yellow-50 border-yellow-200 text-yellow-900" },
          { icon: <Mail size={16} className="text-blue-600" />, label: "Already Invited", value: results.alreadyInvited, bg: "bg-blue-50 border-blue-200 text-blue-900" },
        ].map(({ icon, label, value, bg }) => (
          <div key={label} className={`p-4 rounded-xl border ${bg}`}>
            <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-xs font-semibold">{label}</span></div>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>
      {details?.failed?.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-bold text-red-800 mb-1.5">Failed:</h4>
          <div className="max-h-32 overflow-y-auto bg-red-50 rounded-xl p-3 space-y-1">
            {details.failed.map((item, i) => (
              <p key={i} className="text-xs text-red-700">{item.email} — {item.reason}</p>
            ))}
          </div>
        </div>
      )}
      <button onClick={onClose} className="w-full px-4 py-2.5 bg-blue-800 text-white rounded-xl hover:bg-blue-900 text-sm font-medium">
        Close
      </button>
    </div>
  );
};

export default MembersPage;
