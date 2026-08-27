import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Building2, CheckCircle2, AlertCircle } from "lucide-react";

const CreateOrgPage = () => {
  const navigate = useNavigate();

  const getUserFromStorage = () => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  };

  const storedUser = getUserFromStorage();

  const [formData, setFormData] = useState({
    name: "",
    email: storedUser?.email || "",
    description: "",
    website: "",
    industry: "",
    size: "",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (storedUser?.name) {
      setFormData((prev) => ({ ...prev, name: `${storedUser.name}'s Organization` }));
    }
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(""); // clear error on change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Frontend validation
    if (!formData.name.trim()) return setError("Organization name is required.");
    if (!formData.email.trim()) return setError("Email is required.");

    try {
      setCreating(true);
      const token = localStorage.getItem("token");

      const res = await axios.post(
        "http://localhost:8000/api/organization/create",
        {
          name: formData.name.trim(),
          email: formData.email.trim(),
          description: formData.description.trim(),
          website: formData.website.trim() || undefined,
          industry: formData.industry.trim() || undefined,
          size: formData.size || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setSuccess("Organization created successfully! Redirecting...");

        // Update user role in localStorage
        try {
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          user.role = "organization";
          localStorage.setItem("user", JSON.stringify(user));
        } catch {}

        setTimeout(() => navigate("/org/dashboard"), 1500);
      }
    } catch (err) {
      const msg = err.response?.data?.msg || "Failed to create organization. Please try again.";
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Organization</h1>
          <p className="text-gray-500 text-sm mt-1">Set up your organization to manage team interviews</p>
        </div>

        {/* Status messages */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-5">
            <AlertCircle size={15} className="flex-shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-5">
            <CheckCircle2 size={15} className="flex-shrink-0" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Organization Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Organization Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
              placeholder="e.g., Tech Corp"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Organization Email <span className="text-red-500">*</span></label>
            <input
              type="email"
              required
              value={formData.email}
              readOnly
              className="w-full px-4 py-2.5 border border-gray-100 rounded-xl bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Using your account email</p>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
              rows="3"
              placeholder="Brief description of your organization"
            />
          </div>

          {/* Website + Industry */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Website</label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => handleChange("website", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
                placeholder="https://company.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Industry</label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => handleChange("industry", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
                placeholder="e.g., Technology"
              />
            </div>
          </div>

          {/* Company Size */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Company Size</label>
            <select
              value={formData.size}
              onChange={(e) => handleChange("size", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition bg-white"
            >
              <option value="">Select size (optional)</option>
              <option value="1-10">1–10 employees</option>
              <option value="11-50">11–50 employees</option>
              <option value="51-200">51–200 employees</option>
              <option value="201-500">201–500 employees</option>
              <option value="500+">500+ employees</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full py-3 bg-blue-700 text-white rounded-xl font-semibold hover:bg-blue-800 disabled:opacity-50 transition text-sm"
          >
            {creating ? "Creating..." : "Create Organization"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateOrgPage;