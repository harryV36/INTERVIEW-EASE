import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Building2,
  User,
  Play,
  ExternalLink,
  ListTodo,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const getTaskStatus = (task) => task.myStatus || task.status || task.overallStatus;

const getTaskToken = (task) => {
  const directToken = task.myAccessToken || task.accessToken;
  if (directToken) return directToken;

  if (task.myTaskLink) {
    try {
      const url = new URL(task.myTaskLink, window.location.origin);
      const parts = url.pathname.split("/").filter(Boolean);
      return parts[parts.length - 1] || null;
    } catch (err) {
      console.warn("Failed to parse task link:", err);
    }
  }

  return null;
};

const getCompletionScore = (task) =>
  task.myCompletionScore !== undefined ? task.myCompletionScore : task.completionScore;

const getScorecardId = (task) => task.myScorecardId || task.scorecardId;

const StudentTaskViewer = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:8000/api/tasks/my-tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setTasks(res.data.tasks || []);
    } catch (err) {
      console.error("Fetch tasks error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = (task) => {
    const token = getTaskToken(task);
    if (!token) {
      console.error("Task token not found:", task);
      alert("Error: Task token is missing. Please try again.");
      return;
    }
    navigate(`/task/${token}`);
  };

  const filteredTasks = tasks.filter((task) => {
    const status = getTaskStatus(task);
    if (filter === "all") return true;
    if (filter === "pending") return status === "pending" || status === "in-progress";
    if (filter === "completed") return status === "completed";
    return true;
  });

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => getTaskStatus(t) === "pending").length,
    inProgress: tasks.filter((t) => getTaskStatus(t) === "in-progress").length,
    completed: tasks.filter((t) => getTaskStatus(t) === "completed").length,
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-full bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ListTodo size={20} className="text-blue-600" /> My Assigned Tasks
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">Complete your assigned interview tasks</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Tasks" value={stats.total} color="blue" />
        <StatCard title="Pending" value={stats.pending} color="yellow" />
        <StatCard title="In Progress" value={stats.inProgress} color="sky" />
        <StatCard title="Completed" value={stats.completed} color="green" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 mb-5 flex items-center gap-2">
        {["all", "pending", "completed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filter === f
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">{filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Tasks */}
      {filteredTasks.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard key={task._id} task={task} onStart={() => handleStartTask(task)} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-16 text-center">
          <CheckCircle2 size={48} className="mx-auto mb-4 text-gray-200" />
          <h2 className="text-base font-semibold text-gray-700 mb-1">No Tasks Found</h2>
          <p className="text-gray-400 text-sm">You don't have any {filter} tasks at the moment</p>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, color }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-100",
    sky: "bg-sky-50 text-sky-700 border-sky-100",
    green: "bg-green-50 text-green-700 border-green-100",
  };
  return (
    <div className={`p-4 rounded-xl border ${colors[color]} shadow-sm`}>
      <p className="text-xs font-medium opacity-70">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
};

const TaskCard = ({ task, onStart }) => {
  const status = getTaskStatus(task);
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && status !== "completed";
  const isPending = status === "pending";
  const isCompleted = status === "completed";
  const completionScore = getCompletionScore(task);
  const scorecardId = getScorecardId(task);

  const statusStyle = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-100",
    "in-progress": "bg-blue-50 text-blue-700 border-blue-100",
    completed: "bg-green-50 text-green-700 border-green-100",
    cancelled: "bg-red-50 text-red-700 border-red-100",
  };

  const statusIcon = {
    pending: <Clock size={13} />,
    "in-progress": <AlertCircle size={13} />,
    completed: <CheckCircle2 size={13} />,
  };

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition p-5 ${
        isOverdue ? "border-red-200" : "border-gray-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">{task.title}</h3>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
            <Building2 size={12} />
            {task.organizationId?.name || "Organization"}
          </div>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1 flex-shrink-0 ${
            statusStyle[status] || "bg-gray-50 text-gray-600 border-gray-100"
          }`}
        >
          {statusIcon[status]}
          {status}
        </span>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-gray-500 text-xs mb-3 line-clamp-2 leading-relaxed">{task.description}</p>
      )}

      {/* Meta */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <User size={12} className="text-blue-500" />
          Assigned by: {task.assignedBy?.name || "Unknown"}
        </div>
        {task.dueDate && (
          <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
            <Calendar size={12} />
            Due: {new Date(task.dueDate).toLocaleDateString()}
            {isOverdue && " (Overdue!)"}
          </div>
        )}

        {task.interviewSetup && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mt-2">
            <p className="text-xs font-semibold text-blue-700 mb-1.5">Interview Setup</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-blue-600">
              <span>Role: {task.interviewSetup.targetJobRole}</span>
              <span>Duration: {task.interviewSetup.duration} min</span>
              <span>Questions: {task.interviewSetup.numberOfQuestions}</span>
              <span>Difficulty: {task.interviewSetup.difficulty}</span>
            </div>
          </div>
        )}

        {isCompleted && completionScore !== undefined && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 mt-2">
            <p className="text-xs font-medium text-green-700">
              Score: <span className="text-xl font-bold">{completionScore}%</span>
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {!isCompleted && (
        <button
          onClick={onStart}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
        >
          {isPending ? <Play size={15} /> : <ExternalLink size={15} />}
          {isPending ? "Start Interview" : "Continue Interview"}
        </button>
      )}

      {isCompleted && (
        <button
          onClick={() => scorecardId && window.open(`/scorecard/${scorecardId}`, "_blank")}
          className="w-full py-2.5 border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 transition text-sm font-medium"
        >
          View Scorecard
        </button>
      )}
    </div>
  );
};

export default StudentTaskViewer;
