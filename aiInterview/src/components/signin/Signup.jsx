import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, User, Eye, EyeOff, ArrowRight, BrainCircuit } from "lucide-react";
import mainlogo from "../../assets/mainlogo.png";
import { getDeviceId } from "../../utils/deviceId";

const Signup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState("student");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://localhost:8000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          password,
          role: accountType,
          deviceId: getDeviceId(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.msg || "Signup failed");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setMessage("Signup successful!");
      setFullName("");
      setEmail("");
      setPassword("");

      // Use role from API response (ground truth from DB)
      const savedRole = data.user?.role || accountType;

      setTimeout(() => {
        if (savedRole === "organization") {
          navigate("/org/create"); // Org users set up their org first
        } else {
          navigate(data.hasProfile ? "/profile" : "/profile/create");
        }
      }, 500);
    } catch (error) {
      console.error(error);
      setMessage("Server error. Please try again.");
      setLoading(false);
    }
  };

  const isOrg = accountType === "organization";

  return (
    <div className="w-full h-screen flex bg-white overflow-hidden">
      {/* ── LEFT IMAGE PANEL ── */}
      <div className="hidden md:flex w-[38%] h-full relative flex-shrink-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200"
          alt="signup illustration"
          className="object-cover w-full h-full"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628]/80 via-[#0a1628]/55 to-[#0a1628]/30" />

        {/* Logo on image — links to landing page (/) */}
        <div className="absolute top-8 left-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/25 group-hover:bg-white/25 transition">
              <img
                src={mainlogo}
                alt="Logo"
                className="w-5 h-5 object-contain brightness-0 invert"
              />
            </div>
            <span className="text-white font-bold text-base tracking-tight drop-shadow-sm">
              Interview<span className="text-blue-300">ease</span>
            </span>
          </Link>
        </div>

        {/* Bottom stats card */}
        <div className="absolute bottom-10 left-6 right-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <BrainCircuit size={16} className="text-blue-300" />
              <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Trusted by thousands</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-2xl font-bold text-white">10k+</p>
                <p className="text-[11px] text-white/60 mt-0.5">Users Prepared</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">94%</p>
                <p className="text-[11px] text-white/60 mt-0.5">Success Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM ── */}
      <div className="w-full md:w-[62%] h-full flex items-center justify-center px-8 md:px-14 overflow-y-auto">
        <div className="w-full max-w-md py-8">

          {/* Logo for mobile only — links to landing page (/) */}
          <Link to="/" className="inline-flex items-center gap-2.5 mb-7 md:hidden group">
            <div className="w-8 h-8 bg-[#0a1628] rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <img
                src={mainlogo}
                alt="Logo"
                className="w-5 h-5 object-contain brightness-0 invert"
              />
            </div>
            <span className="text-[17px] font-bold tracking-tight text-slate-900">
              Interview<span className="text-blue-600">ease</span>
            </span>
          </Link>

          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-[28px] font-bold text-[#0a1628] leading-tight">
              Create your account
            </h2>
            <p className="text-sm text-gray-500 mt-1.5">
              Join Interview Ease and start your journey.
            </p>
          </div>

          {/* Account Type Selection */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I am signing up as:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                type="button"
                onClick={() => setAccountType("student")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-3.5 rounded-xl border-2 transition flex flex-col items-center gap-1.5 ${
                  accountType === "student"
                    ? "border-[#0a1628] bg-[#0a1628]/5"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <User
                  size={20}
                  className={accountType === "student" ? "text-[#0a1628]" : "text-gray-400"}
                />
                <p className={`font-semibold text-xs ${accountType === "student" ? "text-[#0a1628]" : "text-gray-600"}`}>
                  Individual / Student
                </p>
              </motion.button>

              <motion.button
                type="button"
                onClick={() => setAccountType("organization")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-3.5 rounded-xl border-2 transition flex flex-col items-center gap-1.5 ${
                  accountType === "organization"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <Building2
                  size={20}
                  className={accountType === "organization" ? "text-blue-600" : "text-gray-400"}
                />
                <p className={`font-semibold text-xs ${accountType === "organization" ? "text-blue-600" : "text-gray-600"}`}>
                  Organization
                </p>
              </motion.button>
            </div>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-4" onSubmit={handleSignup}>
            <div>
              <label className="text-sm text-gray-700 font-medium">
                {isOrg ? "Organization Name" : "Full Name"} *
              </label>
              <input
                type="text"
                placeholder={isOrg ? "Your Organization Name" : "Your Full Name"}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1.5 w-full border border-gray-200 rounded-xl py-3 px-4 text-sm text-gray-700 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0a1628] focus:border-transparent outline-none transition"
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-700 font-medium">Email Address *</label>
              <input
                type="email"
                placeholder={isOrg ? "organization@company.com" : "you@example.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full border border-gray-200 rounded-xl py-3 px-4 text-sm text-gray-700 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0a1628] focus:border-transparent outline-none transition"
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-700 font-medium">Password *</label>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl py-3 px-4 pr-11 text-sm text-gray-700 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0a1628] focus:border-transparent outline-none transition"
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
              className="w-full py-3 rounded-xl font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-1 bg-[#0a1628] hover:bg-[#112240] text-white"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  {isOrg ? "Create Organization Account" : "Create Account"}
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          {message && (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-center mt-3 text-sm font-medium ${
                message.includes("success") ? "text-green-600" : "text-red-500"
              }`}
            >
              {message}
            </motion.p>
          )}

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{" "}
            <Link to="/home/login" className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
