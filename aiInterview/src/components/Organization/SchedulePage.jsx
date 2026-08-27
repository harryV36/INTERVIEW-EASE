import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Calendar,
  Clock,
  User,
  X,
  Mail,
  AlertCircle,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Video,
  Plus,
} from "lucide-react";

const SchedulePage = () => {
  const [members, setMembers] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState("calendar");
  const [showSummary, setShowSummary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    assignedTo: [],
    title: "",
    description: "",
    scheduledDate: "",
    duration: "45",
    interviewConfig: {
      targetJobRole: "",
      difficulty: "Medium",
      numberOfQuestions: 10,
    },
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No authentication token found. Please login.");
        return;
      }

      const membersRes = await axios.get(
        "http://localhost:8000/api/organization/members/performance",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMembers(membersRes.data.members || []);

      const interviewsRes = await axios.get(
        "http://localhost:8000/api/scheduling/all",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInterviews(interviewsRes.data.interviews || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.response?.data?.msg || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.assignedTo || formData.assignedTo.length === 0) {
      setError("Please select at least one member");
      return;
    }

    if (!formData.scheduledDate) {
      setError("Please select date and time");
      return;
    }

    const selectedDateTime = new Date(formData.scheduledDate);
    if (selectedDateTime < new Date()) {
      setError("Cannot schedule interviews in the past");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:8000/api/scheduling/schedule",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert("Interview scheduled successfully! Email notification sent.");
        setShowModal(false);
        setFormData({
          assignedTo: [],
          title: "",
          description: "",
          scheduledDate: "",
          duration: "45",
          interviewConfig: {
            targetJobRole: "",
            difficulty: "Medium",
            numberOfQuestions: 10,
          },
          notes: "",
        });
        fetchData();
      }
    } catch (err) {
      console.error("Schedule error:", err);
      setError(err.response?.data?.msg || "Failed to schedule interview");
    }
  };

  const handleCancelInterview = async (interviewId) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this interview? The candidate will be notified."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `http://localhost:8000/api/scheduling/${interviewId}/cancel`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert("Interview cancelled. Notification sent to the candidate.");
        fetchData();
      }
    } catch (err) {
      console.error("Cancel error:", err);
      alert(err.response?.data?.msg || "Failed to cancel interview");
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-blue-800 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading schedules...</p>
        </div>
      </div>
    );
  }

  const totalScheduled = interviews.length;
  const upcoming = interviews.filter(
    (i) => i.status === "scheduled" && new Date(i.scheduledDate) > new Date()
  ).length;
  const completed = interviews.filter((i) => i.status === "completed").length;
  const cancelled = interviews.filter((i) => i.status === "cancelled").length;

  return (
    <div className="min-h-full bg-[#f7f7f5] flex flex-col text-slate-900">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-200 px-6 py-4 shadow-[0_1px_0_rgba(15,23,42,0.04)] flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-[220px] flex-1">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200">
            <Calendar size={18} className="text-slate-700" />
          </div>
          <div>
            <span className="block text-base font-semibold text-slate-900 leading-tight">
              Interview Scheduling
            </span>
            <span className="block text-xs text-slate-500 mt-0.5">Plan interviews and track status in one place</span>
          </div>
        </div>

        <div className="relative w-44">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-44 pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-200 bg-white outline-none"
          />
        </div>

        <div className="bg-slate-100 rounded-xl p-1 flex border border-slate-200">
          <button
            onClick={() => setView("calendar")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              view === "calendar"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:bg-white/70"
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setView("list")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              view === "list"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:bg-white/70"
            }`}
          >
            List
          </button>
        </div>

        <button
          onClick={() => {
            setShowModal(true);
            setError("");
          }}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition shadow-sm"
        >
          <Plus size={15} />
          Schedule Interview
        </button>
      </div>

      <div className="p-6 flex-1">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 flex items-center gap-2 text-sm shadow-sm">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <div className="mb-5">
          <button
            type="button"
            onClick={() => setShowSummary((prev) => !prev)}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
          >
            <ChevronDown
              size={16}
              className={`transition-transform ${showSummary ? "rotate-180" : "rotate-0"}`}
            />
            {showSummary ? "Hide summary" : "Show summary"}
          </button>

          {showSummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-3 border border-slate-100">
                  <Calendar size={18} className="text-slate-700" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{totalScheduled}</p>
                <p className="text-xs text-gray-400 font-medium mt-1">Total Scheduled</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-3 border border-slate-100">
                  <Clock size={18} className="text-slate-700" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{upcoming}</p>
                <p className="text-xs text-gray-400 font-medium mt-1">Upcoming</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3 border border-emerald-100">
                  <CheckCircle2 size={18} className="text-emerald-700" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{completed}</p>
                <p className="text-xs text-gray-400 font-medium mt-1">Completed</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center mb-3 border border-rose-100">
                  <XCircle size={18} className="text-rose-600" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{cancelled}</p>
                <p className="text-xs text-gray-400 font-medium mt-1">Cancelled</p>
              </div>
            </div>
          )}
        </div>

        {view === "calendar" ? (
          <CalendarView
            interviews={interviews}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onCancel={handleCancelInterview}
          />
        ) : (
          <ListView interviews={interviews} onCancel={handleCancelInterview} />
        )}
      </div>

      {showModal && (
        <ScheduleModal
          formData={formData}
          setFormData={setFormData}
          members={members}
          onSubmit={handleSchedule}
          onClose={() => {
            setShowModal(false);
            setError("");
          }}
          error={error}
        />
      )}
    </div>
  );
};

const CalendarView = ({ interviews, selectedDate, setSelectedDate, onCancel }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const getInterviewsForDate = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return interviews.filter((interview) => {
      const d = new Date(interview.scheduledDate);
      return (
        d.getDate() === date.getDate() &&
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear()
      );
    });
  };

  const nextMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const prevMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const selectedDayInterviews = interviews.filter((interview) => {
    const d = new Date(interview.scheduledDate);
    return (
      d.getDate() === selectedDate.getDate() &&
      d.getMonth() === selectedDate.getMonth() &&
      d.getFullYear() === selectedDate.getFullYear()
    );
  });

  const statusDotColor = (status) => {
    if (status === "cancelled") return "bg-rose-500";
    if (status === "completed") return "bg-emerald-500";
    if (status === "in-progress") return "bg-amber-500";
    return "bg-blue-500";
  };

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-5">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={prevMonth}
              className="px-3 py-1.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm transition bg-white"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => {
                setCurrentMonth(new Date());
                setSelectedDate(new Date());
              }}
              className="px-3 py-1.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm transition bg-white"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="px-3 py-1.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm transition bg-white"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-gray-400 uppercase py-2"
            >
              {day}
            </div>
          ))}

          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayInterviews = getInterviewsForDate(day);
            const isSelected =
              selectedDate.getDate() === day &&
              selectedDate.getMonth() === currentMonth.getMonth() &&
              selectedDate.getFullYear() === currentMonth.getFullYear();
            const isToday =
              new Date().getDate() === day &&
              new Date().getMonth() === currentMonth.getMonth() &&
              new Date().getFullYear() === currentMonth.getFullYear();

            return (
              <button
                key={day}
                onClick={() =>
                  setSelectedDate(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                  )
                }
                className={`aspect-square rounded-xl border transition-all cursor-pointer text-sm font-medium flex items-center justify-center relative ${
                  isSelected
                    ? "bg-white text-blue-700 border-blue-300 ring-2 ring-blue-100 shadow-sm"
                    : isToday
                    ? "border-slate-300 text-slate-900 bg-slate-50"
                    : "border-gray-100 text-gray-700 hover:border-slate-200 hover:bg-slate-50"
                }`}
              >
                {day}
                {dayInterviews.length > 0 && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${
                      isSelected
                        ? "bg-blue-500"
                        : statusDotColor(dayInterviews[0].status)
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5">
        <p className="text-sm font-semibold text-slate-800 mb-4">
          {selectedDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>

        {selectedDayInterviews.length > 0 ? (
          <div className="max-h-[560px] overflow-y-auto">
            {selectedDayInterviews
              .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
              .map((interview) => (
                <InterviewCard
                  key={interview._id}
                  interview={interview}
                  onCancel={onCancel}
                />
              ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <Calendar size={36} className="text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No interviews for this day</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ListView = ({ interviews, onCancel }) => {
  const grouped = interviews.reduce((acc, interview) => {
    const date = new Date(interview.scheduledDate).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(interview);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));

  if (sortedDates.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center shadow-sm">
        <Calendar size={40} className="text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-gray-400">No interviews scheduled</p>
      </div>
    );
  }

  return (
    <div>
      {sortedDates.map((date) => (
        <div
          key={date}
          className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 mb-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={14} className="text-slate-600" />
            <span className="text-sm font-semibold text-slate-700">{date}</span>
          </div>
          {grouped[date]
            .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
            .map((interview) => (
              <InterviewCard
                key={interview._id}
                interview={interview}
                onCancel={onCancel}
              />
            ))}
        </div>
      ))}
    </div>
  );
};

const InterviewCard = ({ interview, onCancel }) => {
  const time = new Date(interview.scheduledDate).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const borderColor =
    {
      scheduled: "border-l-blue-500",
      "in-progress": "border-l-amber-500",
      completed: "border-l-emerald-500",
      cancelled: "border-l-rose-400",
    }[interview.status] || "border-l-blue-500";

  const statusPill =
    {
      scheduled: "bg-blue-100 text-blue-700",
      "in-progress": "bg-amber-100 text-amber-700",
      completed: "bg-emerald-100 text-emerald-700",
      cancelled: "bg-rose-100 text-rose-600",
    }[interview.status] || "bg-blue-100 text-blue-700";

  return (
      <div className="p-4 rounded-2xl border border-gray-200 bg-[#fcfcfb] mb-3 last:mb-0 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
        <div className={`border-l-4 ${borderColor} pl-3`}>
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-gray-900 text-sm">{interview.title}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${statusPill}`}>
            {interview.status}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mt-0.5">
          <Clock size={12} className="text-gray-400" />
          <span className="text-xs text-gray-500">
            {time} &bull; {interview.duration} min
          </span>
        </div>

        <div className="flex items-center gap-1.5 mt-1.5">
          <User size={12} className="text-gray-400" />
          <span className="text-xs text-gray-500">
            {interview.assignedTo?.name || "Unknown"}
          </span>
        </div>

        {interview.meetingLink && (
          <a
            href={interview.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 mt-2"
          >
            <Video size={12} />
            Join Meeting
          </a>
        )}

        {interview.status === "scheduled" && (
          <button
            onClick={() => onCancel(interview._id)}
            className="text-rose-600 border border-rose-200 hover:bg-rose-50 rounded-lg px-3 py-1.5 text-xs font-medium mt-2 w-full transition bg-white"
          >
            Cancel Interview
          </button>
        )}
      </div>
    </div>
  );
};

