import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Building2,
  Shield,
  Save,
  Trash2,
  Loader2,
  Settings,
  CreditCard,
  Coins,
  TrendingUp,
  History,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const Toggle = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-700">{label}</span>
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-600 transition-all" />
      <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5 shadow-md" />
    </label>
  </div>
);

const OrgSettings = () => {
  const [organization, setOrganization] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "", website: "", industry: "", size: "" });
  const [settings, setSettings] = useState({ allowMemberInvites: false, requireApprovalForJoin: true, autoScheduleInterviews: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { fetchOrganization(); }, []);

  const fetchOrganization = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:8000/api/organization/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        const org = res.data.organization;
        setOrganization(org);
        setFormData({ name: org.name || "", description: org.description || "", website: org.website || "", industry: org.industry || "", size: org.size || "" });
        setSettings(org.settings || settings);
      }
    } catch (err) {
      console.error("Fetch organization error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      await axios.put("http://localhost:8000/api/organization/update", formData, { headers: { Authorization: `Bearer ${token}` } });
      alert("Organization details updated!");
      fetchOrganization();
    } catch { alert("Failed to update organization"); }
    finally { setSaving(false); }
  };

  const handleSaveSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put("http://localhost:8000/api/organization/update", { settings }, { headers: { Authorization: `Bearer ${token}` } });
      alert("Settings updated!");
    } catch { alert("Failed to update settings"); }
  };

  const inputClass = "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white";

  const credits = organization?.credits;
  const creditBalance = credits?.balance ?? 0;
  const creditHistory = credits?.history ?? [];

  // Credit health colour
  const creditColor = creditBalance >= 10 ? "emerald" : creditBalance >= 4 ? "amber" : "red";
  const colorMap = {
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", bar: "bg-emerald-500" },
    amber:   { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   bar: "bg-amber-500"   },
    red:     { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-700",     bar: "bg-red-500"     },
  };
  const cc = colorMap[creditColor];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={28} className="animate-spin text-slate-600" />
          <span className="text-sm text-gray-400">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex items-center gap-4">
        <Settings size={18} className="text-slate-700" />
        <span className="text-base font-bold text-gray-900">Settings</span>
      </div>

      <div className="p-6 flex-1">
        <div className="max-w-2xl mx-auto">

          {/* ── Section 1: Organization Details ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={16} className="text-blue-700" />
              <span className="text-sm font-semibold text-gray-800">Organization Details</span>
            </div>
            <form onSubmit={handleSaveDetails} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Organization Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Website</label>
                  <input type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Industry</label>
                  <input type="text" value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Company Size</label>
                <select value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} className={inputClass}>
                  <option value="">Select size...</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
              </div>
              <div className="flex">
                <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-800 text-white text-sm rounded-xl hover:bg-blue-900 flex items-center gap-2 disabled:opacity-50">
                  <Save size={15} /> {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>

          {/* ── Section 2: Permissions ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} className="text-indigo-700" />
              <span className="text-sm font-semibold text-gray-800">Permissions &amp; Settings</span>
            </div>
            <div>
              <Toggle label="Allow members to invite others" checked={settings.allowMemberInvites} onChange={() => setSettings({ ...settings, allowMemberInvites: !settings.allowMemberInvites })} />
              <Toggle label="Require admin approval for new members" checked={settings.requireApprovalForJoin} onChange={() => setSettings({ ...settings, requireApprovalForJoin: !settings.requireApprovalForJoin })} />
              <Toggle label="Auto-schedule follow-up interviews" checked={settings.autoScheduleInterviews} onChange={() => setSettings({ ...settings, autoScheduleInterviews: !settings.autoScheduleInterviews })} />
            </div>
            <div className="flex mt-4">
              <button onClick={handleSaveSettings} className="px-5 py-2 bg-indigo-700 text-white text-sm rounded-xl hover:bg-indigo-800 flex items-center gap-2">
                <Save size={15} /> Save Settings
              </button>
            </div>
          </div>

          {/* ── Section 3: Org Credit Pool ── */}
          {organization && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <Coins size={16} className="text-amber-600" />
                <span className="text-sm font-semibold text-gray-800">Organization Credit Pool</span>
                <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                  <Zap size={11} className="text-amber-500" /> Used for member tasks &amp; interviews
                </span>
              </div>

              {/* Balance card */}
              <div className={`rounded-xl border ${cc.border} ${cc.bg} p-4 mb-4`}>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Current Balance</p>
                    <p className={`text-4xl font-extrabold ${cc.text}`}>{creditBalance}</p>
                    <p className="text-xs text-gray-400 mt-0.5">credits remaining</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">≈ {Math.floor(creditBalance / 2)} task schedules</p>
                    <p className="text-xs text-gray-400">≈ {Math.floor(creditBalance / 4)} AI filters</p>
                  </div>
                </div>
                {/* Mini bar */}
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full ${cc.bar} rounded-full transition-all`} style={{ width: `${Math.min(100, (creditBalance / 20) * 100)}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {creditBalance < 4
                    ? "⚠️ Low credits — please top up so members can use AI features"
                    : creditBalance < 10
                    ? "Credits running low. Consider purchasing more."
                    : "Credit balance is healthy."}
                </p>
              </div>

              {/* Credit cost reference */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { label: "Task scheduling (per task)", cost: 1 },
                  { label: "Interview scheduling", cost: 2 },
                  { label: "Candidate AI filter", cost: 4 },
                  { label: "Resume analysis", cost: 2 },
                ].map(({ label, cost }) => (
                  <div key={label} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-600">{label}</span>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">{cost} cr</span>
                  </div>
                ))}
              </div>

              {/* Credit History toggle */}
              {creditHistory.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 mb-2"
                  >
                    <History size={13} />
                    {showHistory ? "Hide" : "Show"} credit history ({creditHistory.length} entries)
                    {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  {showHistory && (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {[...creditHistory].reverse().slice(0, 20).map((h, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                          <div>
                            <p className="text-xs font-medium text-gray-700 capitalize">{h.action?.replace(/_/g, " ") || "AI action"}</p>
                            <p className="text-[10px] text-gray-400">{new Date(h.deductedAt).toLocaleString()}</p>
                          </div>
                          <span className="text-xs font-bold text-red-600">−{h.cost} cr</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-400 mt-3 italic">
                💡 When you assign tasks or schedule interviews for members, credits are deducted from this organization pool — not from member accounts.
              </p>
            </div>
          )}

          {/* ── Section 4: Subscription ── */}
          {organization && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard size={16} className="text-emerald-700" />
                <span className="text-sm font-semibold text-gray-800">Subscription</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border bg-blue-50 border-blue-200">
                  <p className="text-xs text-gray-500 mb-1">Current Plan</p>
                  <p className="text-blue-800 font-bold text-lg capitalize">{organization.subscription?.plan || "Free"}</p>
                </div>
                <div className="p-4 rounded-xl border bg-violet-50 border-violet-200">
                  <p className="text-xs text-gray-500 mb-1">Max Members</p>
                  <p className="text-violet-800 font-bold text-lg">{organization.subscription?.maxMembers || 10}</p>
                </div>
                <div className="p-4 rounded-xl border bg-emerald-50 border-emerald-200">
                  <p className="text-xs text-gray-500 mb-1">Current Members</p>
                  <p className="text-emerald-800 font-bold text-lg">{organization.members?.length || 0}</p>
                </div>
              </div>
              <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-1.5">Free Plan includes:</p>
                <ul className="space-y-1">
                  {["20 free org credits on creation", "Up to 10 members", "Basic member management", "Task assignment", "Invite via email"].map((f) => (
                    <li key={f} className="text-xs text-gray-500 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ── Section 5: Danger Zone ── */}
          <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Trash2 size={16} className="text-red-600" />
              <span className="text-sm font-semibold text-red-700">Danger Zone</span>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h3 className="font-semibold text-red-700 mb-1">Delete Organization</h3>
              <p className="text-sm text-red-600 mb-3">This action cannot be undone. All members, interviews, and data will be permanently deleted.</p>
              <button className="bg-red-600 text-white px-5 py-2 rounded-xl hover:bg-red-700 text-sm">Delete Organization</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrgSettings;
