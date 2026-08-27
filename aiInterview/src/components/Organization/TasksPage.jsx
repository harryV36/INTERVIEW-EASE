
// import React, { useEffect, useState } from "react";
// import axios from "axios";

// import {
//   CheckSquare,
//   Plus,
//   Clock,
//   AlertCircle,
//   CheckCircle2,
//   Trash2,
//   MessageSquare,
//   Filter,
//   X,
//   Send,
//   Copy,
//   ExternalLink,
// } from "lucide-react";
// import CreateTaskWithInterview from "./CreateTaskWithInterview";

// const TasksPage = () => {
//   const [tasks, setTasks] = useState([]);
//   const [showModal, setShowModal] = useState(false);
//   const [filterStatus, setFilterStatus] = useState("all");
//   const [filterPriority, setFilterPriority] = useState("all");
//   const [selectedTask, setSelectedTask] = useState(null);
//   const [comment, setComment] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const fetchTasks = async () => {
//     try {
//       setLoading(true);
//       setError("");
//       const token = localStorage.getItem("token");

//       if (!token) {
//         setError("No authentication token found");
//         return;
//       }

//       const params = new URLSearchParams();
//       if (filterStatus !== "all") params.append("status", filterStatus);
//       if (filterPriority !== "all") params.append("priority", filterPriority);

//       const tasksRes = await axios.get(
//         `http://localhost:8000/api/tasks/all?${params.toString()}`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setTasks(tasksRes.data.tasks || []);
//     } catch (err) {
//       console.error("Fetch error:", err);
//       setError(err.response?.data?.msg || "Failed to load tasks");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchTasks();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [filterStatus, filterPriority]);

//   const handleUpdateStatus = async (taskId, newStatus) => {
//     try {
//       const token = localStorage.getItem("token");
//       const response = await axios.put(
//         `http://localhost:8000/api/tasks/${taskId}`,
//         { status: newStatus },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       if (response.data.success) {
//         fetchTasks();
//       }
//     } catch (err) {
//       console.error("Update status error:", err);
//       alert(err.response?.data?.msg || "Failed to update task");
//     }
//   };

//   const handleDeleteTask = async (taskId) => {
//     if (!window.confirm("Are you sure you want to delete this task?")) {
//       return;
//     }

//     try {
//       const token = localStorage.getItem("token");
//       const response = await axios.delete(
//         `http://localhost:8000/api/tasks/${taskId}`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       if (response.data.success) {
//         alert("✅ Task deleted successfully");
//         fetchTasks();
//       }
//     } catch (err) {
//       console.error("Delete task error:", err);
//       alert(err.response?.data?.msg || "Failed to delete task");
//     }
//   };

//   const handleAddComment = async () => {
//     if (!comment.trim() || !selectedTask) return;

//     try {
//       const token = localStorage.getItem("token");
//       const response = await axios.post(
//         `http://localhost:8000/api/tasks/${selectedTask._id}/comment`,
//         { text: comment },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       if (response.data.success) {
//         setComment("");
//         setSelectedTask(response.data.task);
//         fetchTasks();
//         alert("✅ Comment added");
//       }
//     } catch (err) {
//       console.error("Add comment error:", err);
//       alert(err.response?.data?.msg || "Failed to add comment");
//     }
//   };

//   const copyTaskLink = (link) => {
//     navigator.clipboard.writeText(link);
//     alert("✅ Task link copied to clipboard!");
//   };

//   const getPriorityColor = (priority) => {
//     const colors = {
//       low: "bg-blue-100 text-blue-700 border-blue-200",
//       medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
//       high: "bg-orange-100 text-orange-700 border-orange-200",
//       urgent: "bg-red-100 text-red-700 border-red-200",
//     };
//     return colors[priority] || colors.medium;
//   };

