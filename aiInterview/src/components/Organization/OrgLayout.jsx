import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import Header from "../custom/Header";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CheckSquare,
  Award,
  Settings,
  LogOut,
  Building2,
  Filter,
} from "lucide-react";

const OrgLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/home/login");
  };

  const menu = [
    { label: "Dashboard",     to: "/org/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "Members",       to: "/org/members",   icon: <Users size={18} /> },
    { label: "Schedule",      to: "/org/schedule",  icon: <Calendar size={18} /> },
    { label: "Tasks",         to: "/org/tasks",     icon: <CheckSquare size={18} /> },
    { label: "Member Scores", to: "/org/scores",      icon: <Award size={18} /> },
    { label: "AI Filter",     to: "/org/candidates", icon: <Filter size={18} /> },
    { label: "Settings",      to: "/org/settings",   icon: <Settings size={18} /> },
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 h-full bg-white shadow-sm border-r border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto">
          {/* Sidebar brand */}
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center flex-shrink-0">
                <Building2 size={18} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Organization</p>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {menu.map((item) => {
              const active =
                pathname === item.to ||
                (pathname === "/org" && item.to === "/org/dashboard");

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all text-sm font-medium ${
                    active
                      ? "bg-blue-700 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-4 pb-6 border-t border-gray-100 pt-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2.5 rounded-lg transition w-full text-sm font-medium"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default OrgLayout;
