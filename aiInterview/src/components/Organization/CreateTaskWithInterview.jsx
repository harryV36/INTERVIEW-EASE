// // src/components/Organization/CreateTaskWithInterview.jsx
// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { X, Plus, AlertCircle, CheckCircle2, Send } from "lucide-react";

// /* ============================================================
//    CUSTOM MULTI-SELECT DROPDOWN
// ============================================================ */
// const MultiSelect = ({ label, name, options, selectedValues, onChange }) => {
//   const [open, setOpen] = useState(false);

//   const toggleValue = (value) => {
//     if (selectedValues.includes(value)) {
//       onChange(name, selectedValues.filter((v) => v !== value));
//     } else {
//       onChange(name, [...selectedValues, value]);
//     }
//   };

//   return (
//     <div className="relative">
//       <label className="block text-xs font-medium text-slate-700 mb-1">
//         {label}
//       </label>

//       <div
//         className={`input-like cursor-pointer min-h-[48px] flex items-center flex-wrap gap-2 ${
//           open ? "border-indigo-500 border-[2px]" : ""
//         }`}
//         onClick={() => setOpen(!open)}
//       >
//         {selectedValues.length === 0 ? (
//           <span className="text-slate-400 text-sm">Select options…</span>
//         ) : (
//           selectedValues.map((val) => (
//             <span
//               key={val}
//               className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
//             >
//               {val}
//             </span>
//           ))
//         )}
//       </div>

//       {open && (
//         <div
//           className="absolute z-30 mt-2 w-full bg-white shadow-xl border border-slate-300 rounded-xl p-3 animate-dropdown"
//           style={{ borderRight: "2px solid #6366f1" }}
//         >
//           <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto">
//             {options.map((opt) => {
//               const isSelected = selectedValues.includes(opt);
//               return (
//                 <div
//                   key={opt}
//                   onClick={() => toggleValue(opt)}
//                   className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition 
//                     ${
//                       isSelected
//                         ? "bg-indigo-100 text-indigo-700"
//                         : "hover:bg-slate-100"
//                     }
//                   `}
//                 >
//                   <input type="checkbox" readOnly checked={isSelected} />
//                   <span className="text-sm">{opt}</span>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       <style>{`
//         @keyframes dropdownAnim {
//           from { opacity: 0; transform: translateY(-6px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         .animate-dropdown {
//           animation: dropdownAnim 0.18s ease-out;
//         }
//       `}</style>
//     </div>
//   );
// };

// /* ============================================================
//    MAIN COMPONENT
// ============================================================ */
// const CreateTaskWithInterview = ({ showModal, onClose, onSuccess }) => {
//   const [members, setMembers] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   // Task basic info
//   const [taskData, setTaskData] = useState({
//     title: "",
//     description: "",
//     assignedTo: "",
//     dueDate: "",
//     priority: "medium",
//     type: "interview",
//   });

//   // Interview setup configuration
//   const [interviewSetup, setInterviewSetup] = useState({
//     category: "",
//     targetJobRole: "",
//     customJobRole: "",
//     targetCompany: "",
//     customCompany: "",
//     experienceLevel: "",
//     interviewType: [],
//     duration: "",
//     numberOfQuestions: "",
//     difficulty: "Medium",
//     techStack: [],
//     interviewFocus: [],
//     preferredLanguage: "English",
//     feedbackStyle: "Balanced",
//     customNotes: "",
//     autoStartTimer: "", // NEW: Auto-start timer in minutes
//   });

//   const interviewRoundOptions = [
//     "DSA",
//     "System Design",
//     "Aptitude",
//     "Technical Round",
//     "HR Round",
//   ];