//   const getStatusIcon = (status) => {
//     const icons = {
//       pending: <Clock className="text-yellow-600" size={16} />,
//       "in-progress": <AlertCircle className="text-blue-600" size={16} />,
//       completed: <CheckCircle2 className="text-green-600" size={16} />,
//       cancelled: <Trash2 className="text-red-600" size={16} />,
//     };
//     return icons[status] || icons.pending;
//   };

//   const getTaskStats = () => {
//     return {
//       total: tasks.length,
//       pending: tasks.filter((t) => t.status === "pending").length,
//       inProgress: tasks.filter((t) => t.status === "in-progress").length,
//       completed: tasks.filter((t) => t.status === "completed").length,
//       overdue: tasks.filter((t) => {
//         if (!t.dueDate || t.status === "completed") return false;
//         return new Date(t.dueDate) < new Date();
//       }).length,
//     };
//   };

//   const stats = getTaskStats();

//   if (loading) {
//     return (
//       <div className="h-screen flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading tasks...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-10 bg-gray-50 min-h-screen">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-8">
//         <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
//           <CheckSquare size={28} className="text-purple-600" />
//           Task Management
//         </h1>

//         <button
//           onClick={() => {
//             setShowModal(true);
//             setError("");
//           }}
//           className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center gap-2 shadow-lg"
//         >
//           <Plus size={20} />
//           Create Interview Task
//         </button>
//       </div>

//       {/* Error Display */}
//       {error && (
//         <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
//           <AlertCircle size={20} />
//           {error}
//         </div>
//       )}

//       {/* Stats */}
//       <div className="grid md:grid-cols-5 gap-6 mb-8">
//         <StatCard title="Total Tasks" value={stats.total} color="purple" />
//         <StatCard title="Pending" value={stats.pending} color="yellow" />
//         <StatCard title="In Progress" value={stats.inProgress} color="blue" />
//         <StatCard title="Completed" value={stats.completed} color="green" />
//         <StatCard title="Overdue" value={stats.overdue} color="red" />
//       </div>

//       {/* Filters */}
//       <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex items-center gap-4 flex-wrap">
//         <Filter size={18} className="text-gray-500" />

//         <div className="flex items-center gap-2">
//           <label className="text-sm font-medium text-gray-700">Status:</label>
//           <select
//             value={filterStatus}
//             onChange={(e) => setFilterStatus(e.target.value)}
//             className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-300 text-sm"
//           >
//             <option value="all">All</option>
//             <option value="pending">Pending</option>
//             <option value="in-progress">In Progress</option>
//             <option value="completed">Completed</option>
//             <option value="cancelled">Cancelled</option>
//           </select>
//         </div>

//         <div className="flex items-center gap-2">
//           <label className="text-sm font-medium text-gray-700">Priority:</label>
//           <select
//             value={filterPriority}
//             onChange={(e) => setFilterPriority(e.target.value)}
//             className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-300 text-sm"
//           >
//             <option value="all">All</option>
//             <option value="low">Low</option>
//             <option value="medium">Medium</option>
//             <option value="high">High</option>
//             <option value="urgent">Urgent</option>
//           </select>
//         </div>

//         {(filterStatus !== "all" || filterPriority !== "all") && (
//           <button
//             onClick={() => {
//               setFilterStatus("all");
//               setFilterPriority("all");
//             }}
//             className="px-3 py-1 text-sm text-blue-800 hover:text-blue-900 font-medium"
//           >
//             Clear Filters
//           </button>
//         )}
//       </div>

//       {/* Tasks Grid */}
//       {tasks.length > 0 ? (
//         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {tasks.map((task) => (
//             <TaskCard
//               key={task._id}
//               task={task}
//               onUpdateStatus={handleUpdateStatus}
//               onDelete={handleDeleteTask}
//               onViewComments={() => setSelectedTask(task)}
//               onCopyLink={copyTaskLink}
//               getPriorityColor={getPriorityColor}
//               getStatusIcon={getStatusIcon}
//             />
//           ))}
//         </div>
//       ) : (
//         <div className="bg-white p-20 rounded-3xl shadow-lg text-center text-gray-500">
//           <CheckSquare size={48} className="mx-auto mb-4 text-gray-300" />
//           <p className="text-lg">No tasks found</p>
//           <p className="text-sm mt-2">
//             {filterStatus !== "all" || filterPriority !== "all"
//               ? "Try adjusting your filters"
//               : "Create your first task to get started"}
//           </p>
//         </div>
//       )}

