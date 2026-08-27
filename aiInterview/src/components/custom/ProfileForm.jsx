// src/components/custom/ProfileForm.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  User, Briefcase, Globe, Award, Plus, Trash2, X,
  Upload, FileText, CheckCircle, AlertCircle, GraduationCap,
  Download, ChevronRight, Loader2, Github, Linkedin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ── Small reusable components ── */
const SectionCard = ({ icon: Icon, iconColor = "text-blue-700", iconBg = "bg-blue-50", title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
    <div className="flex items-center gap-2 mb-4">
      <div className={`p-1.5 rounded-lg ${iconBg}`}>
        <Icon size={15} className={iconColor} />
      </div>
      <span className="text-sm font-semibold text-gray-800">{title}</span>
    </div>
    {children}
  </div>
);

const inputCls = "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white placeholder-gray-400";
const labelCls = "block text-xs font-medium text-gray-500 mb-1";

/* ── Resume template generator (print to PDF) ── */
function generateResumeTemplate(data) {
  const skills = (data.skills || []).join(" · ");
  const expHtml = (data.experience || [])
    .map((e) => `
      <div style="margin-bottom:10px;">
        <div style="font-weight:600;font-size:13px;">${e.title || ""} — ${e.company || ""}</div>
        <div style="font-size:11px;color:#666;">${e.year || ""}</div>
        <div style="font-size:12px;margin-top:3px;">${e.description || ""}</div>
      </div>`)
    .join("");

  const edu = [];
  if (data.college) edu.push(`<div style="font-weight:600;font-size:13px;">${data.college} ${data.graduationYear ? `(${data.graduationYear})` : ""}</div>`);
  if (data.marks12th) edu.push(`<div style="font-size:12px;">12th — ${data.marks12th}%${data.board12th ? ` (${data.board12th})` : ""}</div>`);
  if (data.marks10th) edu.push(`<div style="font-size:12px;">10th — ${data.marks10th}%${data.board10th ? ` (${data.board10th})` : ""}</div>`);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${data.fullName || "Resume"}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', sans-serif; color: #1a1a1a; background: #fff; padding: 40px; font-size: 13px; line-height: 1.55; }
  h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
  h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #1d4ed8; border-bottom: 1.5px solid #bfdbfe; padding-bottom: 4px; margin-bottom: 10px; margin-top: 20px; }
  .contact { font-size: 12px; color: #555; display: flex; gap: 14px; flex-wrap: wrap; margin: 6px 0 4px; }
  .tag { display: inline-block; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; border-radius: 999px; padding: 2px 10px; font-size: 11px; margin: 2px 2px; }
  @media print { body { padding: 24px; } }
</style>
</head>
<body>
  <h1>${data.fullName || "Your Name"}</h1>
  <div style="font-size:13px;color:#1d4ed8;font-weight:500;margin-top:2px;">${data.role || "Professional Title"}</div>
  <div class="contact">
    ${data.phone ? `<span>📞 ${data.phone}</span>` : ""}
    ${data.email ? `<span>✉ ${data.email}</span>` : ""}
    ${data.location ? `<span>📍 ${data.location}</span>` : ""}
    ${data.socials?.linkedin ? `<span>LinkedIn: ${data.socials.linkedin}</span>` : ""}
    ${data.socials?.github ? `<span>GitHub: ${data.socials.github}</span>` : ""}
    ${data.socials?.portfolio ? `<span>Portfolio: ${data.socials.portfolio}</span>` : ""}
  </div>

  ${data.bio ? `<h2>Profile</h2><p style="font-size:12px;color:#333;">${data.bio}</p>` : ""}

  ${edu.length ? `<h2>Education</h2>${edu.join("")}` : ""}

  ${skills ? `<h2>Skills</h2><div>${(data.skills || []).map(s => `<span class="tag">${s}</span>`).join("")}</div>` : ""}

  ${(data.experience || []).length ? `<h2>Experience</h2>${expHtml}` : ""}
</body>
</html>`;

  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) { alert("Pop-up blocked. Allow pop-ups and try again."); return; }
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 400);
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
const ProfileForm = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: "", email: "", phone: "", location: "",
    role: "", bio: "",
    skills: [], skillInput: "",
    experience: [],
    socials: { github: "", linkedin: "", portfolio: "" },
    // Education
    college: "", graduationYear: "",
    marks10th: "", board10th: "",
    marks12th: "", board12th: "",
  });

  const [loading, setLoading]             = useState(true);
  const [autoFillMsg, setAutoFillMsg]     = useState("");
  const [autoFillOk, setAutoFillOk]       = useState(false);
  const [resumeFile, setResumeFile]       = useState(null);
  const [uploading, setUploading]         = useState(false);
  const [saving, setSaving]               = useState(false);
  const [isDragging, setIsDragging]       = useState(false);
  const [isLoggedIn, setIsLoggedIn]       = useState(false);

  /* ── Init: load existing profile ── */
  useEffect(() => {
    const init = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const token      = localStorage.getItem("token");
        if (token) setIsLoggedIn(true);
        if (!storedUser) { setLoading(false); return; }

        const user  = JSON.parse(storedUser);
        const email = user.email || "";

        setFormData((prev) => ({
          ...prev,
          fullName: user.fullName || user.name || "",
          email,
        }));

        if (!email || !token) { setLoading(false); return; }

        try {
          const res = await axios.get(
            `http://localhost:8000/api/profile/${encodeURIComponent(email)}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (res.data?.success && res.data.profile) {
            const p = res.data.profile;
            setFormData((prev) => ({
              ...prev,
              fullName:       p.fullName      || prev.fullName,
              email:          p.email         || prev.email,
              phone:          p.phone         || "",
              location:       p.location      || "",
              role:           p.role          || "",
              bio:            p.bio           || "",
              skills:         Array.isArray(p.skills) ? p.skills : [],
              experience:     Array.isArray(p.experience) ? p.experience : [],
              socials: {
                github:    p.socials?.github    || "",
                linkedin:  p.socials?.linkedin  || "",
                portfolio: p.socials?.portfolio || "",
              },
              college:        p.college        || "",
              graduationYear: p.graduationYear || "",
              marks10th:      p.marks10th      ?? "",
              board10th:      p.board10th      || "",
              marks12th:      p.marks12th      ?? "",
              board12th:      p.board12th      || "",
            }));
          }
        } catch (err) { console.warn("Profile fetch failed:", err); }
      } finally { setLoading(false); }
    };
    init();
  }, []);

  /* ── Helpers ── */
  const set = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const addSkill = () => {
    const val = formData.skillInput?.trim();
    if (!val || formData.skills.includes(val)) { set("skillInput", ""); return; }
    setFormData((prev) => ({ ...prev, skills: [...prev.skills, val], skillInput: "" }));
  };

  const removeSkill = (s) => setFormData((prev) => ({ ...prev, skills: prev.skills.filter((x) => x !== s) }));

  const addExp = () =>
    setFormData((prev) => ({
      ...prev,
      experience: [...prev.experience, { company: "", title: "", year: "", description: "" }],
    }));

  const updateExp = (i, field, value) => {
    const updated = [...formData.experience];
    updated[i][field] = value;
    setFormData((prev) => ({ ...prev, experience: updated }));
  };

  const removeExp = (i) =>
    setFormData((prev) => ({ ...prev, experience: prev.experience.filter((_, idx) => idx !== i) }));

  /* ── Resume upload & AI auto-fill ── */
  const handleUploadAndAutofill = async () => {
    if (!resumeFile) { alert("Select a resume file first."); return; }
    if (!isLoggedIn) { alert("Please log in to use AI resume parsing."); navigate("/home/login"); return; }

    const token = localStorage.getItem("token");
    try {
      setUploading(true);
      setAutoFillMsg("");
      setAutoFillOk(false);

      const form = new FormData();
      form.append("resume", resumeFile);

      const res = await axios.post(
        "http://localhost:8000/api/profile/parse-resume",
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.data?.success) {
        setAutoFillMsg(res.data?.error || "Parse failed. Fill manually.");
        return;
      }

      const p = res.data.profile;
      setFormData((prev) => ({
        ...prev,
        fullName:       p.fullName       || prev.fullName,
        phone:          p.phone          || prev.phone,
        location:       p.location       || prev.location,
        role:           p.role           || prev.role,
        bio:            p.bio            || prev.bio,
        skills:         p.skills?.length ? p.skills : prev.skills,
        experience:     p.experience?.length ? p.experience : prev.experience,
        socials: {
          github:    p.socials?.github    || prev.socials.github,
          linkedin:  p.socials?.linkedin  || prev.socials.linkedin,
          portfolio: p.socials?.portfolio || prev.socials.portfolio,
        },
        college:        p.college        || prev.college,
        graduationYear: p.graduationYear || prev.graduationYear,
        marks10th:      p.marks10th      ?? prev.marks10th,
        board10th:      p.board10th      || prev.board10th,
        marks12th:      p.marks12th      ?? prev.marks12th,
        board12th:      p.board12th      || prev.board12th,
      }));

      const remaining = res.data.remainingCredits ?? "?";
      setAutoFillOk(true);
      setAutoFillMsg(`Profile filled from resume! (${remaining} credits remaining)`);
    } catch (err) {
      console.error("Resume autofill error:", err);
      const msg = err.response?.data?.error || err.response?.data?.msg || err.message;
      setAutoFillMsg(msg || "Upload failed.");
      setAutoFillOk(false);
    } finally {
      setUploading(false);
    }
  };

  /* ── Save profile ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      setSaving(true);
      await axios.post("http://localhost:8000/api/profile/save", formData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      navigate("/profile");
    } catch (err) {
      alert("Failed to save profile. Try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ── File drop handlers ── */
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setResumeFile(f);
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={28} className="animate-spin text-blue-700" />
          <span className="text-sm text-gray-400">Loading profile...</span>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-700 flex items-center justify-center">
              <User size={15} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">Create Interview Profile</h1>
              <p className="text-xs text-gray-400 hidden sm:block">Upload resume → AI fills your details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => generateResumeTemplate(formData)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              <Download size={13} /> Template
            </button>
            <button onClick={() => navigate("/")} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
              <X size={16} className="text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Steps indicator ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-1">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {["Upload Resume", "Review & Edit", "Save Profile"].map((step, i) => (
            <React.Fragment key={step}>
              <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full border ${
                i === 0 ? "border-blue-200 bg-blue-50 text-blue-700 font-semibold" :
                i === 1 ? "border-violet-200 bg-violet-50 text-violet-700" :
                "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}>
                <span className="font-bold">{i + 1}.</span> {step}
              </span>
              {i < 2 && <ChevronRight size={12} className="text-gray-300" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Main form ── */}
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 sm:px-6 py-4 space-y-4 pb-20">

        {/* 1. Resume Upload */}
        <SectionCard icon={Upload} iconColor="text-blue-700" iconBg="bg-blue-50" title="Resume Upload (AI Auto-Fill)">
          {/* Not logged in warning */}
          {!isLoggedIn && (
            <div className="mb-3 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
              <AlertCircle size={14} />
              <span>AI parsing requires login. <button type="button" onClick={() => navigate("/home/login")} className="underline font-semibold">Log in</button> for auto-fill (costs 4 credits).</span>
            </div>
          )}

          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            className={`relative flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
              isDragging
                ? "border-blue-400 bg-blue-50"
                : resumeFile
                ? "border-emerald-300 bg-emerald-50"
                : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/40"
            }`}
          >
            {resumeFile ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle size={28} className="text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700">{resumeFile.name}</span>
                <span className="text-xs text-gray-400">{(resumeFile.size / 1024).toFixed(1)} KB — Click to change</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <FileText size={28} className="text-gray-300" />
                <span className="text-sm font-medium text-gray-600">Drop PDF / DOCX here or click to browse</span>
                <span className="text-xs text-gray-400">AI will extract all your details automatically · Costs 4 credits</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setResumeFile(f); }}
            />
          </div>

          {/* Auto-fill status */}
          {autoFillMsg && (
            <div className={`mt-2 flex items-start gap-2 p-3 rounded-xl text-xs ${
              autoFillOk ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                         : "bg-red-50 border border-red-200 text-red-600"
            }`}>
              {autoFillOk ? <CheckCircle size={14} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />}
              {autoFillMsg}
            </div>
          )}

          <button
            type="button"
            onClick={handleUploadAndAutofill}
            disabled={!resumeFile || uploading}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition"
          >
            {uploading ? <><Loader2 size={15} className="animate-spin" /> Analysing resume...</> : <><Upload size={15} /> Analyse & Auto-Fill (4 credits)</>}
          </button>
        </SectionCard>

        {/* 2. Personal Info */}
        <SectionCard icon={User} iconColor="text-violet-700" iconBg="bg-violet-50" title="Personal Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Full Name *</label>
              <input className={inputCls} required value={formData.fullName}
                onChange={(e) => set("fullName", e.target.value)} placeholder="Arjun S Nair" />
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input className={inputCls} type="email" required value={formData.email}
                onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input className={inputCls} value={formData.phone}
                onChange={(e) => set("phone", e.target.value)} placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className={labelCls}>Location</label>
              <input className={inputCls} value={formData.location}
                onChange={(e) => set("location", e.target.value)} placeholder="Kochi, India" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Desired Role / Title</label>
              <input className={inputCls} value={formData.role}
                onChange={(e) => set("role", e.target.value)} placeholder="Software Engineer, Full Stack Developer..." />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Professional Summary</label>
              <textarea className={inputCls} rows={3} value={formData.bio}
                onChange={(e) => set("bio", e.target.value)}
                placeholder="Brief summary of your background and goals..." />
            </div>
          </div>
        </SectionCard>

        {/* 3. Education */}
        <SectionCard icon={GraduationCap} iconColor="text-indigo-700" iconBg="bg-indigo-50" title="Education">
          <div className="space-y-4">
            {/* College */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className={labelCls}>College / University</label>
                <input className={inputCls} value={formData.college}
                  onChange={(e) => set("college", e.target.value)}
                  placeholder="College of Engineering, Thiruvananthapuram" />
              </div>
              <div>
                <label className={labelCls}>Graduation Year</label>
                <input className={inputCls} value={formData.graduationYear}
                  onChange={(e) => set("graduationYear", e.target.value)}
                  placeholder="2026 or 2022–2026" />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">12th / HSC</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Marks / Percentage</label>
                  <input className={inputCls} type="number" min="0" max="100" step="0.01"
                    value={formData.marks12th}
                    onChange={(e) => set("marks12th", e.target.value)}
                    placeholder="e.g. 92.5" />
                </div>
                <div>
                  <label className={labelCls}>Board</label>
                  <input className={inputCls} value={formData.board12th}
                    onChange={(e) => set("board12th", e.target.value)}
                    placeholder="CBSE / ICSE / State" />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">10th / SSC</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Marks / Percentage</label>
                  <input className={inputCls} type="number" min="0" max="100" step="0.01"
                    value={formData.marks10th}
                    onChange={(e) => set("marks10th", e.target.value)}
                    placeholder="e.g. 88.0" />
                </div>
                <div>
                  <label className={labelCls}>Board</label>
                  <input className={inputCls} value={formData.board10th}
                    onChange={(e) => set("board10th", e.target.value)}
                    placeholder="CBSE / ICSE / State" />
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* 4. Skills */}
        <SectionCard icon={Award} iconColor="text-amber-700" iconBg="bg-amber-50" title="Skills">
          <div className="flex gap-2 mb-3">
            <input
              className={`${inputCls} flex-1`}
              value={formData.skillInput}
              onChange={(e) => set("skillInput", e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
              placeholder="Type a skill and press Enter or Add"
            />
            <button
              type="button"
              onClick={addSkill}
              className="px-4 py-2 bg-amber-600 text-white text-sm rounded-xl hover:bg-amber-700 flex items-center gap-1.5 font-semibold"
            >
              <Plus size={14} /> Add
            </button>
          </div>
          {formData.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium rounded-full"
                >
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-500">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
          {formData.skills.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">No skills added yet. Add your technical and soft skills.</p>
          )}
        </SectionCard>

        {/* 5. Experience */}
        <SectionCard icon={Briefcase} iconColor="text-emerald-700" iconBg="bg-emerald-50" title="Work Experience">
          <div className="space-y-3 mb-3">
            {formData.experience.map((exp, i) => (
              <div key={i} className="p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-600">Experience #{i + 1}</span>
                  <button type="button" onClick={() => removeExp(i)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Company</label>
                    <input className={inputCls} value={exp.company}
                      onChange={(e) => updateExp(i, "company", e.target.value)} placeholder="Google" />
                  </div>
                  <div>
                    <label className={labelCls}>Title</label>
                    <input className={inputCls} value={exp.title}
                      onChange={(e) => updateExp(i, "title", e.target.value)} placeholder="Software Engineer" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Year / Period</label>
                  <input className={inputCls} value={exp.year}
                    onChange={(e) => updateExp(i, "year", e.target.value)} placeholder="2022–2024" />
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <textarea className={inputCls} rows={2} value={exp.description}
                    onChange={(e) => updateExp(i, "description", e.target.value)}
                    placeholder="Brief description of your role and achievements..." />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addExp}
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-emerald-200 text-emerald-700 text-sm font-semibold rounded-xl hover:bg-emerald-50 transition"
          >
            <Plus size={15} /> Add Experience
          </button>
        </SectionCard>

        {/* 6. Social Links */}
        <SectionCard icon={Globe} iconColor="text-rose-700" iconBg="bg-rose-50" title="Social Links">
          <div className="space-y-3">
            <div>
              <label className={labelCls}>GitHub</label>
              <div className="relative">
                <Github size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className={`${inputCls} pl-9`} value={formData.socials.github}
                  onChange={(e) => setFormData((prev) => ({ ...prev, socials: { ...prev.socials, github: e.target.value } }))}
                  placeholder="https://github.com/username" />
              </div>
            </div>
            <div>
              <label className={labelCls}>LinkedIn</label>
              <div className="relative">
                <Linkedin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className={`${inputCls} pl-9`} value={formData.socials.linkedin}
                  onChange={(e) => setFormData((prev) => ({ ...prev, socials: { ...prev.socials, linkedin: e.target.value } }))}
                  placeholder="https://linkedin.com/in/username" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Portfolio / Website</label>
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className={`${inputCls} pl-9`} value={formData.socials.portfolio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, socials: { ...prev.socials, portfolio: e.target.value } }))}
                  placeholder="https://yourportfolio.com" />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── Action buttons ── */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition"
          >
            {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><CheckCircle size={15} /> Save Profile</>}
          </button>
          <button
            type="button"
            onClick={() => generateResumeTemplate(formData)}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50 transition"
          >
            <Download size={15} /> Download Resume Template
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;
