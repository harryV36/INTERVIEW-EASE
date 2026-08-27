import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import mainlogo from "../../assets/mainlogo.png";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await axios.post("http://localhost:8000/api/auth/reset-password", {
        token,
        password,
      });
      setMessage(res.data.msg || "Password reset successful. Please login.");
      setTimeout(() => navigate("/home/login", { replace: true }), 1000);
    } catch (error) {
      setMessage(error.response?.data?.msg || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-md border border-blue-100">
            <img src={mainlogo} alt="Logo" className="w-5 h-5 object-contain" />
          </div>
          <span className="text-[18px] font-bold tracking-tight text-slate-900">
            Interview<span className="text-blue-600">ease</span>
          </span>
        </Link>

        <h1 className="text-[28px] font-bold text-[#0a1628]">Reset password</h1>
        <p className="text-sm text-gray-500 mt-1.5 mb-7">
          Choose a new password for your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              New password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm bg-gray-50 focus:bg-white"
                placeholder="Enter new password"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0a1628] text-white py-3 rounded-xl font-semibold shadow-md hover:bg-[#112240] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {loading ? "Resetting..." : "Reset password"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {message && (
          <p className={`text-center text-sm mt-4 font-medium ${
            message.toLowerCase().includes("successful") ? "text-green-600" : "text-red-500"
          }`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
