import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, Plus, X } from "lucide-react";
import HeaderBar from "../../components/HeaderBar";

/**
 * Safely get nested value or fallback.
 */
const get = (obj, path, fallback = "") => {
  try {
    const parts = path.split(".");
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return fallback;
      cur = cur[p];
    }
    return cur ?? fallback;
  } catch {
    return fallback;
  }
};

const PdfEditor = () => {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [aiContext, setAiContext] = useState({
    targetRole: "",
    targetCompany: "",
    experienceLevel: "",
  });

  const [formData, setFormData] = useState({
    fullName: "",
    headline: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
    skills: "",
    experience: [
      {
        title: "",
        company: "",
        location: "",
        dateRange: "",
        bullets: "",
      },
    ],
    projects: [
      {
        name: "",
        tech: "",
        link: "",
        description: "",
      },
    ],
    education: [
      {
        school: "",
        degree: "",
        year: "",
        details: "",
      },
    ],
    extras: "",
  });

  /* ------------------------------------------------
   * LOAD DATA FROM LOCALSTORAGE
   * ------------------------------------------------ */
  useEffect(() => {
    try {
      const raw =
        localStorage.getItem("resumeEditorData") ||
        localStorage.getItem("resumeData");
      if (!raw) {
        setError("No resume data found. Go back and upload a resume first.");
        return;
      }

      const data = JSON.parse(raw);

      const mapped = {
        fullName:
          data.name ||
          data.fullName ||
          get(data, "analysis.name") ||
          "",
        headline:
          get(data, "analysis.headline") ||
          get(data, "headline") ||
          "",
        email:
          data.email ||
          get(data, "analysis.email") ||
          "",
        phone:
          data.phone ||
          get(data, "analysis.phone") ||
          "",
        location:
          data.location ||
          get(data, "analysis.location") ||
          "",
        summary:
          get(data, "analysis.summary") ||
          data.text_summary ||
          "",
        skills: Array.isArray(data.skills)
          ? data.skills.join(", ")
          : data.skills || get(data, "analysis.skills", ""),
        experience: Array.isArray(data.experience) && data.experience.length
          ? data.experience.map((exp) => ({
              title: exp.title || exp.role || "",
              company: exp.company || "",
              location: exp.location || "",
              dateRange:
                exp.dateRange ||
                [exp.startDate, exp.endDate].filter(Boolean).join(" - ") ||
                "",
              bullets:
                Array.isArray(exp.bullets)
                  ? exp.bullets.join("\n")
                  : exp.description || "",
            }))
          : [
              {
                title: "",
                company: "",
                location: "",
                dateRange: "",
                bullets: "",
              },
            ],
        projects: Array.isArray(data.projects) && data.projects.length
          ? data.projects.map((p) => ({
              name: p.name || p.title || "",
              tech:
                Array.isArray(p.tech)
                  ? p.tech.join(", ")
                  : p.tech || "",
              link: p.link || "",
              description:
                Array.isArray(p.bullets)
                  ? p.bullets.join("\n")
                  : p.description || "",
            }))
          : [
              {
                name: "",
                tech: "",
                link: "",
                description: "",
              },
            ],
        education: Array.isArray(data.education) && data.education.length
          ? data.education.map((e) => ({
              school: e.school || e.institution || "",
              degree: e.degree || "",
              year: e.year || e.graduationYear || "",
              details:
                Array.isArray(e.details)
                  ? e.details.join("\n")
                  : e.details || "",
            }))
          : [
              {
                school: "",
                degree: "",
                year: "",
                details: "",
              },
            ],
        extras:
          get(data, "analysis.extras") ||
          get(data, "extras") ||
          "",
      };

      setFormData(mapped);
    } catch (err) {
      console.error("Failed to load resumeEditorData:", err);
      setError("Failed to read stored resume data.");
    }
  }, []);

  /* ------------------------------------------------
   * GENERIC HANDLERS
   * ------------------------------------------------ */
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateArrayField = (section, index, key, value) => {
    setFormData((prev) => {
      const arr = [...prev[section]];
      arr[index] = { ...arr[index], [key]: value };
      return { ...prev, [section]: arr };
    });
  };

  const addArrayItem = (section, template) => {
    setFormData((prev) => ({
      ...prev,
      [section]: [...prev[section], template],
    }));
  };

  const removeArrayItem = (section, index) => {
    setFormData((prev) => {
      const arr = [...prev[section]];
      if (arr.length === 1) return prev; // keep at least 1
      arr.splice(index, 1);
      return { ...prev, [section]: arr };
    });
  };

  const appendToField = (field, text) => {
    setFormData((prev) => {
      const current = prev[field] || "";
      const joiner = current.endsWith("\n") || current.length === 0 ? "" : "\n";
      return {
        ...prev,
        [field]: current + joiner + text,
      };
    });
  };

  const appendToExperienceBullets = (index, text) => {
    setFormData((prev) => {
      const arr = [...prev.experience];
      const current = arr[index].bullets || "";
      const joiner = current.endsWith("\n") || current.length === 0 ? "" : "\n";
      arr[index] = {
        ...arr[index],
        bullets: current + joiner + text,
      };
      return { ...prev, experience: arr };
    });
  };

  /* ------------------------------------------------
   * SAVE + BACK
   * ------------------------------------------------ */
  const handleSaveAndBack = () => {
    try {
      setSaving(true);
      localStorage.setItem("resumeEditedData", JSON.stringify(formData));
      // Optionally also overwrite resumeEditorData
      localStorage.setItem("resumeEditorData", JSON.stringify(formData));
      navigate(-1); // back to start page
    } catch (err) {
      console.error("Failed to save edited resume:", err);
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------------------------
   * EXTRA POINT SUGGESTIONS
   * ------------------------------------------------ */
  const summarySuggestions = [
    "Highlight 3–4 core technical skills relevant to the target role.",
    "Mention years of experience and industry/domain focus.",
    "Add 1–2 measurable achievements (e.g., 'Improved load time by 30%').",
  ];

  const experienceSuggestions = [
    "Use action verbs like Led, Implemented, Optimized, Designed.",
    "Quantify impact: revenue, performance, latency, cost savings.",
    "Mention tech stack and tools used in the project.",
  ];

  const projectSuggestions = [
    "Describe the project goal and your specific role.",
    "Explain tech stack and major architectural decisions.",
    "Highlight performance improvements, reliability or user impact.",
  ];

  /* ------------------------------------------------
   * UI
   * ------------------------------------------------ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100">
      <HeaderBar />

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-xs text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back
          </button>

          <button
            onClick={handleSaveAndBack}
            disabled={saving}
            className="px-4 py-2 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save & Back"}
          </button>
        </div>

        {/* Title + AI context row */}
        <div className="bg-white rounded-3xl shadow-md border border-slate-200 p-5 md:p-6 mb-6">
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
            Edit Your Resume Content
          </h1>
          <p className="text-xs text-slate-500 mb-4">
            All sections are prefilled from your uploaded resume. Refine them and
            add extra points quickly.
          </p>

          {/* AI context (role / company / experience) - currently just contextual info for you */}
          <div className="grid gap-3 md:grid-cols-3 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Target Role
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                placeholder="e.g. Frontend Engineer"
                value={aiContext.targetRole}
                onChange={(e) =>
                  setAiContext((prev) => ({
                    ...prev,
                    targetRole: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Target Company
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                placeholder="e.g. Google, TCS, Startup"
                value={aiContext.targetCompany}
                onChange={(e) =>
                  setAiContext((prev) => ({
                    ...prev,
                    targetCompany: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Experience Level
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                placeholder="e.g. 2 years, Fresher"
                value={aiContext.experienceLevel}
                onChange={(e) =>
                  setAiContext((prev) => ({
                    ...prev,
                    experienceLevel: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-2xl flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="ml-auto hover:text-red-900"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Main form grid */}
        <div className="space-y-6">
          {/* BASIC INFO */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              Basic Information
            </h2>
            <div className="grid gap-4 md:grid-cols-2 text-xs">
              <div>
                <label className="block text-[11px] font-medium mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  value={formData.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1">
                  Headline (e.g. React Developer | MERN)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  value={formData.headline}
                  onChange={(e) => updateField("headline", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1">
                  Location
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  value={formData.location}
                  onChange={(e) => updateField("location", e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* SUMMARY */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">
              Professional Summary
            </h2>
            <p className="text-[11px] text-slate-500 mb-2">
              3–5 lines that quickly tell who you are, what you do, and your
              impact.
            </p>
            <textarea
              className="w-full min-h-[120px] text-xs rounded-2xl border border-slate-200 px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              value={formData.summary}
              onChange={(e) => updateField("summary", e.target.value)}
            />

            {/* Extra points chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              {summarySuggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => appendToField("summary", "• " + s)}
                  className="text-[10px] px-2 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200"
                >
                  + {s}
                </button>
              ))}
            </div>
          </section>

          {/* SKILLS */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">
              Skills
            </h2>
            <p className="text-[11px] text-slate-500 mb-2">
              Comma-separated list: React, Node.js, MongoDB, ...
            </p>
            <textarea
              className="w-full min-h-[80px] text-xs rounded-2xl border border-slate-200 px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              value={formData.skills}
              onChange={(e) => updateField("skills", e.target.value)}
            />
          </section>

          {/* EXPERIENCE */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-900">
                Experience
              </h2>
              <button
                type="button"
                onClick={() =>
                  addArrayItem("experience", {
                    title: "",
                    company: "",
                    location: "",
                    dateRange: "",
                    bullets: "",
                  })
                }
                className="inline-flex items-center text-[11px] px-2 py-1 rounded-full border border-slate-200 hover:bg-slate-50"
              >
                <Plus size={12} className="mr-1" />
                Add Experience
              </button>
            </div>

            {formData.experience.map((exp, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl p-3 bg-slate-50/80"
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <p className="text-[11px] text-slate-500">Job #{idx + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeArrayItem("experience", idx)}
                    className="text-[10px] text-slate-400 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid gap-2 md:grid-cols-2 text-xs mb-2">
                  <input
                    type="text"
                    placeholder="Job Title (e.g. Frontend Developer)"
                    className="px-3 py-2 rounded-xl border border-slate-200"
                    value={exp.title}
                    onChange={(e) =>
                      updateArrayField("experience", idx, "title", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    placeholder="Company"
                    className="px-3 py-2 rounded-xl border border-slate-200"
                    value={exp.company}
                    onChange={(e) =>
                      updateArrayField(
                        "experience",
                        idx,
                        "company",
                        e.target.value
                      )
                    }
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    className="px-3 py-2 rounded-xl border border-slate-200"
                    value={exp.location}
                    onChange={(e) =>
                      updateArrayField(
                        "experience",
                        idx,
                        "location",
                        e.target.value
                      )
                    }
                  />
                  <input
                    type="text"
                    placeholder="Date range (e.g. 2022 – Present)"
                    className="px-3 py-2 rounded-xl border border-slate-200"
                    value={exp.dateRange}
                    onChange={(e) =>
                      updateArrayField(
                        "experience",
                        idx,
                        "dateRange",
                        e.target.value
                      )
                    }
                  />
                </div>

                <textarea
                  className="w-full min-h-[90px] text-xs rounded-2xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="Bullet points (one per line)..."
                  value={exp.bullets}
                  onChange={(e) =>
                    updateArrayField(
                      "experience",
                      idx,
                      "bullets",
                      e.target.value
                    )
                  }
                />

                <div className="flex flex-wrap gap-2 mt-2">
                  {experienceSuggestions.map((s, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => appendToExperienceBullets(idx, "• " + s)}
                      className="text-[10px] px-2 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* PROJECTS */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-900">
                Projects
              </h2>
              <button
                type="button"
                onClick={() =>
                  addArrayItem("projects", {
                    name: "",
                    tech: "",
                    link: "",
                    description: "",
                  })
                }
                className="inline-flex items-center text-[11px] px-2 py-1 rounded-full border border-slate-200 hover:bg-slate-50"
              >
                <Plus size={12} className="mr-1" />
                Add Project
              </button>
            </div>

            {formData.projects.map((proj, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl p-3 bg-slate-50/80"
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <p className="text-[11px] text-slate-500">
                    Project #{idx + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeArrayItem("projects", idx)}
                    className="text-[10px] text-slate-400 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid gap-2 md:grid-cols-2 text-xs mb-2">
                  <input
                    type="text"
                    placeholder="Project Name"
                    className="px-3 py-2 rounded-xl border border-slate-200"
                    value={proj.name}
                    onChange={(e) =>
                      updateArrayField("projects", idx, "name", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    placeholder="Tech Stack (React, Node, MongoDB...)"
                    className="px-3 py-2 rounded-xl border border-slate-200"
                    value={proj.tech}
                    onChange={(e) =>
                      updateArrayField("projects", idx, "tech", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    placeholder="Link (GitHub / Live URL)"
                    className="px-3 py-2 rounded-xl border border-slate-200"
                    value={proj.link}
                    onChange={(e) =>
                      updateArrayField("projects", idx, "link", e.target.value)
                    }
                  />
                </div>

                <textarea
                  className="w-full min-h-[90px] text-xs rounded-2xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="Project description and bullet points..."
                  value={proj.description}
                  onChange={(e) =>
                    updateArrayField(
                      "projects",
                      idx,
                      "description",
                      e.target.value
                    )
                  }
                />

                <div className="flex flex-wrap gap-2 mt-2">
                  {projectSuggestions.map((s, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() =>
                        updateArrayField(
                          "projects",
                          idx,
                          "description",
                          (proj.description || "") +
                            ((proj.description || "").endsWith("\n") ||
                            !proj.description
                              ? ""
                              : "\n") +
                            "• " +
                            s
                        )
                      }
                      className="text-[10px] px-2 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* EDUCATION */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-900">
                Education
              </h2>
              <button
                type="button"
                onClick={() =>
                  addArrayItem("education", {
                    school: "",
                    degree: "",
                    year: "",
                    details: "",
                  })
                }
                className="inline-flex items-center text-[11px] px-2 py-1 rounded-full border border-slate-200 hover:bg-slate-50"
              >
                <Plus size={12} className="mr-1" />
                Add Education
              </button>
            </div>

            {formData.education.map((edu, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl p-3 bg-slate-50/80"
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <p className="text-[11px] text-slate-500">
                    Education #{idx + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeArrayItem("education", idx)}
                    className="text-[10px] text-slate-400 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid gap-2 md:grid-cols-2 text-xs mb-2">
                  <input
                    type="text"
                    placeholder="School / University"
                    className="px-3 py-2 rounded-xl border border-slate-200"
                    value={edu.school}
                    onChange={(e) =>
                      updateArrayField("education", idx, "school", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    placeholder="Degree (e.g. B.Tech CSE)"
                    className="px-3 py-2 rounded-xl border border-slate-200"
                    value={edu.degree}
                    onChange={(e) =>
                      updateArrayField("education", idx, "degree", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    placeholder="Year (e.g. 2024)"
                    className="px-3 py-2 rounded-xl border border-slate-200"
                    value={edu.year}
                    onChange={(e) =>
                      updateArrayField("education", idx, "year", e.target.value)
                    }
                  />
                </div>

                <textarea
                  className="w-full min-h-[70px] text-xs rounded-2xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="Extra details (CGPA, coursework, activities)..."
                  value={edu.details}
                  onChange={(e) =>
                    updateArrayField(
                      "education",
                      idx,
                      "details",
                      e.target.value
                    )
                  }
                />
              </div>
            ))}
          </section>

          {/* EXTRAS */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">
              Extra Sections (Certifications, Awards, Volunteer, etc.)
            </h2>
            <textarea
              className="w-full min-h-[100px] text-xs rounded-2xl border border-slate-200 px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              value={formData.extras}
              onChange={(e) => updateField("extras", e.target.value)}
            />
          </section>

          {/* Bottom Save button for mobile */}
          <div className="flex justify-end pt-2 pb-6">
            <button
              onClick={handleSaveAndBack}
              disabled={saving}
              className="px-4 py-2 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save & Back"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfEditor;