//       {/* Create Task Modal */}
//       <CreateTaskWithInterview
//         showModal={showModal}
//         onClose={() => setShowModal(false)}
//         onSuccess={fetchTasks}
//       />

//       {/* Comments Modal */}
//       {selectedTask && (
//         <CommentsModal
//           task={selectedTask}
//           comment={comment}
//           setComment={setComment}
//           onAddComment={handleAddComment}
//           onClose={() => {
//             setSelectedTask(null);
//             setComment("");
//           }}
//         />
//       )}
//     </div>
//   );
// };

// // Stats Card Component
// const StatCard = ({ title, value, color }) => {
//   const colors = {
//     purple: "bg-purple-50 text-purple-700 border-purple-200",
//     yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
//     blue: "bg-blue-50 text-blue-700 border-blue-200",
//     green: "bg-green-50 text-green-700 border-green-200",
//     red: "bg-red-50 text-red-700 border-red-200",
//   };

//   return (
//     <div className={`p-6 rounded-xl border ${colors[color]}`}>
//       <p className="text-sm font-medium opacity-80">{title}</p>
//       <p className="text-3xl font-bold mt-2">{value}</p>
//     </div>
//   );
// };

// // Task Card Component
// const TaskCard = ({
//   task,
//   onUpdateStatus,
//   onDelete,
//   onViewComments,
//   onCopyLink,
//   getPriorityColor,
//   getStatusIcon,
// }) => {
//   const dueDate = task.dueDate ? new Date(task.dueDate) : null;
//   const isOverdue =
//     dueDate &&
//     dueDate < new Date() &&
//     task.status !== "completed" &&
//     task.status !== "cancelled";

//   return (
//     <div
//       className={`bg-white p-6 rounded-3xl shadow-lg border-2 hover:shadow-xl transition ${
//         isOverdue ? "border-red-300" : "border-gray-200"
//       }`}
//     >
//       {/* Header */}
//       <div className="flex justify-between items-start mb-4">
//         <div className="flex items-center gap-2 flex-wrap">
//           {getStatusIcon(task.status)}
//           <span
//             className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
//               task.priority
//             )}`}
//           >
//             {task.priority}
//           </span>
//           <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
//             {task.type}
//           </span>
//         </div>

//         <button
//           onClick={() => onDelete(task._id)}
//           className="text-gray-400 hover:text-red-600 transition"
//         >
//           <Trash2 size={16} />
//         </button>
//       </div>

//       {/* Title */}
//       <h3 className="font-bold text-gray-900 mb-2 text-lg">{task.title}</h3>

//       {/* Description */}
//       <p className="text-sm text-gray-600 mb-4 line-clamp-3">
//         {task.description || "No description provided"}
//       </p>

//       {/* Interview Setup Info */}
//       {task.interviewSetup && (
//         <div className="mb-4 p-3 bg-indigo-50 rounded-xl border border-indigo-200">
//           <p className="text-xs font-medium text-indigo-900 mb-1">
//             Interview Setup
//           </p>
//           <div className="text-xs text-indigo-700 space-y-1">
//             <p>Role: {task.interviewSetup.targetJobRole}</p>
//             <p>
//               Duration: {task.interviewSetup.duration}min • Questions:{" "}
//               {task.interviewSetup.numberOfQuestions}
//             </p>
//             {task.interviewSetup.autoStartTimer && (
//               <p className="text-orange-600 font-medium">
//                 Auto-start: {task.interviewSetup.autoStartTimer}min
//               </p>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Assigned To */}
//       <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
//         <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-bold">
//           {task.assignedTo?.name?.charAt(0).toUpperCase() || "?"}
//         </div>
//         <div className="flex-1 min-w-0">
//           <p className="font-medium text-gray-900 truncate">
//             {task.assignedTo?.name || "Unassigned"}
//           </p>
//           {task.assignedTo?.email && (
//             <p className="text-xs text-gray-500 truncate">
//               {task.assignedTo.email}
//             </p>
//           )}
//         </div>
//       </div>

