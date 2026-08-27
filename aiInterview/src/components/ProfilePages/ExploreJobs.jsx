import React, { useState, useMemo } from "react";
import {
  Search, MapPin, Clock, Bookmark, BookmarkCheck, ArrowRight,
  Building2, Briefcase, DollarSign, ChevronLeft, ChevronRight, X,
} from "lucide-react";

const ALL_JOBS = [
  { id: 1, title: "Frontend Developer", company: "Google", logo: "https://logo.clearbit.com/google.com", location: "Bangalore, India", type: "Full-time", experience: "2+ years", salary: "12–18 LPA", tags: ["React", "TypeScript"] },
  { id: 2, title: "React Engineer", company: "Meta", logo: "https://logo.clearbit.com/meta.com", location: "Remote", type: "Remote", experience: "1–3 years", salary: "10–16 LPA", tags: ["React", "GraphQL"] },
  { id: 3, title: "Node.js Backend Engineer", company: "Amazon", logo: "https://logo.clearbit.com/amazon.com", location: "Hyderabad, India", type: "Hybrid", experience: "3+ years", salary: "14–20 LPA", tags: ["Node.js", "AWS"] },
  { id: 4, title: "Full Stack Developer", company: "Microsoft", logo: "https://logo.clearbit.com/microsoft.com", location: "Pune, India", type: "Full-time", experience: "2–5 years", salary: "15–22 LPA", tags: ["React", "Azure"] },
  { id: 5, title: "ML Engineer", company: "OpenAI", logo: "https://logo.clearbit.com/openai.com", location: "Remote", type: "Remote", experience: "3+ years", salary: "25–40 LPA", tags: ["Python", "PyTorch"] },
  { id: 6, title: "Data Scientist", company: "Stripe", logo: "https://logo.clearbit.com/stripe.com", location: "Mumbai, India", type: "Full-time", experience: "2–4 years", salary: "18–28 LPA", tags: ["Python", "SQL"] },
  { id: 7, title: "DevOps Engineer", company: "Netflix", logo: "https://logo.clearbit.com/netflix.com", location: "Remote", type: "Remote", experience: "3+ years", salary: "20–32 LPA", tags: ["Kubernetes", "Terraform"] },
  { id: 8, title: "iOS Engineer", company: "Apple", logo: "https://logo.clearbit.com/apple.com", location: "Bengaluru, India", type: "Full-time", experience: "2+ years", salary: "20–30 LPA", tags: ["Swift", "Xcode"] },
];

const JOBS_PER_PAGE = 4;

const TYPE_COLORS = {
  "Full-time": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Remote":    "bg-blue-50 text-blue-700 border-blue-200",
  "Hybrid":    "bg-amber-50 text-amber-700 border-amber-200",
};

const ExploreJobs = () => {
  const [search, setSearch] = useState("");
  const [savedJobs, setSavedJobs] = useState([]);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() =>
    ALL_JOBS.filter((j) =>
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase())
    ),
    [search]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / JOBS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * JOBS_PER_PAGE, currentPage * JOBS_PER_PAGE);

  const handleSearch = (val) => { setSearch(val); setPage(1); };
  const toggleSave = (id) =>
    setSavedJobs((prev) => (prev.includes(id) ? prev.filter((j) => j !== id) : [...prev, id]));

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* ── Sticky Header + Search ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm px-6 py-4">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 bg-blue-700 rounded-xl flex items-center justify-center">
            <Briefcase size={15} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Explore Jobs</h1>
            <p className="text-xs text-gray-400">{filtered.length} opportunities found</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
          <Search size={15} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by role or company..."
            className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => handleSearch("")} className="text-gray-400 hover:text-gray-600 transition">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Jobs grid */}
      <div className="flex-1 p-6">
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {paginated.length > 0 ? (
            paginated.map((job) => (
              <JobCard key={job.id} job={job} saved={savedJobs.includes(job.id)} toggleSave={toggleSave} />
            ))
          ) : (
            <div className="col-span-2 text-center py-16 text-gray-400">
              <Briefcase size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No jobs found for "{search}"</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 transition shadow-sm"
            >
              <ChevronLeft size={15} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-9 h-9 flex items-center justify-center rounded-xl border text-sm font-medium transition shadow-sm ${
                  n === currentPage
                    ? "bg-blue-700 border-blue-700 text-white"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {n}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 transition shadow-sm"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const JobCard = ({ job, saved, toggleSave }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-3">
        <img
          src={job.logo}
          alt={job.company}
          className="w-11 h-11 rounded-xl border border-gray-100 bg-white object-contain p-0.5 shadow-sm"
          onError={(e) => { e.target.style.display = "none"; }}
        />
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-blue-700 transition">{job.title}</h3>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Building2 size={11} /> {job.company}
          </p>
        </div>
      </div>
      <button onClick={() => toggleSave(job.id)} className="mt-0.5 flex-shrink-0 text-gray-400 hover:text-blue-700 transition">
        {saved
          ? <BookmarkCheck size={18} className="text-blue-700" />
          : <Bookmark size={18} />
        }
      </button>
    </div>

    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
      <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin size={12} /> {job.location}</span>
      <span className="flex items-center gap-1 text-xs text-gray-500"><Clock size={12} /> {job.experience}</span>
      <span className="flex items-center gap-1 text-xs text-gray-500"><DollarSign size={12} /> {job.salary}</span>
    </div>

    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${TYPE_COLORS[job.type] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
          {job.type}
        </span>
        {job.tags?.map((tag) => (
          <span key={tag} className="px-2 py-0.5 rounded-md text-xs bg-gray-100 text-gray-600">{tag}</span>
        ))}
      </div>
      <button className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 transition group-hover:gap-1.5">
        Apply <ArrowRight size={12} />
      </button>
    </div>
  </div>
);

export default ExploreJobs;
