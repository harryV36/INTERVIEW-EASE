// src/components/Student/TaskExecutionPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Play,
  Building2,
  Calendar,
} from "lucide-react";

const TaskExecutionPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [autoStarting, setAutoStarting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid task link. No token provided.");
      setLoading(false);
      return;
    }
    fetchTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      handleAutoStart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  const fetchTask = async () => {
    try {
      setError(null);
      console.log("Fetching task with token:", token);
      
      const res = await axios.get(
        `http://localhost:8000/api/tasks/by-token/${token}`
      );

      if (res.data.success) {
        const taskData = res.data.task;
        const status = taskData?.userStatus || taskData?.status || taskData?.overallStatus;
        setTask(taskData);
        setExpired(res.data.expired);

        // Auto-start timer if configured
        if (
          taskData?.interviewSetup?.autoStartTimer &&
          status === "pending"
        ) {
          const timerMinutes = taskData.interviewSetup.autoStartTimer;
          setCountdown(timerMinutes * 60); // Convert to seconds
        }
      }
    } catch (err) {
      console.error("Fetch task error:", err);
      setError(err.response?.data?.msg || "Task not found or invalid link");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoStart = async () => {
    setAutoStarting(true);
    await handleStartInterview();
  };

  const handleStartInterview = async () => {
    try {
      // Create interview session with task setup
      const authToken = localStorage.getItem("token");
      const sessionRes = await axios.post(
        "http://localhost:8000/api/ai-interviews/start",
        {
          ...task.interviewSetup,
          taskId: task._id,
          taskToken: token,
        },
        {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        }
      );

      if (sessionRes.data.success && sessionRes.data.sessionId) {
        // Mark task as started
        await axios.post(
          `http://localhost:8000/api/tasks/start/${token}`,
          { sessionId: sessionRes.data.sessionId }
        );

        // Navigate to interview
        navigate(`/interview/${sessionRes.data.sessionId}`);
      }
    } catch (err) {
      console.error("Start interview error:", err);
      alert("Failed to start interview");
      setAutoStarting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="bg-white p-12 rounded-3xl shadow-2xl text-center max-w-md">
          <AlertTriangle size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading task...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Task Not Found
          </h2>
          <p className="text-gray-600">Invalid or expired task link</p>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="bg-white p-12 rounded-3xl shadow-2xl text-center max-w-md">
          <AlertTriangle size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Task Expired</h2>
          <p className="text-gray-600 mb-6">
            This task's deadline has passed. Please contact your organization
            administrator.
          </p>
          <div className="bg-red-50 p-4 rounded-xl border border-red-200">
            <p className="text-sm text-red-700">
              Due Date: {new Date(task.dueDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const taskStatus = task?.userStatus || task?.status || task?.overallStatus;
  const taskSessionId = task?.sessionId || task?.mySessionId;
  const completionScore = task?.completionScore ?? task?.myCompletionScore;

  if (taskStatus === "completed") {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="bg-white p-12 rounded-3xl shadow-2xl text-center max-w-md">
          <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Task Completed!
          </h2>
          <p className="text-gray-600 mb-6">
            You've successfully completed this interview task.
          </p>
          {completionScore !== undefined && (
            <div className="bg-green-50 p-6 rounded-xl border border-green-200">
              <p className="text-sm text-green-700 mb-2">Your Score</p>
              <p className="text-4xl font-bold text-green-600">
                {completionScore}%
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-6 flex items-center justify-center">
      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12">
        {/* Countdown Timer */}
        {countdown !== null && countdown > 0 && (
          <div className="mb-8 bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-2xl text-center">
            <Clock size={48} className="mx-auto mb-3" />
            <h3 className="text-2xl font-bold mb-2">Auto-Start Timer</h3>
            <p className="text-5xl font-bold mb-2">{formatTime(countdown)}</p>
            <p className="text-sm opacity-90">
              Interview will start automatically when timer reaches 0
            </p>
          </div>
        )}

        {/* Auto-Starting */}
        {autoStarting && (
          <div className="mb-8 bg-blue-50 p-6 rounded-2xl text-center border border-blue-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-blue-900 font-medium">Starting your interview...</p>
          </div>
        )}

        {/* Task Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{task.title}</h1>
          <p className="text-gray-600">{task.organizationId?.name}</p>
        </div>

        {/* Task Details */}
        <div className="bg-gray-50 p-6 rounded-2xl mb-8">
          <h3 className="font-bold text-gray-900 mb-4">Task Information</h3>
          
          {task.description && (
            <p className="text-gray-700 mb-4">{task.description}</p>
          )}

          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={16} className="text-purple-600" />
              <span>
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock size={16} className="text-purple-600" />
              <span>Priority: {task.priority}</span>
            </div>
          </div>
        </div>

        {/* Interview Setup */}
        {task.interviewSetup && (
          <div className="bg-purple-50 p-6 rounded-2xl mb-8 border border-purple-200">
            <h3 className="font-bold text-purple-900 mb-4">
              Interview Configuration
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-purple-800">
              <div>
                <span className="font-medium">Role:</span>{" "}
                {task.interviewSetup.targetJobRole}
              </div>
              {task.interviewSetup.targetCompany && (
                <div>
                  <span className="font-medium">Company:</span>{" "}
                  {task.interviewSetup.targetCompany}
                </div>
              )}
              <div>
                <span className="font-medium">Duration:</span>{" "}
                {task.interviewSetup.duration} minutes
              </div>
              <div>
                <span className="font-medium">Questions:</span>{" "}
                {task.interviewSetup.numberOfQuestions}
              </div>
              <div>
                <span className="font-medium">Difficulty:</span>{" "}
                {task.interviewSetup.difficulty}
              </div>
              <div>
                <span className="font-medium">Language:</span>{" "}
                {task.interviewSetup.preferredLanguage}
              </div>
            </div>

            {task.interviewSetup.interviewType?.length > 0 && (
              <div className="mt-4">
                <span className="font-medium text-purple-900 block mb-2">
                  Interview Rounds:
                </span>
                <div className="flex flex-wrap gap-2">
                  {task.interviewSetup.interviewType.map((type, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 p-6 rounded-2xl mb-8 border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
            <AlertTriangle size={20} />
            Instructions
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Ensure you have a stable internet connection</li>
            <li>• Find a quiet place with minimal distractions</li>
            <li>• Allow camera and microphone access if required</li>
            <li>• Once started, you cannot pause the interview</li>
            <li>• Your responses will be evaluated automatically</li>
          </ul>
        </div>

        {/* Start Button */}
        {taskStatus === "pending" && !autoStarting && (
          <button
            onClick={handleStartInterview}
            disabled={countdown !== null}
            className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:opacity-90 transition font-semibold text-lg shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={24} />
            {countdown !== null
              ? "Waiting for auto-start..."
              : "Start Interview Now"}
          </button>
        )}

        {taskStatus === "in-progress" && (
          <button
            onClick={() => taskSessionId && navigate(`/interview/${taskSessionId}`)}
            className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:opacity-90 transition font-semibold text-lg shadow-lg flex items-center justify-center gap-3"
          >
            Continue Interview
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskExecutionPage;