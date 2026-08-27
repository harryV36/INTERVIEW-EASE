// controllers/settingsController.js
import User from "../models/User.js";
import UserProfile from "../models/UserProfile.js";
import InterviewSession from "../models/InterviewSession.js";
import bcrypt from "bcryptjs";

// GET /api/settings/me
export const getSettings = async (req, res) => {
    console.log("IN /api/settings/me, req.user =", req.user);

  try {
    // 👇 comes from authMiddleware
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, msg: "Unauthorized: no user id" });
    }

    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    // Find profile by email (your UserProfile uses `email` as unique)
    const profile = await UserProfile.findOne({ email: user.email }).lean();

    const notifications =
      profile?.notificationPrefs || {
        email: true,
        reminders: true,
        interviewTips: false,
      };

    const darkMode = profile?.theme === "dark";

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      profile: profile || null,
      settings: {
        notifications,
        darkMode,
      },
    });
  } catch (err) {
    console.error("getSettings error:", err);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
};

// PUT /api/settings/profile
export const updateProfileSettings = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, msg: "Unauthorized" });
    }

    const { fullName, phone, location } = req.body;

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, msg: "User not found" });

    if (fullName) {
      user.name = fullName;
      await user.save();
    }

    const updatedProfile = await UserProfile.findOneAndUpdate(
      { email: user.email },
      {
        $set: {
          fullName: fullName || user.name,
          phone: phone ?? "",
          location: location ?? "",
        },
      },
      { new: true, upsert: true }
    );

    return res.json({
      success: true,
      msg: "Profile updated",
      profile: updatedProfile,
    });
  } catch (err) {
    console.error("updateProfileSettings error:", err);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
};

// PUT /api/settings/password
export const updatePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, msg: "Unauthorized" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ success: false, msg: "Current and new password required" });
    }

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, msg: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, msg: "Current password is incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    return res.json({ success: true, msg: "Password updated successfully" });
  } catch (err) {
    console.error("updatePassword error:", err);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
};

// PUT /api/settings/preferences
export const updatePreferences = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, msg: "Unauthorized" });
    }

    const { darkMode, notifications } = req.body;

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, msg: "User not found" });

    const profile = await UserProfile.findOneAndUpdate(
      { email: user.email },
      {
        $set: {
          theme: darkMode ? "dark" : "light",
          notificationPrefs: {
            email: notifications?.email ?? true,
            reminders: notifications?.reminders ?? true,
            interviewTips: notifications?.interviewTips ?? false,
          },
        },
      },
      { new: true, upsert: true }
    );

    return res.json({
      success: true,
      msg: "Preferences updated",
      settings: {
        notifications: profile.notificationPrefs,
        darkMode: profile.theme === "dark",
      },
    });
  } catch (err) {
    console.error("updatePreferences error:", err);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
};

// DELETE /api/settings/account
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, msg: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, msg: "User not found" });

    await UserProfile.deleteOne({ email: user.email });
    await InterviewSession.deleteMany({ user: userId });
    await User.deleteOne({ _id: userId });

    return res.json({ success: true, msg: "Account deleted successfully" });
  } catch (err) {
    console.error("deleteAccount error:", err);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
};
