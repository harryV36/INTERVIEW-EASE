import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Mail,
  Phone,
  MapPin,
  User,
  Briefcase,
  Edit3,
  Linkedin,
  Github,
  Globe,
  Award,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const getUserFromStorage = () => {
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const storedUser = getUserFromStorage();
  const email = storedUser?.email;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) {
      setLoading(false);
      navigate("/home/login");
      return;
    }
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:8000/api/profile/${encodeURIComponent(email)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          setProfile(res.data.profile);
        } else {
          navigate("/profile/create", { replace: true });
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        if (err.response?.status === 404) navigate("/profile/create", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [email, navigate]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <h1 className="text-lg font-semibold text-gray-600">Redirecting...</h1>
        <p className="mt-2 text-gray-400 text-sm">Please wait...</p>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-full bg-gray-50">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-5">
            <img
              src="https://i.pravatar.cc/120"
              alt="Profile"
              className="w-20 h-20 rounded-full border-2 border-gray-100 object-cover flex-shrink-0"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">{profile.fullName}</h1>
              <p className="text-gray-500 text-sm mt-0.5">{profile.role}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Mail size={13} /> {profile.email}
                </span>
                {profile.phone && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Phone size={13} /> {profile.phone}
                  </span>
                )}
                {profile.location && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <MapPin size={13} /> {profile.location}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate("/profile/create")}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition text-sm font-medium shadow-sm flex-shrink-0"
          >
            <Edit3 size={15} /> Edit Profile
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid md:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="space-y-5">
          {/* About */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <User size={15} className="text-blue-600" /> About Me
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">{profile.bio || "No bio added yet."}</p>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Award size={15} className="text-blue-600" /> Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills?.length > 0 ? (
                profile.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No skills added.</p>
              )}
            </div>
          </div>

          {/* Social */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Globe size={15} className="text-blue-600" /> Social Links
            </h2>
            <div className="space-y-2.5">
              {profile.socials?.linkedin ? (
                <a
                  href={profile.socials.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-blue-600 transition"
                >
                  <Linkedin size={16} className="text-blue-700" /> LinkedIn
                </a>
              ) : null}
              {profile.socials?.github ? (
                <a
                  href={profile.socials.github}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-blue-600 transition"
                >
                  <Github size={16} className="text-gray-900" /> GitHub
                </a>
              ) : null}
              {profile.socials?.portfolio ? (
                <a
                  href={profile.socials.portfolio}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-blue-600 transition"
                >
                  <Globe size={16} className="text-green-600" /> Portfolio
                </a>
              ) : null}
              {!profile.socials?.linkedin && !profile.socials?.github && !profile.socials?.portfolio && (
                <p className="text-gray-400 text-sm">No links added.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Briefcase size={15} className="text-blue-600" /> Experience
            </h2>
            {profile.experience?.length > 0 ? (
              <div className="space-y-4">
                {profile.experience.map((exp, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-blue-50/30 hover:border-blue-100 transition"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800 text-sm">{exp.title}</h3>
                      <span className="text-xs text-gray-400 flex-shrink-0">{exp.year}</span>
                    </div>
                    <p className="text-blue-600 text-xs font-medium mb-1.5">{exp.company}</p>
                    <p className="text-gray-500 text-xs leading-relaxed">{exp.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Briefcase size={36} className="mx-auto mb-3 text-gray-200" />
                <p className="text-gray-400 text-sm">No experience added yet.</p>
                <button
                  onClick={() => navigate("/profile/create")}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium"
                >
                  Add Experience
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