//       {/* Due Date */}
//       {dueDate && (
//         <div
//           className={`flex items-center gap-2 text-xs mb-4 p-2 rounded-lg ${
//             isOverdue
//               ? "bg-red-50 text-red-700 font-medium"
//               : task.status === "completed"
//               ? "bg-green-50 text-green-700"
//               : "bg-gray-50 text-gray-600"
//           }`}
//         >
//           <Clock size={14} />
//           <span>
//             Due: {dueDate.toLocaleDateString()}
//             {isOverdue && " (Overdue!)"}
//             {task.status === "completed" &&
//               task.completedAt &&
//               ` • Completed: ${new Date(
//                 task.completedAt
//               ).toLocaleDateString()}`}
//           </span>
//         </div>
//       )}

//       {/* Task Link */}
//       {task.taskLink && (
//         <div className="mb-4 p-2 bg-green-50 rounded-lg border border-green-200">
//           <div className="flex items-center gap-2 justify-between">
//             <p className="text-xs text-green-700 font-medium truncate flex-1">
//               {task.taskLink}
//             </p>
//             <button
//               onClick={() => onCopyLink(task.taskLink)}
//               className="p-1 hover:bg-green-100 rounded"
//               title="Copy link"
//             >
//               <Copy size={14} className="text-green-600" />
//             </button>
//             <a
//               href={task.taskLink}
//               target="_blank"
//               rel="noopener noreferrer"
//               className="p-1 hover:bg-green-100 rounded"
//               title="Open link"
//             >
//               <ExternalLink size={14} className="text-green-600" />
//             </a>
//           </div>
//         </div>
//       )}

//       {/* Completion Score */}
//       {task.completionScore !== undefined && task.status === "completed" && (
//         <div className="mb-4 p-3 bg-green-50 rounded-xl border border-green-200">
//           <p className="text-xs font-medium text-green-900 mb-1">Score</p>
//           <p className="text-2xl font-bold text-green-600">
//             {task.completionScore}%
//           </p>
//         </div>
//       )}

//       {/* Actions */}
//       <div className="flex gap-2 pt-4 border-t">
//         <select
//           value={task.status}
//           onChange={(e) => onUpdateStatus(task._id, e.target.value)}
//           className="flex-1 px-3 py-2 text-xs border rounded-lg outline-none focus:ring-2 focus:ring-blue-300 font-medium"
//         >
//           <option value="pending">Pending</option>
//           <option value="in-progress">In Progress</option>
//           <option value="completed">Completed</option>
//           <option value="cancelled">Cancelled</option>
//         </select>

//         <button
//           onClick={onViewComments}
//           className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-xs font-medium"
//         >
//           <MessageSquare size={14} />
//           {task.comments?.length || 0}
//         </button>
//       </div>
//     </div>
//   );
// };

// // Comments Modal Component
// const CommentsModal = ({ task, comment, setComment, onAddComment, onClose }) => {
//   return (
//     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
//       <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 max-h-[80vh] overflow-y-auto">
//         <div className="flex justify-between items-start mb-6">
//           <div>
//             <h2 className="text-2xl font-bold">Task Comments</h2>
//             <p className="text-sm text-gray-500 mt-1">
//               {task.comments?.length || 0} comment(s)
//             </p>
//           </div>
//           <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
//             <X size={24} />
//           </button>
//         </div>

//         {/* Task Info */}
//         <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
//           <h3 className="font-bold text-gray-900 mb-1">{task.title}</h3>
//           {task.description && (
//             <p className="text-sm text-gray-600">{task.description}</p>
//           )}
//           <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
//             <span>Assigned to: {task.assignedTo?.name}</span>
//             <span className="px-2 py-1 bg-white rounded-full">{task.status}</span>
//             <span className="px-2 py-1 bg-white rounded-full">
//               {task.priority} priority
//             </span>
//           </div>
//         </div>

//         {/* Comments List */}
//         <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto">
//           {task.comments?.length > 0 ? (
//             task.comments.map((c, i) => (
//               <div
//                 key={i}
//                 className="p-4 bg-gray-50 rounded-xl border border-gray-200"
//               >
//                 <p className="text-sm text-gray-900 mb-2">{c.text}</p>
//                 <p className="text-xs text-gray-500">
//                   {new Date(c.createdAt).toLocaleString("en-US", {
//                     month: "short",
//                     day: "numeric",
//                     year: "numeric",
//                     hour: "numeric",
//                     minute: "2-digit",
//                   })}
//                 </p>
//               </div>
//             ))
//           ) : (
//             <div className="text-center text-gray-500 py-8">
//               <MessageSquare size={32} className="mx-auto mb-2 text-gray-300" />
//               <p>No comments yet</p>
//               <p className="text-sm mt-1">Be the first to add a comment</p>
//             </div>
//           )}
//         </div>

//         {/* Add Comment */}
//         <div className="flex gap-3 pt-4 border-t">
//           <input
//             type="text"
//             value={comment}
//             onChange={(e) => setComment(e.target.value)}
//             onKeyPress={(e) => {
//               if (e.key === "Enter" && comment.trim()) {
//                 onAddComment();
//               }
//             }}
//             placeholder="Add a comment..."
//             className="flex-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
//           />
//           <button
//             onClick={onAddComment}
//             disabled={!comment.trim()}
//             className="px-6 py-2 bg-blue-800 text-white rounded-xl hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
//           >
//             <Send size={16} />
//             Add
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TasksPage;