const ScheduleModal = ({ formData, setFormData, members, onSubmit, onClose, error }) => {
  const minDateTime = new Date();
  minDateTime.setMinutes(minDateTime.getMinutes() + 30);
  const minDateTimeString = minDateTime.toISOString().slice(0, 16);

  const toggleMemberSelection = (memberId) => {
    setFormData((prev) => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(memberId)
        ? prev.assignedTo.filter((id) => id !== memberId)
        : [...prev.assignedTo, memberId],
    }));
  };

  const selectAllMembers = () => {
    if (formData.assignedTo.length === members.length) {
      setFormData((prev) => ({ ...prev, assignedTo: [] }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      assignedTo: members.map((m) => m.userId),
    }));
  };

  const inputClass =
    "w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400";
  const labelClass = "text-xs font-medium text-gray-500 mb-1 block";

  return (
    <div className="fixed inset-0 bg-black/35 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto border border-gray-100">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-base font-semibold text-gray-900">Schedule Interview</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-xl transition"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-xl mb-4 flex items-center gap-2">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Interview Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Technical Interview - Frontend Role"
              className={inputClass}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass}>Assign To *</label>
              <button
                type="button"
                onClick={selectAllMembers}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {formData.assignedTo.length === members.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-3 max-h-56 overflow-y-auto">
              {members.map((member) => {
                const isSelected = formData.assignedTo.includes(member.userId);
                return (
                  <label
                    key={member.userId}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition ${
                      isSelected
                        ? "bg-blue-50 border-blue-500"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleMemberSelection(member.userId)}
                      className="accent-blue-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <p className="text-xs text-gray-400 mt-2">
              {formData.assignedTo.length} selected
            </p>

            {members.length === 0 && (
              <p className="text-xs text-rose-600 mt-1">
                No members available. Please add members first.
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Date &amp; Time *</label>
              <input
                type="datetime-local"
                required
                min={minDateTimeString}
                value={formData.scheduledDate}
                onChange={(e) =>
                  setFormData({ ...formData, scheduledDate: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Duration (minutes)</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className={inputClass}
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
                <option value="120">120 minutes</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows="3"
              placeholder="Interview details and instructions for the candidate"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Internal Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="2"
              placeholder="Private notes (not visible to candidate)"
              className={inputClass}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={members.length === 0}
              className="flex-1 bg-slate-900 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-slate-800 flex items-center justify-center gap-2 disabled:opacity-50 transition"
            >
              <Mail size={15} />
              Schedule &amp; Send Email
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchedulePage;
