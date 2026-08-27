import React, { useState } from "react";
import { motion } from "framer-motion";
import mainlogo from "../../assets/mainlogo.png";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, BrainCircuit, CheckCircle2 } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("http://localhost:8000/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setMessage("Login Successful!");

      const userRole = res.data.user?.role;

      setTimeout(() => {
        if (userRole === "organization") {
          navigate("/org/dashboard", { replace: true });
        } else if (userRole === "admin") {
          navigate("/admin/dashboard", { replace: true });
        } else {
          if (!res.data.hasProfile) {
            navigate("/profile/create", { replace: true });
          } else {
            navigate("/profile", { replace: true });
          }
        }
      }, 500);
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.msg || "Login failed");
      } else {
        setMessage("Server error. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const resetEmail = email.trim() || window.prompt("Enter your registered email address");
    if (!resetEmail) return;

    setForgotLoading(true);
    setForgotMessage("");
    try {
      const res = await axios.post("http://localhost:8000/api/auth/forgot-password", {
        email: resetEmail,
      });
      setForgotMessage(res.data.msg || "Password reset link sent to your email.");
    } catch (error) {
      setForgotMessage(error.response?.data?.msg || "Failed to send reset link.");
    } finally {
      setForgotLoading(false);
    }
  };

  const features = [
    "AI-powered mock interviews",
    "Real-time feedback & scoring",
    "Track your progress over time",
    "Thousands of interview questions",
  ];

  return (
    <div className="w-full h-screen flex bg-white overflow-hidden">
      {/* ── LEFT FORM ── */}
      <div className="w-full md:w-[55%] h-full flex items-center justify-center px-8 md:px-14">
        <div className="w-full max-w-md">

          {/* Logo — links to landing page (/) */}
          <Link to="/" className="inline-flex items-center gap-2.5 mb-8 group">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200 border border-blue-100">
              <img src={mainlogo} alt="Logo" className="w-5 h-5 object-contain" />
            </div>
            <span className="text-[18px] font-bold tracking-tight text-slate-900">
              Interview<span className="text-blue-600">ease</span>
            </span>
          </Link>

          {/* Heading */}
          <div className="mb-7">
            <h2 className="text-[28px] font-bold text-[#0a1628] leading-tight">
              Welcome back
            </h2>
            <p className="text-sm text-gray-500 mt-1.5">
              Sign in to continue your interview prep journey.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm bg-gray-50 focus:bg-white"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={forgotLoading}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline transition disabled:opacity-60"
                >
                  {forgotLoading ? "Sending..." : "Forgot password?"}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm bg-gray-50 focus:bg-white"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              type="submit"
              disabled={loading}
              className="w-full bg-[#0a1628] text-white py-3 rounded-xl font-semibold shadow-md hover:bg-[#112240] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-1"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          {message && (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-center text-sm mt-3 font-medium ${
                message.includes("Success") ? "text-green-600" : "text-red-500"
              }`}
            >
              {message}
            </motion.p>
          )}

          {forgotMessage && (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-center text-sm mt-3 font-medium ${
                forgotMessage.toLowerCase().includes("failed") ? "text-red-500" : "text-green-600"
              }`}
            >
              {forgotMessage}
            </motion.p>
          )}

          {/* Divider */}
          <div className="flex items-center my-5">
            <span className="flex-grow h-px bg-gray-200" />
            <span className="px-3 text-gray-400 text-xs font-medium">OR CONTINUE WITH</span>
            <span className="flex-grow h-px bg-gray-200" />
          </div>

          {/* Social */}
          <div className="grid grid-cols-2 gap-3">
            <button className="border border-gray-200 rounded-xl py-2.5 flex items-center justify-center gap-2.5 hover:bg-gray-50 hover:border-gray-300 transition text-sm text-gray-700 font-medium">
              <img src="https://img.icons8.com/color/48/google-logo.png" className="w-4 h-4" alt="Google" />
              Google
            </button>
            <button className="border border-gray-200 rounded-xl py-2.5 flex items-center justify-center gap-2.5 hover:bg-gray-50 hover:border-gray-300 transition text-sm text-gray-700 font-medium">
              <img src="https://img.icons8.com/color/48/microsoft.png" className="w-4 h-4" alt="Microsoft" />
              Microsoft
            </button>
          </div>

          <p className="text-center text-gray-500 text-sm mt-6">
            Don't have an account?{" "}
            <Link to="/home/signup" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition">
              Sign up free
            </Link>
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL — clean dark navy with features ── */}
      <div className="hidden md:flex w-[45%] h-full flex-shrink-0 bg-[#0a1628] flex-col justify-between px-12 py-12">
        {/* Top branding */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
            <img src={mainlogo} alt="Logo" className="w-5 h-5 object-contain brightness-0 invert" />
          </div>
          <span className="text-white font-bold text-base tracking-tight">
            Interview<span className="text-blue-400">ease</span>
          </span>
        </div>

        {/* Center content */}
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-3 py-1.5 mb-6">
            <BrainCircuit size={14} className="text-blue-300" />
            <span className="text-blue-200 text-xs font-semibold tracking-wide">AI-POWERED INTERVIEWS</span>
          </div>

          <h3 className="text-3xl font-bold text-white leading-snug mb-3">
            Ace your next<br />
            interview with AI
          </h3>
          <p className="text-white/60 text-sm leading-relaxed mb-8">
            Practice with real questions, get instant AI feedback,<br />
            and track your improvement over time.
          </p>

          {/* Feature list */}
          <div className="space-y-3.5">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={12} className="text-blue-300" />
                </div>
                <span className="text-white/80 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stat cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-2xl font-bold text-white">10k+</p>
            <p className="text-xs text-white/50 mt-1">Users Prepared</p>
          </div> */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-2xl font-bold text-white">94%</p>
            <p className="text-xs text-white/50 mt-1">Success Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