// TasksPage.jsx - Enhanced with multi-member status tracking
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  CheckSquare,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  Trash2,
  MessageSquare,
  Filter,
  X,
  Send,
  Copy,
  ExternalLink,
  Users,
  TrendingUp,
  Eye,
  Search,
  Loader2,
} from "lucide-react";
import CreateTaskWithInterview from "./CreateTaskWithInterview";

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [selectedTask, setSelectedTask] = useState(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMemberModal, setShowMemberModal] = useState(null);
  const [search, setSearch] = useState("");

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No authentication token found");
        return;
      }

      const params = new URLSearchParams();
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterPriority !== "all") params.append("priority", filterPriority);

      const tasksRes = await axios.get(
        `http://localhost:8000/api/tasks/all?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(tasksRes.data.tasks || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.response?.data?.msg || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filterStatus, filterPriority]);

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:8000/api/tasks/${taskId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        fetchTasks();
      }
    } catch (err) {
      console.error("Update status error:", err);
      alert(err.response?.data?.msg || "Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `http://localhost:8000/api/tasks/${taskId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert("✅ Task deleted successfully");
        fetchTasks();
      }
    } catch (err) {
      console.error("Delete task error:", err);
      alert(err.response?.data?.msg || "Failed to delete task");
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !selectedTask) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:8000/api/tasks/${selectedTask._id}/comment`,
        { text: comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setComment("");
        setSelectedTask(response.data.task);
        fetchTasks();
        alert("✅ Comment added");
      }
    } catch (err) {
      console.error("Add comment error:", err);
      alert(err.response?.data?.msg || "Failed to add comment");
    }
  };

  const copyTaskLink = (link) => {
    navigator.clipboard.writeText(link);
    alert("✅ Task link copied to clipboard!");
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-blue-100 text-blue-700 border-blue-200",
      medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
      high: "bg-orange-100 text-orange-700 border-orange-200",
      urgent: "bg-red-100 text-red-700 border-red-200",
    };
    return colors[priority] || colors.medium;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="text-yellow-600" size={16} />,
      "in-progress": <AlertCircle className="text-blue-600" size={16} />,
      completed: <CheckCircle2 className="text-green-600" size={16} />,
      cancelled: <Trash2 className="text-red-600" size={16} />,
    };
    return icons[status] || icons.pending;
  };

  const getTaskStats = () => {
    return {
      total: tasks.length,
      pending: tasks.filter((t) => t.overallStatus === "pending").length,
      inProgress: tasks.filter((t) => t.overallStatus === "in-progress").length,
      completed: tasks.filter((t) => t.overallStatus === "completed").length,
      overdue: tasks.filter((t) => {
        if (!t.dueDate || t.overallStatus === "completed") return false;
        return new Date(t.dueDate) < new Date();
      }).length,
    };
  };

  const stats = getTaskStats();

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-blue-800 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <CheckSquare size={18} className="text-blue-800 flex-shrink-0" />
          <h1 className="text-base font-bold text-gray-900">Task Management</h1>
        </div>
        <div className="relative w-48 flex-shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Search tasks..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50"
          />
        </div>
        <button
          onClick={() => { setShowModal(true); setError(""); }}
          className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm rounded-xl flex items-center gap-2 flex-shrink-0"
        >
          <Plus size={15} /> Create Task
        </button>
      </div>
      <div className="p-6 flex-1">

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid md:grid-cols-5 gap-4 mb-6">
        <StatCard title="Total Tasks" value={stats.total} color="blue" />
        <StatCard title="Pending" value={stats.pending} color="yellow" />
        <StatCard title="In Progress" value={stats.inProgress} color="blue" />
        <StatCard title="Completed" value={stats.completed} color="green" />
        <StatCard title="Overdue" value={stats.overdue} color="red" />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex items-center gap-4 flex-wrap">
        <Filter size={18} className="text-gray-500" />

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-300 text-sm"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Priority:</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-300 text-sm"
          >
            <option value="all">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        {(filterStatus !== "all" || filterPriority !== "all") && (
          <button
            onClick={() => {
              setFilterStatus("all");
              setFilterPriority("all");
            }}
            className="px-3 py-1 text-sm text-blue-800 hover:text-blue-900 font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Tasks Grid */}
      {tasks.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onUpdateStatus={handleUpdateStatus}
              onDelete={handleDeleteTask}
              onViewComments={() => setSelectedTask(task)}
              onCopyLink={copyTaskLink}
              onViewMembers={() => setShowMemberModal(task)}
              getPriorityColor={getPriorityColor}
              getStatusIcon={getStatusIcon}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white p-20 rounded-3xl shadow-lg text-center text-gray-500">
          <CheckSquare size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg">No tasks found</p>
          <p className="text-sm mt-2">
            {filterStatus !== "all" || filterPriority !== "all"
              ? "Try adjusting your filters"
              : "Create your first task to get started"}
          </p>
        </div>
      )}

      {/* Create Task Modal */}
      <CreateTaskWithInterview
        showModal={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchTasks}
      />

      {/* Comments Modal */}
      {selectedTask && (
        <CommentsModal
          task={selectedTask}
          comment={comment}
          setComment={setComment}
          onAddComment={handleAddComment}
          onClose={() => {
            setSelectedTask(null);
            setComment("");
          }}
        />
      )}

      {/* Member Status Modal */}
      {showMemberModal && (
        <MemberStatusModal
          task={showMemberModal}
          onClose={() => setShowMemberModal(null)}
          onCopyLink={copyTaskLink}
        />
      )}
      </div>
    </div>
  );
};

// Stats Card Component
const StatCard = ({ title, value, color }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-800 border-blue-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className={`p-6 rounded-xl border ${colors[color]}`}>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
};

// Task Card Component
const TaskCard = ({
  task,
  onUpdateStatus,
  onDelete,
  onViewComments,
  onCopyLink,
  onViewMembers,
  getPriorityColor,
  getStatusIcon,
}) => {
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue =
    dueDate &&
    dueDate < new Date() &&
    task.overallStatus !== "completed" &&
    task.overallStatus !== "cancelled";

  const stats = task.completionStats || {};
  const completionRate =
    stats.totalAssigned > 0
      ? Math.round((stats.completed / stats.totalAssigned) * 100)
      : 0;

  return (
    <div
      className={`bg-white p-6 rounded-3xl shadow-lg border-2 hover:shadow-xl transition ${
        isOverdue ? "border-red-300" : "border-gray-200"
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {getStatusIcon(task.overallStatus)}
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
              task.priority
            )}`}
          >
            {task.priority}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {task.type}
          </span>
        </div>

        <button
          onClick={() => onDelete(task._id)}
          className="text-gray-400 hover:text-red-600 transition"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Title */}
      <h3 className="font-bold text-gray-900 mb-2 text-lg">{task.title}</h3>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {task.description || "No description provided"}
      </p>

      {/* Multi-Member Status */}
      <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-blue-900 flex items-center gap-1">
            <Users size={14} />
            {stats.totalAssigned || 0} Members Assigned
          </p>
          <button
            onClick={onViewMembers}
            className="text-xs text-blue-800 hover:text-blue-900 font-medium flex items-center gap-1"
          >
            <Eye size={12} />
            View All
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-[10px] text-blue-800 mb-1">
            <span>Completion</span>
            <span className="font-bold">{completionRate}%</span>
          </div>
          <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-800 transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-3 gap-2 text-[10px]">
          <div className="text-center">
            <div className="font-bold text-green-600">{stats.completed || 0}</div>
            <div className="text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-blue-700">{stats.inProgress || 0}</div>
            <div className="text-gray-600">In Progress</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-yellow-600">{stats.pending || 0}</div>
            <div className="text-gray-600">Pending</div>
          </div>
        </div>

        {/* Average Score */}
        {stats.averageScore !== undefined && stats.completed > 0 && (
          <div className="mt-2 pt-2 border-t border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-blue-800">Avg Score:</span>
              <span className="text-sm font-bold text-blue-900">
                {stats.averageScore.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Interview Setup Info */}
      {task.interviewSetup && (
        <div className="mb-4 p-3 bg-indigo-50 rounded-xl border border-indigo-200">
          <p className="text-xs font-medium text-indigo-900 mb-1">
            Interview Setup
          </p>
          <div className="text-xs text-indigo-700 space-y-1">
            <p>Role: {task.interviewSetup.targetJobRole}</p>
            <p>
              Duration: {task.interviewSetup.duration}min • Questions:{" "}
              {task.interviewSetup.numberOfQuestions}
            </p>
          </div>
        </div>
      )}

      {/* Custom Fields */}
      {task.customFields && task.customFields.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-xs font-medium text-amber-900 mb-2">Custom Fields:</p>
          <div className="space-y-1">
            {task.customFields.slice(0, 2).map((field, idx) => (
              <div key={idx} className="text-xs text-amber-700">
                <span className="font-medium">{field.fieldName}:</span> {field.fieldValue}
              </div>
            ))}
            {task.customFields.length > 2 && (
              <p className="text-[10px] text-amber-600">
                +{task.customFields.length - 2} more
              </p>
            )}
          </div>
        </div>
      )}

      {/* Due Date */}
      {dueDate && (
        <div
          className={`flex items-center gap-2 text-xs mb-4 p-2 rounded-lg ${
            isOverdue
              ? "bg-red-50 text-red-700 font-medium"
              : task.overallStatus === "completed"
              ? "bg-green-50 text-green-700"
              : "bg-gray-50 text-gray-600"
          }`}
        >
          <Clock size={14} />
          <span>
            Due: {dueDate.toLocaleDateString()}
            {isOverdue && " (Overdue!)"}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <select
          value={task.overallStatus}
          onChange={(e) => onUpdateStatus(task._id, e.target.value)}
          className="flex-1 px-3 py-2 text-xs border rounded-lg outline-none focus:ring-2 focus:ring-blue-300 font-medium"
        >
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <button
          onClick={onViewComments}
          className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-xs font-medium"
        >
          <MessageSquare size={14} />
          {task.comments?.length || 0}
        </button>
      </div>
    </div>
  );
};

// Member Status Modal
const MemberStatusModal = ({ task, onClose, onCopyLink }) => {
  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
      "in-progress": "bg-blue-100 text-blue-700 border-blue-300",
      completed: "bg-green-100 text-green-700 border-green-300",
      cancelled: "bg-red-100 text-red-700 border-red-300",
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-8 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">Member Status</h2>
            <p className="text-sm text-gray-500 mt-1">{task.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Overall Progress */}
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-blue-900">Overall Progress</span>
            <span className="text-lg font-bold text-blue-800">
              {task.completionStats?.completed || 0} / {task.completionStats?.totalAssigned || 0}
            </span>
          </div>
          <div className="w-full h-3 bg-blue-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-800"
              style={{
                width: `${
                  task.completionStats?.totalAssigned > 0
                    ? (task.completionStats.completed / task.completionStats.totalAssigned) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Member List */}
        <div className="space-y-3">
          {task.assignedTo && task.assignedTo.map((member, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border-2 ${getStatusColor(member.status)}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{member.name}</h3>
                  <p className="text-xs text-gray-600">{member.email}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                  {member.status}
                </span>
              </div>

              {/* Progress Info */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                {member.startedAt && (
                  <div>
                    <span className="text-gray-600">Started:</span>
                    <span className="ml-1 font-medium">
                      {new Date(member.startedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {member.completedAt && (
                  <div>
                    <span className="text-gray-600">Completed:</span>
                    <span className="ml-1 font-medium">
                      {new Date(member.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Score */}
              {member.completionScore !== undefined && (
                <div className="mb-3 p-2 bg-white rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Score:</span>
                    <span className="text-lg font-bold text-green-600">
                      {member.completionScore.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Task Link */}
              {member.taskLink && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={member.taskLink}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border rounded-lg text-xs"
                  />
                  <button
                    onClick={() => onCopyLink(member.taskLink)}
                    className="px-3 py-2 bg-white border rounded-lg hover:bg-gray-50"
                    title="Copy link"
                  >
                    <Copy size={14} />
                  </button>
                  <a
                    href={member.taskLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-white border rounded-lg hover:bg-gray-50"
                    title="Open link"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Comments Modal Component
const CommentsModal = ({ task, comment, setComment, onAddComment, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">Task Comments</h2>
            <p className="text-sm text-gray-500 mt-1">
              {task.comments?.length || 0} comment(s)
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Task Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <h3 className="font-bold text-gray-900 mb-1">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-gray-600">{task.description}</p>
          )}
        </div>

        {/* Comments List */}
        <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto">
          {task.comments?.length > 0 ? (
            task.comments.map((c, i) => (
              <div
                key={i}
                className="p-4 bg-gray-50 rounded-xl border border-gray-200"
              >
                <p className="text-sm text-gray-900 mb-2">{c.text}</p>
                <p className="text-xs text-gray-500">
                  {new Date(c.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              <MessageSquare size={32} className="mx-auto mb-2 text-gray-300" />
              <p>No comments yet</p>
              <p className="text-sm mt-1">Be the first to add a comment</p>
            </div>
          )}
        </div>

        {/* Add Comment */}
        <div className="flex gap-3 pt-4 border-t">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && comment.trim()) {
                onAddComment();
              }
            }}
            placeholder="Add a comment..."
            className="flex-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            onClick={onAddComment}
            disabled={!comment.trim()}
            className="px-6 py-2 bg-blue-800 text-white rounded-xl hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            <Send size={16} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default TasksPage;