//   const categories = ["Coding", "General"];
//   const jobRoles = [
//     "Frontend Engineer",
//     "Backend Engineer",
//     "Full-stack Engineer",
//     "Data Scientist",
//     "ML Engineer",
//     "DevOps / SRE",
//     "Mobile Developer",
//     "QA Engineer",
//     "Security Engineer",
//     "UI/UX Designer",
//     "Engineering Manager",
//     "Other",
//   ];
//   const companies = [
//     "Google",
//     "Amazon",
//     "Meta",
//     "Netflix",
//     "Microsoft",
//     "Infosys",
//     "TCS",
//     "Wipro",
//     "Startup / Small Company",
//     "Other",
//   ];
//   const experienceLevels = [
//     "Student / Fresher",
//     "0–1 years",
//     "1–3 years",
//     "3–5 years",
//     "5–8 years",
//     "8+ years",
//   ];
//   const durations = ["15", "30", "45", "60"];
//   const questionCounts = ["3", "5", "8", "10", "15"];
//   const techStacks = [
//     "React",
//     "Node.js",
//     "Express",
//     "MongoDB",
//     "SQL",
//     "Java",
//     "Python",
//     "C++",
//     "Spring Boot",
//     "Django",
//     "AWS",
//     "Docker",
//     "Kubernetes",
//   ];
//   const focusAreas = [
//     "DSA / Problem Solving",
//     "System Design",
//     "Core CS Subjects",
//     "Language Fundamentals",
//     "Project Deep Dive",
//     "Behavioral / HR",
//   ];
//   const languages = ["English", "Hindi", "English + Hindi Mix"];
//   const feedbackStyles = ["Supportive", "Balanced", "Strict"];

//   useEffect(() => {
//     if (showModal) {
//       fetchMembers();
//     }
//   }, [showModal]);

//   const fetchMembers = async () => {
//     try {
//       const token = localStorage.getItem("token");
//       const res = await axios.get(
//         "http://localhost:8000/api/organization/members/performance",
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setMembers(res.data.members || []);
//     } catch (err) {
//       console.error("Fetch members error:", err);
//       setError("Failed to load members");
//     }
//   };

//   const handleTaskChange = (e) => {
//     const { name, value } = e.target;
//     setTaskData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleInterviewChange = (e) => {
//     const { name, value } = e.target;
//     setInterviewSetup((prev) => ({ ...prev, [name]: value }));
//   };

//   const updateMultiSelect = (name, values) => {
//     setInterviewSetup((prev) => ({ ...prev, [name]: values }));
//   };

//   const handleCategoryChange = (value) => {
//     let updatedRounds = interviewSetup.interviewType;

//     if (value === "General") {
//       updatedRounds = [...interviewRoundOptions];
//     } else if (value === "Coding") {
//       updatedRounds = ["DSA", "System Design", "Technical Round"];
//     }

//     setInterviewSetup((prev) => ({
//       ...prev,
//       category: value,
//       interviewType: updatedRounds,
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setSuccess("");

//     // Validation
//     if (!taskData.assignedTo) {
//       setError("Please select a member to assign");
//       return;
//     }

//     if (!interviewSetup.targetJobRole) {
//       setError("Please select a target job role for the interview");
//       return;
//     }

//     if (taskData.dueDate) {
//       const dueDate = new Date(taskData.dueDate);
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
//       if (dueDate < today) {
//         setError("Due date cannot be in the past");
//         return;
//       }
//     }

//     try {
//       setLoading(true);
//       const token = localStorage.getItem("token");

//       // Prepare interview setup with resolved custom values
//       const finalInterviewSetup = {
//         ...interviewSetup,
//         targetJobRole:
//           interviewSetup.targetJobRole === "Other"
//             ? interviewSetup.customJobRole
//             : interviewSetup.targetJobRole,
//         targetCompany:
//           interviewSetup.targetCompany === "Other"
//             ? interviewSetup.customCompany
//             : interviewSetup.targetCompany,
//         autoStartTimer: interviewSetup.autoStartTimer
//           ? Number(interviewSetup.autoStartTimer)
//           : null,
//       };

//       const payload = {
//         ...taskData,
//         interviewSetup: finalInterviewSetup,
//       };

//       const response = await axios.post(
//         "http://localhost:8000/api/tasks/create",
//         payload,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       if (response.data.success) {
//         setSuccess("Task created successfully! Link: " + response.data.taskLink);
        
//         // Copy link to clipboard
//         if (response.data.taskLink) {
//           navigator.clipboard.writeText(response.data.taskLink);
//         }

//         setTimeout(() => {
//           onSuccess();
//           onClose();
//         }, 2000);
//       }
//     } catch (err) {
//       console.error("Create task error:", err);
//       setError(err.response?.data?.msg || "Failed to create task");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!showModal) return null;

//   const minDate = new Date().toISOString().split("T")[0];

