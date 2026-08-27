import React, { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, Users, Calendar, ArrowRight, UserPlus,
  ChevronRight, BarChart2, UserCheck, Briefcase, Bell,
  TrendingUp, Sparkles,
} from "lucide-react";
import axios from "axios";
import Dropdown from "../Utils/StartButtonDropdown";
import mainimg from "../../assets/mainimg.png";
import Footer from "./Footer";

// Lazy-load heavy sections
const AISoftwareSection   = lazy(() => import("../Utils/AISoftwareSection"));
const KeyBenefits         = lazy(() => import("./KeyBenefits"));
const ReviewCarousel      = lazy(() => import("../Utils/ReviewCarousel"));
const HiringAssistantDetails = lazy(() => import("./HiringAssistantDetails"));

const LazySection = ({ children }) => (
  <Suspense fallback={
    <div className="h-32 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
    </div>
  }>
    {children}
  </Suspense>
);

/* ─────────────────────────────────────────────────────────
   ORG-SPECIFIC HERO  (shown when logged in as organization)
───────────────────────────────────────────────────────── */
const OrgHero = ({ navigate }) => {
  return (
    <div className="bg-white">
      {/* Hero section — matches the public landing layout */}
      <section className="bg-white pt-10 pb-8 md:pt-14 md:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">

            {/* LEFT */}
            <div className="md:w-6/12 lg:w-5/12 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full mb-5">
                <Sparkles size={13} className="text-blue-700" />
                <span className="text-xs font-semibold text-blue-700">AI-Powered Interview Platform</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
                Interview Smarter with{" "}
                <span className="text-blue-700">Deep AI Insights</span>
              </h1>

              <p className="text-base text-gray-500 mb-8 max-w-lg mx-auto md:mx-0 leading-relaxed">
                Eliminate bias and hire top performers faster with our AI-powered video interview platform. Get unbiased scores and instant feedback.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <button
                  onClick={() => navigate("/org/dashboard")}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-full shadow-md transition text-sm"
                >
                  Go to Dashboard <ChevronRight size={15} />
                </button>
                <button
                  onClick={() => navigate("/org/members")}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 border border-gray-200 text-gray-700 font-semibold rounded-full hover:bg-gray-50 transition text-sm"
                >
                  Manage Members <ArrowRight size={15} />
                </button>
              </div>
            </div>

            {/* RIGHT — hero image */}
            <div className="md:w-6/12 lg:w-7/12 w-full mt-8 md:mt-0 flex justify-center relative">
              <img
                src={mainimg}
                alt="AI Interview Platform"
                className="rounded-2xl w-full max-w-[330px] sm:max-w-[390px] md:max-w-[440px] lg:max-w-[480px] max-h-[320px] sm:max-h-[360px] md:max-h-[400px] lg:max-h-[440px] object-contain"
                loading="eager"
                decoding="async"
              />
            </div>

          </div>
        </div>
      </section>

      {/* Lazy-loaded sections */}
      <section id="about" className="scroll-mt-24">
        <LazySection><AISoftwareSection /></LazySection>
      </section>
      <section className="py-14 md:py-16 bg-gray-50 scroll-mt-24" id="hiring">
        <LazySection><HiringAssistantDetails /></LazySection>
      </section>
      <section className="py-8 md:py-10 scroll-mt-24" id="features">
        <LazySection>
          <KeyBenefits />
          <ReviewCarousel />
        </LazySection>
      </section>

      <section id="contact" className="scroll-mt-24">
        <Footer />
      </section>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   STUDENT / PUBLIC HERO
───────────────────────────────────────────────────────── */
const HeroSection = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole]   = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const check = async () => {
      const token = localStorage.getItem("token");
      const user  = localStorage.getItem("user");
      if (token && user) {
        setIsLoggedIn(true);
        try {
          const userData = JSON.parse(user);
          const role = userData.role || "student";
          setUserRole(role);
          if (role === "student") {
            try {
              const res = await axios.get(
                `http://localhost:8000/api/profile/${encodeURIComponent(userData.email)}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              setHasProfile(res.data?.success && !!res.data?.profile);
            } catch { setHasProfile(false); }
          } else {
            setHasProfile(true);
          }
        } catch {}
      }
      setLoading(false);
    };
    check();
  }, []);

  // ── Route org users to the dedicated org hero ──
  if (!loading && isLoggedIn && userRole === "organization") {
    return <OrgHero navigate={navigate} />;
  }

  const handleDashboardClick = () => {
    if (userRole === "admin")         navigate("/admin/dashboard");
    else if (userRole === "student")  navigate(hasProfile ? "/profile" : "/profile/create");
  };

  const renderCTA = () => {
    if (loading) return <div className="mt-6 h-[72px]" />;

    if (isLoggedIn && userRole === "admin") {
      return (
        <div className="mt-6 flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <Building2 size={18} className="text-blue-700 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Admin Dashboard</p>
            <p className="text-xs text-gray-500">Manage the platform from your admin panel.</p>
          </div>
          <button onClick={handleDashboardClick}
            className="flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800 flex-shrink-0">
            Go <ChevronRight size={14} />
          </button>
        </div>
      );
    }

    if (isLoggedIn && userRole === "student") {
      return (
        <div className="mt-6 flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
          {hasProfile
            ? <Users size={18} className="text-blue-700 flex-shrink-0" />
            : <UserPlus size={18} className="text-blue-700 flex-shrink-0" />
          }
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {hasProfile ? "Ready to practice?" : "Complete your profile"}
            </p>
            <p className="text-xs text-gray-500">
              {hasProfile ? "Track your progress and improve." : "Set up your profile to start."}
            </p>
          </div>
          <button onClick={handleDashboardClick}
            className="flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800 flex-shrink-0">
            {hasProfile ? "Dashboard" : "Create Profile"} <ChevronRight size={14} />
          </button>
        </div>
      );
    }

    // Not logged in — show org teaser
    return (
      <div className="mt-6 flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
        <Building2 size={18} className="text-blue-700 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">For Organizations</p>
          <p className="text-xs text-gray-500">Manage interviews and track team performance.</p>
        </div>
        <button onClick={() => navigate("/home/signup")}
          className="flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800 flex-shrink-0">
          Sign Up <ChevronRight size={14} />
        </button>
      </div>
    );
  };

  return (
    <div className="bg-white">
      {/* ── STUDENT / PUBLIC HERO ── */}
      <section className="bg-white pt-10 pb-8 md:pt-14 md:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">

            {/* LEFT */}
            <div className="md:w-6/12 lg:w-5/12 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full mb-5">
                <Sparkles size={13} className="text-blue-700" />
                <span className="text-xs font-semibold text-blue-700">AI-Powered Interview Platform</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
                Interview Smarter with{" "}
                <span className="text-blue-700">Deep AI Insights</span>
              </h1>

              <p className="text-base text-gray-500 mb-8 max-w-lg mx-auto md:mx-0 leading-relaxed">
                Eliminate bias and hire top performers faster with our AI-powered video interview platform. Get unbiased scores and instant feedback.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Dropdown style="inline-flex items-center gap-2 px-8 py-3 bg-blue-700 text-white font-semibold rounded-full shadow-md hover:bg-blue-800 transition text-sm" />
                <button
                  onClick={() => navigate("/home/signup")}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 border border-gray-200 text-gray-700 font-semibold rounded-full hover:bg-gray-50 transition text-sm"
                >
                  Get Started Free <ArrowRight size={15} />
                </button>
              </div>

              {renderCTA()}
            </div>

            {/* RIGHT — hero image */}
            <div className="md:w-6/12 lg:w-7/12 w-full mt-8 md:mt-0 flex justify-center relative">
              <img
                src={mainimg}
                alt="AI Interview Platform"
                className="rounded-2xl w-full max-w-[330px] sm:max-w-[390px] md:max-w-[440px] lg:max-w-[480px] max-h-[320px] sm:max-h-[360px] md:max-h-[400px] lg:max-h-[440px] object-contain"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Org features teaser — only for non-org logged-in or logged-out users */}
      {!isLoggedIn && (
        <section className="py-14 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Built for Teams & Organizations</h2>
              <p className="text-gray-500 text-sm max-w-xl mx-auto">
                Comprehensive tools to manage your team's interview process from start to finish.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { icon: <Users size={22} className="text-blue-700" />, title: "Team Management", desc: "Invite members, track performance, and manage roles with ease." },
                { icon: <Calendar size={22} className="text-blue-700" />, title: "Smart Scheduling", desc: "Schedule interviews with automatic notifications and reminders." },
                { icon: <Building2 size={22} className="text-blue-700" />, title: "Analytics", desc: "Track performance with detailed metrics and insights." },
              ].map(({ icon, title, desc }) => (
                <div key={title}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">{icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lazy-loaded sections */}
      <section id="about" className="scroll-mt-24">
        <LazySection><AISoftwareSection /></LazySection>
      </section>
      <section className="py-14 md:py-16 bg-gray-50 scroll-mt-24" id="hiring">
        <LazySection><HiringAssistantDetails /></LazySection>
      </section>
      <section className="py-8 md:py-10 scroll-mt-24" id="features">
        <LazySection>
          <KeyBenefits />
          <ReviewCarousel />
        </LazySection>
      </section>

      <section id="contact" className="scroll-mt-24">
        <Footer />
      </section>
    </div>
  );
};

export default HeroSection;