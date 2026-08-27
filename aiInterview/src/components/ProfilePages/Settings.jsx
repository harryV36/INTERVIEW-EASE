// Settings.jsx - Fixed header + sticky sub-nav, dark navy theme
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  User, Lock, Bell, Globe, Shield, Trash2, Save,
  Mail, Eye, EyeOff, LogOut, Phone, MapPin, Moon, Sun,
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

const Settings = () => {
  const navigate = useNavigate();
  const storedUser = getUserFromStorage();

  const [activeTab, setActiveTab] = useState("account");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [profile, setProfile] = useState({
    fullName: storedUser?.name || storedUser?.fullName || "",
    email: storedUser?.email || "",
    phone: "",
    location: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notifications, setNotifications] = useState({
    email: true,
    reminders: true,
    interviewTips: false,
    scoreUpdates: true,
    weeklyReport: false,
    marketingEmails: false,
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: "public",
    showEmail: false,
    showPhone: false,
    allowMessages: true,
  });

  const [preferences, setPreferences] = useState({
    darkMode: false,
    language: "en",
    timezone: "UTC",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get("http://localhost:8000/api/settings/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          const { user, profile: profileDoc, settings } = res.data;
          setProfile({
            fullName: profileDoc?.fullName || user?.name || "",
            email: user?.email || storedUser?.email || "",
            phone: profileDoc?.phone || "",
            location: profileDoc?.location || "",
          });
          if (settings) {
            setNotifications(settings.notifications || notifications);
            setPreferences({
              darkMode: settings.darkMode ?? false,
              language: settings.language || "en",
              timezone: settings.timezone || "UTC",
            });
          }
        }
      } catch {}
      const savedNotif = localStorage.getItem("notifications");
      const savedPrivacy = localStorage.getItem("privacy");
      const savedPrefs = localStorage.getItem("preferences");
      if (savedNotif) setNotifications(JSON.parse(savedNotif));
      if (savedPrivacy) setPrivacy(JSON.parse(savedPrivacy));
      if (savedPrefs) setPreferences((p) => ({ ...p, ...JSON.parse(savedPrefs) }));
    } catch {}
    finally { setLoading(false); }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put("http://localhost:8000/api/settings/profile",
        { fullName: profile.fullName, phone: profile.phone, location: profile.location },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const user = getUserFromStorage();
      if (user) { user.name = profile.fullName; user.fullName = profile.fullName; localStorage.setItem("user", JSON.stringify(user)); }
      showMsg("success", "Profile updated successfully!");
    } catch (err) {
      showMsg("error", err.response?.data?.msg || "Failed to update profile");
    } finally { setSavingProfile(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return showMsg("error", "Passwords don't match");
    if (passwordForm.newPassword.length < 6) return showMsg("error", "Password must be at least 6 characters");
    setSavingPassword(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put("http://localhost:8000/api/settings/password",
        { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showMsg("success", "Password changed successfully!");
    } catch (err) {
      showMsg("error", err.response?.data?.msg || "Failed to change password");
    } finally { setSavingPassword(false); }
  };

  const handleSaveNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put("http://localhost:8000/api/settings/preferences", { notifications }, { headers: { Authorization: `Bearer ${token}` } });
      localStorage.setItem("notifications", JSON.stringify(notifications));
      showMsg("success", "Notification settings saved!");
    } catch {
      localStorage.setItem("notifications", JSON.stringify(notifications));
      showMsg("success", "Saved locally!");
    }
  };

  const handleSavePrivacy = () => {
    localStorage.setItem("privacy", JSON.stringify(privacy));
    showMsg("success", "Privacy settings saved!");
  };

  const handleSavePreferences = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put("http://localhost:8000/api/settings/preferences",
        { darkMode: preferences.darkMode, language: preferences.language, timezone: preferences.timezone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.setItem("preferences", JSON.stringify(preferences));
      showMsg("success", "Preferences saved!");
    } catch {
      localStorage.setItem("preferences", JSON.stringify(preferences));
      showMsg("success", "Saved locally!");
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/home/login");
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Delete your account? This cannot be undone.")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete("http://localhost:8000/api/settings/account", { headers: { Authorization: `Bearer ${token}` } });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/home/login");
    } catch {
      showMsg("error", "Failed to delete account");
    }
  };

  const tabs = [
    { id: "account",       label: "Account",       icon: <User size={15} /> },
    { id: "security",      label: "Security",      icon: <Lock size={15} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={15} /> },
    { id: "privacy",       label: "Privacy",       icon: <Shield size={15} /> },
    { id: "preferences",   label: "Preferences",   icon: <Globe size={15} /> },
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* ─── STICKY HEADER + SUBNAV WRAPPER ─── */}
      <div className="sticky top-0 z-30 bg-gray-50">
        {/* Top Header */}
        <div className="max-w-3xl mx-auto px-6 md:px-10 pt-6 pb-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <Shield size={17} className="text-white" />
              </div>
              Settings
            </h1>
            <p className="text-xs text-gray-400 mt-1 ml-11">Manage your account and preferences</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl transition font-medium"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>

        {/* Message Banner */}
        {message.text && (
          <div className={`max-w-3xl mx-auto px-6 md:px-10 mb-2`}>
            <div className={`px-4 py-3 rounded-xl text-sm border ${
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}>
              {message.text}
            </div>
          </div>
        )}

        {/* Sub-navigation Tab Bar */}
        <div className="max-w-3xl mx-auto px-6 md:px-10 pb-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center overflow-x-auto">
              {tabs.map((tab, idx) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition border-b-2 ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-700 bg-blue-50"
                      : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  } ${idx === 0 ? "rounded-tl-2xl" : ""} ${idx === tabs.length - 1 ? "rounded-tr-2xl" : ""}`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── SCROLLABLE CONTENT ─── */}
      <div className="max-w-3xl mx-auto w-full px-6 md:px-10 py-5 flex-1">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {activeTab === "account" && (
            <AccountTab
              profile={profile}
              setProfile={setProfile}
              handleUpdate={handleUpdateProfile}
              loading={savingProfile}
            />
          )}
          {activeTab === "security" && (
            <SecurityTab
              passwordForm={passwordForm}
              setPasswordForm={setPasswordForm}
              handleChangePassword={handleChangePassword}
              loading={savingPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              handleDeleteAccount={handleDeleteAccount}
            />
          )}
          {activeTab === "notifications" && (
            <NotificationsTab
              notifications={notifications}
              setNotifications={setNotifications}
              handleSave={handleSaveNotifications}
            />
          )}
          {activeTab === "privacy" && (
            <PrivacyTab
              privacy={privacy}
              setPrivacy={setPrivacy}
              handleSave={handleSavePrivacy}
            />
          )}
          {activeTab === "preferences" && (
            <PreferencesTab
              preferences={preferences}
              setPreferences={setPreferences}
              handleSave={handleSavePreferences}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ============ TAB COMPONENTS ============

const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition";
const btnClass = "px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium text-sm transition";

const AccountTab = ({ profile, setProfile, handleUpdate, loading }) => (
  <div>
    <h2 className="text-sm font-semibold text-gray-700 mb-5 uppercase tracking-wide">Account Information</h2>
    <form onSubmit={handleUpdate} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
        <input
          type="text" required value={profile.fullName}
          onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
          className={inputClass}
          placeholder="Your full name"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
          <Mail size={14} /> Email Address
        </label>
        <input type="email" value={profile.email} disabled
          className={`${inputClass} cursor-not-allowed text-gray-400`} />
        <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
          <Phone size={14} /> Phone Number
        </label>
        <input type="tel" value={profile.phone}
          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
          className={inputClass} placeholder="+1 (555) 123-4567" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
          <MapPin size={14} /> Location
        </label>
        <input type="text" value={profile.location}
          onChange={(e) => setProfile({ ...profile, location: e.target.value })}
          className={inputClass} placeholder="City, Country" />
      </div>
      <button type="submit" disabled={loading} className={btnClass}>
        <Save size={15} /> {loading ? "Saving..." : "Save Changes"}
      </button>
    </form>
  </div>
);

const SecurityTab = ({ passwordForm, setPasswordForm, handleChangePassword, loading, showPassword, setShowPassword, handleDeleteAccount }) => (
  <div>
    <h2 className="text-sm font-semibold text-gray-700 mb-5 uppercase tracking-wide">Security Settings</h2>
    <form onSubmit={handleChangePassword} className="space-y-4 mb-8">
      {[
        { label: "Current Password", key: "currentPassword", showKey: "current" },
        { label: "New Password", key: "newPassword", showKey: "new" },
        { label: "Confirm New Password", key: "confirmPassword", showKey: "confirm" },
      ].map(({ label, key, showKey }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{label} *</label>
          <div className="relative">
            <input
              type={showPassword[showKey] ? "text" : "password"}
              required value={passwordForm[key]}
              onChange={(e) => setPasswordForm({ ...passwordForm, [key]: e.target.value })}
              className={`${inputClass} pr-10`}
            />
            <button type="button"
              onClick={() => setShowPassword({ ...showPassword, [showKey]: !showPassword[showKey] })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            >
              {showPassword[showKey] ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      ))}
      <button type="submit" disabled={loading} className={btnClass}>
        <Lock size={15} /> {loading ? "Changing..." : "Change Password"}
      </button>
    </form>

    <div className="border-t border-gray-100 pt-6">
      <h3 className="text-sm font-semibold text-red-600 mb-3 uppercase tracking-wide">Danger Zone</h3>
      <div className="bg-red-50 p-4 rounded-xl border border-red-100">
        <p className="text-sm text-gray-600 mb-3">Once deleted, your account and all data cannot be recovered.</p>
        <button onClick={handleDeleteAccount}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition">
          <Trash2 size={15} /> Delete My Account
        </button>
      </div>
    </div>
  </div>
);

const NotificationsTab = ({ notifications, setNotifications, handleSave }) => {
  const items = [
    { key: "email",          label: "Email Notifications",    desc: "Receive notifications via email" },
    { key: "reminders",      label: "Interview Reminders",    desc: "Get reminded about upcoming interviews" },
    { key: "interviewTips",  label: "AI Interview Tips",      desc: "Receive AI-powered interview tips" },
    { key: "scoreUpdates",   label: "Score Updates",          desc: "Notified when new scores are available" },
    { key: "weeklyReport",   label: "Weekly Report",          desc: "Receive weekly performance summary" },
    { key: "marketingEmails",label: "Marketing Emails",       desc: "Product updates and tips" },
  ];
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-700 mb-5 uppercase tracking-wide">Notification Preferences</h2>
      <div className="space-y-2 mb-5">
        {items.map(({ key, label, desc }) => (
          <Toggle key={key} label={label} description={desc}
            checked={notifications[key]}
            onChange={() => setNotifications({ ...notifications, [key]: !notifications[key] })}
          />
        ))}
      </div>
      <button onClick={handleSave} className={btnClass}><Save size={15} /> Save Preferences</button>
    </div>
  );
};

const PrivacyTab = ({ privacy, setPrivacy, handleSave }) => (
  <div>
    <h2 className="text-sm font-semibold text-gray-700 mb-5 uppercase tracking-wide">Privacy Settings</h2>
    <div className="space-y-4 mb-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Profile Visibility</label>
        <select value={privacy.profileVisibility}
          onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value })}
          className={inputClass}>
          <option value="public">Public — Anyone can see</option>
          <option value="private">Private — Only you</option>
          <option value="connections">Connections only</option>
        </select>
      </div>
      <Toggle label="Show Email" description="Display email on public profile"
        checked={privacy.showEmail} onChange={() => setPrivacy({ ...privacy, showEmail: !privacy.showEmail })} />
      <Toggle label="Show Phone" description="Display phone on public profile"
        checked={privacy.showPhone} onChange={() => setPrivacy({ ...privacy, showPhone: !privacy.showPhone })} />
      <Toggle label="Allow Messages" description="Let others send you messages"
        checked={privacy.allowMessages} onChange={() => setPrivacy({ ...privacy, allowMessages: !privacy.allowMessages })} />
    </div>
    <button onClick={handleSave} className={btnClass}><Save size={15} /> Save Settings</button>
  </div>
);

const PreferencesTab = ({ preferences, setPreferences, handleSave }) => (
  <div>
    <h2 className="text-sm font-semibold text-gray-700 mb-5 uppercase tracking-wide">General Preferences</h2>
    <div className="space-y-4 mb-5">
      <Toggle label="Dark Mode" description="Switch between light and dark themes"
        icon={preferences.darkMode ? <Moon size={16} /> : <Sun size={16} />}
        checked={preferences.darkMode} onChange={() => setPreferences({ ...preferences, darkMode: !preferences.darkMode })} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Language</label>
        <select value={preferences.language}
          onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
          className={inputClass}>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
        <select value={preferences.timezone}
          onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
          className={inputClass}>
          <option value="UTC">UTC</option>
          <option value="America/New_York">Eastern Time</option>
          <option value="America/Los_Angeles">Pacific Time</option>
          <option value="Europe/London">London</option>
          <option value="Asia/Kolkata">India (IST)</option>
        </select>
      </div>
    </div>
    <button onClick={handleSave} className={btnClass}><Save size={15} /> Save Preferences</button>
  </div>
);

const Toggle = ({ label, description, checked, onChange, icon }) => (
  <div className="flex items-center justify-between p-3.5 rounded-xl hover:bg-gray-50 transition group">
    <div className="flex items-center gap-3">
      {icon && <span className="text-blue-600">{icon}</span>}
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-400">{description}</p>}
      </div>
    </div>
    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 transition-all" />
      <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5 shadow" />
    </label>
  </div>
);

export default Settings;
