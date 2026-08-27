import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Users, Calendar, CheckSquare, TrendingUp,
  UserPlus, BarChart3, ArrowUpRight, Search,
  LayoutDashboard, Loader2, Building2,
} from "lucide-react";

const OrgDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalMembers: 0, upcomingInterviews: 0, pendingTasks: 0, avgPerformance: 0 });
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      // FIX: was calling /api/organization/me — correct route is /api/organization/
      const orgRes = await axios.get("http://localhost:8000/api/organization/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (orgRes.data.success) {
        const org = orgRes.data.organization;
        setOrganization(org);
        const [perfRes, interviewRes, taskRes] = await Promise.all([
          axios.get("http://localhost:8000/api/organization/members/performance", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("http://localhost:8000/api/scheduling/all", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("http://localhost:8000/api/tasks/all", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const members = perfRes.data.members || [];
        const interviews = interviewRes.data.interviews || [];
        const tasks = taskRes.data.tasks || [];
        const avgPerf = members.length > 0
          ? members.reduce((sum, m) => sum + parseFloat(m.performance?.avgScore || 0), 0) / members.length
          : 0;
        setStats({
          totalMembers: members.length,
          upcomingInterviews: interviews.filter((i) => i.status === "scheduled").length,
          // FIX: tasks now use overallStatus not status
          pendingTasks: tasks.filter((t) => t.overallStatus === "pending").length,
          avgPerformance: avgPerf.toFixed(1),
        });
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-blue-800 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Members",
      value: stats.totalMembers,
      icon: <Users size={18} />,
      link: "/org/members",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-700",
      valueColor: "text-blue-800",
      hoverArrow: "group-hover:text-blue-700",
    },
    {
      title: "Upcoming Interviews",
      value: stats.upcomingInterviews,
      icon: <Calendar size={18} />,
      link: "/org/schedule",
      iconBg: "bg-violet-50",
      iconColor: "text-violet-700",
      valueColor: "text-violet-800",
      hoverArrow: "group-hover:text-violet-700",
    },
    {
      title: "Pending Tasks",
      value: stats.pendingTasks,
      icon: <CheckSquare size={18} />,
      link: "/org/tasks",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-700",
      valueColor: "text-amber-800",
      hoverArrow: "group-hover:text-amber-700",
    },
    {
      title: "Avg Performance",
      value: `${stats.avgPerformance}%`,
      icon: <TrendingUp size={18} />,
      link: "/org/scores",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-700",
      valueColor: "text-emerald-800",
      hoverArrow: "group-hover:text-emerald-700",
    },
  ];

  const quickActions = [
    {
      icon: <UserPlus size={16} />,
      label: "Invite Member",
      to: "/org/members",
      style: "bg-blue-800 hover:bg-blue-900",
    },
    {
      icon: <Calendar size={16} />,
      label: "Schedule Interview",
      to: "/org/schedule",
      style: "bg-violet-700 hover:bg-violet-800",
    },
    {
      icon: <CheckSquare size={16} />,
      label: "Create Task",
      to: "/org/tasks",
      style: "bg-amber-600 hover:bg-amber-700",
    },
    {
      icon: <BarChart3 size={16} />,
      label: "View Scores",
      to: "/org/scores",
      style: "bg-emerald-700 hover:bg-emerald-800",
    },
  ];

  const activityRows = [
    { label: "Members invited this month", value: stats.totalMembers },
    { label: "Interviews scheduled", value: stats.upcomingInterviews },
    { label: "Tasks pending", value: stats.pendingTasks },
  ];

  return (
    <div className="min-h-full bg-gray-50 flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <LayoutDashboard size={18} className="text-blue-800 flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="text-base font-bold text-gray-900 leading-tight">Dashboard</h1>
            {organization && (
              <p className="text-xs text-gray-400 truncate">{organization.name}</p>
            )}
          </div>
        </div>
        <div className="relative w-56 flex-shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Search..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
          />
        </div>
      </div>

      <div className="p-6 flex-1">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((card) => (
            <button
              key={card.title}
              onClick={() => navigate(card.link)}
              className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md p-5 text-left transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.iconBg} ${card.iconColor}`}>
                  {card.icon}
                </div>
                <ArrowUpRight size={14} className={`text-gray-300 transition-colors ${card.hoverArrow}`} />
              </div>
              <p className={`text-2xl font-bold text-gray-900 mb-1`}>{card.value}</p>
              <p className="text-xs text-gray-400">{card.title}</p>
            </button>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.to)}
                className={`${action.style} text-white rounded-xl px-4 py-3 flex items-center gap-2.5 text-sm font-medium shadow-sm transition-colors`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activity at a Glance */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Activity at a Glance</h2>
          <div>
            {activityRows.map((row, idx) => (
              <div
                key={row.label}
                className={`flex justify-between py-2 text-sm ${idx < activityRows.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <span className="text-gray-600">{row.label}</span>
                <span className="font-semibold text-gray-900">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Get started banner — only when no members */}
        {stats.totalMembers === 0 && (
          <div className="bg-gradient-to-r from-blue-800 to-indigo-900 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <Building2 size={22} className="opacity-80" />
              <h3 className="text-base font-semibold">Get started</h3>
            </div>
            <p className="text-blue-200 text-sm mb-4">
              Invite team members to begin scheduling interviews and assigning tasks.
            </p>
            <button
              onClick={() => navigate("/org/members")}
              className="bg-white text-blue-800 rounded-xl px-5 py-2 text-sm font-semibold hover:bg-blue-50 transition-colors"
            >
              Invite Members
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrgDashboard;