//   return (
//     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
//       <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full p-8 my-8 max-h-[90vh] overflow-y-auto">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-6">
//           <div>
//             <h2 className="text-2xl font-bold">Create Interview Task</h2>
//             <p className="text-sm text-gray-500 mt-1">
//               Configure task details and interview settings
//             </p>
//           </div>
//           <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
//             <X size={24} />
//           </button>
//         </div>

//         {/* Error/Success Messages */}
//         {error && (
//           <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
//             <AlertCircle size={20} />
//             {error}
//           </div>
//         )}

//         {success && (
//           <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
//             <CheckCircle2 size={20} />
//             {success}
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-8">
//           {/* ========== TASK BASIC INFO ========== */}
//           <div className="bg-purple-50 p-6 rounded-2xl border border-purple-200">
//             <h3 className="text-lg font-bold text-purple-900 mb-4">Task Details</h3>

//             <div className="space-y-4">
//               <div>
//                 <label className="block text-xs font-medium text-slate-700 mb-1">
//                   Task Title *
//                 </label>
//                 <input
//                   type="text"
//                   name="title"
//                   required
//                   value={taskData.title}
//                   onChange={handleTaskChange}
//                   className="input-like w-full"
//                   placeholder="e.g., Frontend Engineer Interview - Round 1"
//                 />
//               </div>

//               <div>
//                 <label className="block text-xs font-medium text-slate-700 mb-1">
//                   Description
//                 </label>
//                 <textarea
//                   name="description"
//                   value={taskData.description}
//                   onChange={handleTaskChange}
//                   className="input-like w-full h-20 resize-none"
//                   placeholder="Add instructions or context for the candidate..."
//                 />
//               </div>

//               <div className="grid md:grid-cols-3 gap-4">
//                 <div>
//                   <label className="block text-xs font-medium text-slate-700 mb-1">
//                     Assign To *
//                   </label>
//                   <select
//                     name="assignedTo"
//                     required
//                     value={taskData.assignedTo}
//                     onChange={handleTaskChange}
//                     className="input-like w-full"
//                   >
//                     <option value="">Select member...</option>
//                     {members.map((member) => (
//                       <option key={member.userId} value={member.userId}>
//                         {member.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-xs font-medium text-slate-700 mb-1">
//                     Due Date
//                   </label>
//                   <input
//                     type="date"
//                     name="dueDate"
//                     min={minDate}
//                     value={taskData.dueDate}
//                     onChange={handleTaskChange}
//                     className="input-like w-full"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-xs font-medium text-slate-700 mb-1">
//                     Priority
//                   </label>
//                   <select
//                     name="priority"
//                     value={taskData.priority}
//                     onChange={handleTaskChange}
//                     className="input-like w-full"
//                   >
//                     <option value="low">Low</option>
//                     <option value="medium">Medium</option>
//                     <option value="high">High</option>
//                     <option value="urgent">Urgent</option>
//                   </select>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* ========== INTERVIEW CONFIGURATION ========== */}
//           <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-200">
//             <h3 className="text-lg font-bold text-indigo-900 mb-4">
//               Interview Configuration
//             </h3>

//             <div className="space-y-6">
//               {/* Category */}
//               <div>
//                 <label className="block text-xs font-medium text-slate-700 mb-1">
//                   Category
//                 </label>
//                 <select
//                   className="input-like w-full"
//                   value={interviewSetup.category}
//                   onChange={(e) => handleCategoryChange(e.target.value)}
//                 >
//                   <option value="">Select category…</option>
//                   {categories.map((c) => (
//                     <option key={c}>{c}</option>
//                   ))}
//                 </select>
//                 <p className="text-[11px] text-slate-500 mt-1">
//                   General = All rounds selected automatically
//                 </p>
//               </div>

//               {/* Job Role + Company + Experience */}
//               <div className="grid gap-4 md:grid-cols-3">
//                 <div>
//                   <label className="block text-xs font-medium mb-1">
//                     Target Job Role *
//                   </label>
//                   <select
//                     name="targetJobRole"
//                     value={interviewSetup.targetJobRole}
//                     onChange={handleInterviewChange}
//                     className="input-like w-full"
//                     required
//                   >
//                     <option value="">Select a role...</option>
//                     {jobRoles.map((role) => (
//                       <option key={role}>{role}</option>
//                     ))}
//                   </select>

//                   {interviewSetup.targetJobRole === "Other" && (
//                     <input
//                       type="text"
//                       name="customJobRole"
//                       placeholder="Enter custom role"
//                       className="input-like w-full mt-2"
//                       value={interviewSetup.customJobRole}
//                       onChange={handleInterviewChange}
//                     />
//                   )}
//                 </div>

//                 <div>
//                   <label className="block text-xs font-medium mb-1">
//                     Target Company
//                   </label>
//                   <select
//                     name="targetCompany"
//                     value={interviewSetup.targetCompany}
//                     onChange={handleInterviewChange}
//                     className="input-like w-full"
//                   >
//                     <option value="">Select a company...</option>
//                     {companies.map((c) => (
//                       <option key={c}>{c}</option>
//                     ))}
//                   </select>

//                   {interviewSetup.targetCompany === "Other" && (
//                     <input
//                       type="text"
//                       name="customCompany"
//                       placeholder="Enter company name"
//                       className="input-like w-full mt-2"
//                       value={interviewSetup.customCompany}
//                       onChange={handleInterviewChange}
//                     />
//                   )}
//                 </div>

//                 <div>
//                   <label className="block text-xs font-medium mb-1">
//                     Experience Level
//                   </label>
//                   <select
//                     name="experienceLevel"
//                     value={interviewSetup.experienceLevel}
//                     onChange={handleInterviewChange}
//                     className="input-like w-full"
//                   >
//                     <option value="">Select experience...</option>
//                     {experienceLevels.map((lvl) => (
//                       <option key={lvl}>{lvl}</option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               {/* Interview Rounds */}
//               <MultiSelect
//                 label="Interview Rounds"
//                 name="interviewType"
//                 options={interviewRoundOptions}
//                 selectedValues={interviewSetup.interviewType}
//                 onChange={updateMultiSelect}
//               />

//               {/* Duration + Questions + Auto-start */}
//               <div className="grid gap-4 md:grid-cols-3">
//                 <div>
//                   <label className="block text-xs font-medium mb-1">
//                     Duration (minutes) *
//                   </label>
//                   <select
//                     name="duration"
//                     value={interviewSetup.duration}
//                     onChange={handleInterviewChange}
//                     className="input-like w-full"
//                     required
//                   >
//                     <option value="">Choose duration...</option>
//                     {durations.map((d) => (
//                       <option key={d} value={d}>
//                         {d} minutes
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-xs font-medium mb-1">
//                     Number of Questions *
//                   </label>
//                   <select
//                     name="numberOfQuestions"
//                     value={interviewSetup.numberOfQuestions}
//                     onChange={handleInterviewChange}
//                     className="input-like w-full"
//                     required
//                   >
//                     <option value="">Choose…</option>
//                     {questionCounts.map((q) => (
//                       <option key={q} value={q}>
//                         {q}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-xs font-medium mb-1">
//                     Auto-start Timer (min)
//                   </label>
//                   <input
//                     type="number"
//                     name="autoStartTimer"
//                     min="0"
//                     max="60"
//                     value={interviewSetup.autoStartTimer}
//                     onChange={handleInterviewChange}
//                     className="input-like w-full"
//                     placeholder="Optional"
//                   />
//                   <p className="text-[10px] text-slate-500 mt-1">
//                     Leave empty for manual start
//                   </p>
//                 </div>
//               </div>

//               {/* Difficulty + Language + Feedback */}
//               <div className="grid gap-4 md:grid-cols-3">
//                 <div>
//                   <label className="block text-xs font-medium mb-1">
//                     Difficulty
//                   </label>
//                   <select
//                     name="difficulty"
//                     value={interviewSetup.difficulty}
//                     onChange={handleInterviewChange}
//                     className="input-like w-full"
//                   >
//                     <option>Easy</option>
//                     <option>Medium</option>
//                     <option>Hard</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-xs font-medium mb-1">
//                     Preferred Language
//                   </label>
//                   <select
//                     name="preferredLanguage"
//                     value={interviewSetup.preferredLanguage}
//                     onChange={handleInterviewChange}
//                     className="input-like w-full"
//                   >
//                     {languages.map((lang) => (
//                       <option key={lang}>{lang}</option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-xs font-medium mb-1">
//                     Feedback Style
//                   </label>
//                   <select
//                     name="feedbackStyle"
//                     value={interviewSetup.feedbackStyle}
//                     onChange={handleInterviewChange}
//                     className="input-like w-full"
//                   >
//                     {feedbackStyles.map((style) => (
//                       <option key={style}>{style}</option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               {/* Tech Stack + Focus Areas */}
//               <div className="grid gap-4 md:grid-cols-2">
//                 <MultiSelect
//                   label="Preferred Tech Stack"
//                   name="techStack"
//                   options={techStacks}
//                   selectedValues={interviewSetup.techStack}
//                   onChange={updateMultiSelect}
//                 />

//                 <MultiSelect
//                   label="Interview Focus Areas"
//                   name="interviewFocus"
//                   options={focusAreas}
//                   selectedValues={interviewSetup.interviewFocus}
//                   onChange={updateMultiSelect}
//                 />
//               </div>

//               {/* Custom Notes */}
//               <div>
//                 <label className="block text-xs font-medium mb-1">
//                   Custom Notes for AI
//                 </label>
//                 <textarea
//                   name="customNotes"
//                   value={interviewSetup.customNotes}
//                   onChange={handleInterviewChange}
//                   className="input-like w-full h-20 resize-none"
//                   placeholder="Add any special instructions for the AI interviewer..."
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Submit Buttons */}
//           <div className="flex gap-3 pt-4">
//             <button
//               type="button"
//               onClick={onClose}
//               className="flex-1 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={loading || members.length === 0}
//               className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//             >
//               {loading ? (
//                 <>
//                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//                   Creating...
//                 </>
//               ) : (
//                 <>
//                   <Send size={16} />
//                   Create Task & Generate Link
//                 </>
//               )}
//             </button>
//           </div>
//         </form>
//       </div>

//       <style>{`
//         .input-like {
//           padding: 10px 12px;
//           border-radius: 0.75rem;
//           border: 1px solid #e2e8f0;
//           background: #fff;
//           font-size: 0.9rem;
//           color: #0f172a;
//           outline: none;
//           transition: 0.15s;
//         }
//         .input-like:focus {
//           border-color: #6366f1;
//           box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
//         }
//       `}</style>
//     </div>
//   );
// };

// export default CreateTaskWithInterview;


import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, Plus, AlertCircle, CheckCircle2, Send, Trash2 } from "lucide-react";

const MultiSelect = ({ label, name, options, selectedValues, onChange }) => {
  const [open, setOpen] = useState(false);

  const toggleValue = (value) => {
    if (selectedValues.includes(value)) {
      onChange(name, selectedValues.filter((v) => v !== value));
    } else {
      onChange(name, [...selectedValues, value]);
    }
  };

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-slate-700 mb-1">
        {label}
      </label>

      <div
        className={`input-like cursor-pointer min-h-[48px] flex items-center flex-wrap gap-2 ${
          open ? "border-indigo-500 border-[2px]" : ""
        }`}
        onClick={() => setOpen(!open)}
      >
        {selectedValues.length === 0 ? (
          <span className="text-slate-400 text-sm">Select options…</span>
        ) : (
          selectedValues.map((val) => (
            <span
              key={val}
              className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
            >
              {val}
            </span>
          ))
        )}
      </div>

      {open && (
        <div
          className="absolute z-30 mt-2 w-full bg-white shadow-xl border border-slate-300 rounded-xl p-3 animate-dropdown"
          style={{ borderRight: "2px solid #6366f1" }}
        >
          <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto">
            {options.map((opt) => {
              const isSelected = selectedValues.includes(opt);
              return (
                <div
                  key={opt}
                  onClick={() => toggleValue(opt)}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition 
                    ${
                      isSelected
                        ? "bg-indigo-100 text-indigo-700"
                        : "hover:bg-slate-100"
                    }
                  `}
                >
                  <input type="checkbox" readOnly checked={isSelected} />
                  <span className="text-sm">{opt}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes dropdownAnim {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-dropdown {
          animation: dropdownAnim 0.18s ease-out;
        }
      `}</style>
    </div>
  );
};

const CreateTaskWithInterview = ({ showModal, onClose, onSuccess }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    assignedToIds: [], // Changed to array
    dueDate: "",
    priority: "medium",
    type: "interview",
  });

  const [interviewSetup, setInterviewSetup] = useState({
    category: "",
    targetJobRole: "",
    customJobRole: "",
    targetCompany: "",
    customCompany: "",
    experienceLevel: "",
    interviewType: [],
    duration: "",
    numberOfQuestions: "",
    difficulty: "Medium",
    techStack: [],
    interviewFocus: [],
    preferredLanguage: "English",
    feedbackStyle: "Balanced",
    customNotes: "",
    autoStartTimer: "",
  });

  // Custom fields
  const [customFields, setCustomFields] = useState([]);

  const interviewRoundOptions = [
    "DSA",
    "System Design",
    "Aptitude",
    "Technical Round",
    "HR Round",
  ];

  const categories = ["Coding", "General"];
  const jobRoles = [
    "Frontend Engineer",
    "Backend Engineer",
    "Full-stack Engineer",
    "Data Scientist",
    "ML Engineer",
    "DevOps / SRE",
    "Mobile Developer",
    "QA Engineer",
    "Security Engineer",
    "UI/UX Designer",
    "Engineering Manager",
    "Other",
  ];
  const companies = [
    "Google",
    "Amazon",
    "Meta",
    "Netflix",
    "Microsoft",
    "Infosys",
    "TCS",
    "Wipro",
    "Startup / Small Company",
    "Other",
  ];
  const experienceLevels = [
    "Student / Fresher",
    "0–1 years",
    "1–3 years",
    "3–5 years",
    "5–8 years",
    "8+ years",
  ];
  const durations = ["15", "30", "45", "60"];
  const questionCounts = ["3", "5", "8", "10", "15"];
  const techStacks = [
    "React",
    "Node.js",
    "Express",
    "MongoDB",
    "SQL",
    "Java",
    "Python",
    "C++",
    "Spring Boot",
    "Django",
    "AWS",
    "Docker",
    "Kubernetes",
  ];
  const focusAreas = [
    "DSA / Problem Solving",
    "System Design",
    "Core CS Subjects",
    "Language Fundamentals",
    "Project Deep Dive",
    "Behavioral / HR",
  ];
  const languages = ["English", "Hindi", "English + Hindi Mix"];
  const feedbackStyles = ["Supportive", "Balanced", "Strict"];

  useEffect(() => {
    if (showModal) {
      fetchMembers();
    }
  }, [showModal]);

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:8000/api/organization/members/performance",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMembers(res.data.members || []);
    } catch (err) {
      console.error("Fetch members error:", err);
      setError("Failed to load members");
    }
  };

  const handleTaskChange = (e) => {
    const { name, value } = e.target;
    setTaskData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInterviewChange = (e) => {
    const { name, value } = e.target;
    setInterviewSetup((prev) => ({ ...prev, [name]: value }));
  };

  const updateMultiSelect = (name, values) => {
    setInterviewSetup((prev) => ({ ...prev, [name]: values }));
  };

  const handleCategoryChange = (value) => {
    let updatedRounds = interviewSetup.interviewType;

    if (value === "General") {
      updatedRounds = [...interviewRoundOptions];
    } else if (value === "Coding") {
      updatedRounds = ["DSA", "System Design", "Technical Round"];
    }

    setInterviewSetup((prev) => ({
      ...prev,
      category: value,
      interviewType: updatedRounds,
    }));
  };

  // Member selection
  const toggleMemberSelection = (memberId) => {
    setTaskData((prev) => ({
      ...prev,
      assignedToIds: prev.assignedToIds.includes(memberId)
        ? prev.assignedToIds.filter((id) => id !== memberId)
        : [...prev.assignedToIds, memberId],
    }));
  };

  const selectAllMembers = () => {
    if (taskData.assignedToIds.length === members.length) {
      setTaskData((prev) => ({ ...prev, assignedToIds: [] }));
    } else {
      setTaskData((prev) => ({
        ...prev,
        assignedToIds: members.map((m) => m.userId),
      }));
    }
  };

  // Custom fields
  const addCustomField = () => {
    setCustomFields([
      ...customFields,
      { fieldName: "", fieldValue: "", fieldType: "text", options: [] },
    ]);
  };

  const updateCustomField = (index, field, value) => {
    const updated = [...customFields];
    updated[index][field] = value;
    setCustomFields(updated);
  };

  const removeCustomField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (taskData.assignedToIds.length === 0) {
      setError("Please select at least one member to assign");
      return;
    }

    if (!interviewSetup.targetJobRole) {
      setError("Please select a target job role for the interview");
      return;
    }

    if (taskData.dueDate) {
      const dueDate = new Date(taskData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dueDate < today) {
        setError("Due date cannot be in the past");
        return;
      }
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const finalInterviewSetup = {
        ...interviewSetup,
        targetJobRole:
          interviewSetup.targetJobRole === "Other"
            ? interviewSetup.customJobRole
            : interviewSetup.targetJobRole,
        targetCompany:
          interviewSetup.targetCompany === "Other"
            ? interviewSetup.customCompany
            : interviewSetup.targetCompany,
        autoStartTimer: interviewSetup.autoStartTimer
          ? Number(interviewSetup.autoStartTimer)
          : null,
      };

      // Add custom fields to custom notes for AI
      let enhancedNotes = interviewSetup.customNotes || "";
      if (customFields.length > 0) {
        enhancedNotes += "\n\nAdditional Context:\n";
        customFields.forEach((field) => {
          if (field.fieldName && field.fieldValue) {
            enhancedNotes += `- ${field.fieldName}: ${field.fieldValue}\n`;
          }
        });
        finalInterviewSetup.customNotes = enhancedNotes;
      }

      const payload = {
        ...taskData,
        interviewSetup: finalInterviewSetup,
        customFields: customFields.filter((f) => f.fieldName && f.fieldValue),
      };

      const response = await axios.post(
        "http://localhost:8000/api/tasks/create",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccess(
          `Task created successfully! Assigned to ${response.data.assignedCount} member(s)`
        );

        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error("Create task error:", err);
      setError(err.response?.data?.msg || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  if (!showModal) return null;

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full p-8 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Create Interview Task</h2>
            <p className="text-sm text-gray-500 mt-1">
              Configure task details and assign to multiple members
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
            <CheckCircle2 size={20} />
            {success}
          </div>
        )}

        <div onSubmit={handleSubmit} className="space-y-8">
          {/* Task Details */}
          <div className="bg-purple-50 p-6 rounded-2xl border border-purple-200">
            <h3 className="text-lg font-bold text-purple-900 mb-4">Task Details</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={taskData.title}
                  onChange={handleTaskChange}
                  className="input-like w-full"
                  placeholder="e.g., Frontend Engineer Interview - Round 1"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={taskData.description}
                  onChange={handleTaskChange}
                  className="input-like w-full h-20 resize-none"
                  placeholder="Add instructions or context for the candidate..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    min={minDate}
                    value={taskData.dueDate}
                    onChange={handleTaskChange}
                    className="input-like w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={taskData.priority}
                    onChange={handleTaskChange}
                    className="input-like w-full"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Member Selection */}
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-blue-900">
                Assign to Members ({taskData.assignedToIds.length} selected)
              </h3>
              <button
                type="button"
                onClick={selectAllMembers}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {taskData.assignedToIds.length === members.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
              {members.map((member) => {
                const isSelected = taskData.assignedToIds.includes(member.userId);
                return (
                  <label
                    key={member.userId}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition ${
                      isSelected
                        ? "bg-blue-100 border-blue-500"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleMemberSelection(member.userId)}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {member.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {member.email}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Custom Fields */}
          <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-amber-900">
                Custom Fields (Optional)
              </h3>
              <button
                type="button"
                onClick={addCustomField}
                className="px-3 py-1 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-1 text-sm"
              >
                <Plus size={16} />
                Add Field
              </button>
            </div>

            {customFields.length === 0 ? (
              <p className="text-sm text-amber-700">
                Add custom fields to provide additional context for the interview
              </p>
            ) : (
              <div className="space-y-3">
                {customFields.map((field, index) => (
                  <div
                    key={index}
                    className="flex gap-3 items-start bg-white p-3 rounded-xl border border-amber-200"
                  >
                    <input
                      type="text"
                      placeholder="Field Name"
                      value={field.fieldName}
                      onChange={(e) =>
                        updateCustomField(index, "fieldName", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Field Value"
                      value={field.fieldValue}
                      onChange={(e) =>
                        updateCustomField(index, "fieldValue", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomField(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interview Configuration */}
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-200">
            <h3 className="text-lg font-bold text-indigo-900 mb-4">
              Interview Configuration
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  className="input-like w-full"
                  value={interviewSetup.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  <option value="">Select category…</option>
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Target Job Role *
                  </label>
                  <select
                    name="targetJobRole"
                    value={interviewSetup.targetJobRole}
                    onChange={handleInterviewChange}
                    className="input-like w-full"
                    required
                  >
                    <option value="">Select a role...</option>
                    {jobRoles.map((role) => (
                      <option key={role}>{role}</option>
                    ))}
                  </select>

                  {interviewSetup.targetJobRole === "Other" && (
                    <input
                      type="text"
                      name="customJobRole"
                      placeholder="Enter custom role"
                      className="input-like w-full mt-2"
                      value={interviewSetup.customJobRole}
                      onChange={handleInterviewChange}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    Target Company
                  </label>
                  <select
                    name="targetCompany"
                    value={interviewSetup.targetCompany}
                    onChange={handleInterviewChange}
                    className="input-like w-full"
                  >
                    <option value="">Select a company...</option>
                    {companies.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>

                  {interviewSetup.targetCompany === "Other" && (
                    <input
                      type="text"
                      name="customCompany"
                      placeholder="Enter company name"
                      className="input-like w-full mt-2"
                      value={interviewSetup.customCompany}
                      onChange={handleInterviewChange}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    Experience Level
                  </label>
                  <select
                    name="experienceLevel"
                    value={interviewSetup.experienceLevel}
                    onChange={handleInterviewChange}
                    className="input-like w-full"
                  >
                    <option value="">Select experience...</option>
                    {experienceLevels.map((lvl) => (
                      <option key={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>
              </div>

              <MultiSelect
                label="Interview Rounds"
                name="interviewType"
                options={interviewRoundOptions}
                selectedValues={interviewSetup.interviewType}
                onChange={updateMultiSelect}
              />

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Duration (minutes) *
                  </label>
                  <select
                    name="duration"
                    value={interviewSetup.duration}
                    onChange={handleInterviewChange}
                    className="input-like w-full"
                    required
                  >
                    <option value="">Choose duration...</option>
                    {durations.map((d) => (
                      <option key={d} value={d}>
                        {d} minutes
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    Number of Questions *
                  </label>
                  <select
                    name="numberOfQuestions"
                    value={interviewSetup.numberOfQuestions}
                    onChange={handleInterviewChange}
                    className="input-like w-full"
                    required
                  >
                    <option value="">Choose…</option>
                    {questionCounts.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    Auto-start Timer (min)
                  </label>
                  <input
                    type="number"
                    name="autoStartTimer"
                    min="0"
                    max="60"
                    value={interviewSetup.autoStartTimer}
                    onChange={handleInterviewChange}
                    className="input-like w-full"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Difficulty
                  </label>
                  <select
                    name="difficulty"
                    value={interviewSetup.difficulty}
                    onChange={handleInterviewChange}
                    className="input-like w-full"
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    Preferred Language
                  </label>
                  <select
                    name="preferredLanguage"
                    value={interviewSetup.preferredLanguage}
                    onChange={handleInterviewChange}
                    className="input-like w-full"
                  >
                    {languages.map((lang) => (
                      <option key={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    Feedback Style
                  </label>
                  <select
                    name="feedbackStyle"
                    value={interviewSetup.feedbackStyle}
                    onChange={handleInterviewChange}
                    className="input-like w-full"
                  >
                    {feedbackStyles.map((style) => (
                      <option key={style}>{style}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <MultiSelect
                  label="Preferred Tech Stack"
                  name="techStack"
                  options={techStacks}
                  selectedValues={interviewSetup.techStack}
                  onChange={updateMultiSelect}
                />

                <MultiSelect
                  label="Interview Focus Areas"
                  name="interviewFocus"
                  options={focusAreas}
                  selectedValues={interviewSetup.interviewFocus}
                  onChange={updateMultiSelect}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Custom Notes for AI
                </label>
                <textarea
                  name="customNotes"
                  value={interviewSetup.customNotes}
                  onChange={handleInterviewChange}
                  className="input-like w-full h-20 resize-none"
                  placeholder="Add any special instructions for the AI interviewer..."
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || members.length === 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Create Task & Send to {taskData.assignedToIds.length} Member(s)
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .input-like {
          padding: 10px 12px;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          background: #fff;
          font-size: 0.9rem;
          color: #0f172a;
          outline: none;
          transition: 0.15s;
        }
        .input-like:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
        }
      `}</style>
    </div>
  );
};

export default CreateTaskWithInterview;