// import User from "../models/User.js";
// import UserProfile from "../models/UserProfile.js"; // ✅ add this
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

// // Helper: generate token
// const generateToken = (user) => {
//   return jwt.sign(
//     { id: user._id, email: user.email },
//     process.env.JWT_SECRET,
//     { expiresIn: "7d" }
//   );
// };

// export const registerUser = async (req, res) => {
//   try {
//     const { fullName, email, password } = req.body;

//     if (!fullName || !email || !password) {
//       return res.status(400).json({ msg: "All fields required" });
//     }

//     const existingUser = await User.findOne({ email });
//     if (existingUser)
//       return res.status(400).json({ msg: "Email already exists" });

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = await User.create({
//       name: fullName,
//       email,
//       password: hashedPassword,
//     });

//     // Create token
//     const token = generateToken(newUser);

//     // Insert token in response header
//     res.header("Authorization", `Bearer ${token}`);

//     res.json({
//       msg: "User registered successfully",
//       token,
//       user: {
//         id: newUser._id,
//         fullName: newUser.name,
//         email: newUser.email,
//       },
//       hasProfile: false,     // ✅ new user, no profile yet
//     });
//   } catch (err) {
//     res.status(500).json({ msg: "Server error", error: err.message });
//   }
// };

// export const loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user)
//       return res.status(400).json({ msg: "User not found" });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch)
//       return res.status(400).json({ msg: "Incorrect password" });

//     // Generate token
//     const token = generateToken(user);

//     // 🔍 Check if profile already exists
//     const existingProfile = await UserProfile.findOne({ email: user.email });
//     const hasProfile = !!existingProfile;
//     console.log(hasProfile);

//     // Add token in header
//     res.header("Authorization", `Bearer ${token}`);

//     res.json({
//       msg: "Login successful",
//       token,
//       user: {
//         id: user._id,
//         fullName: user.name,
//         email: user.email,
//       },
//       hasProfile,           // ✅ frontend will use this to redirect
//       profile: existingProfile || null,
//     });
//   } catch (err) {
//     res.status(500).json({ msg: "Server error", error: err.message });
//   }
// };


import User from "../models/User.js";
import UserProfile from "../models/UserProfile.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendMail } from "../utils/mailer.js";

// Helper: generate token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, role, deviceId } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ msg: "All fields required" });
    }
    if (!deviceId) {
      return res.status(400).json({ msg: "Device validation failed. Please refresh and try again." });
    }

    // Validate role — only student or organization allowed on signup
    const allowedRoles = ["student", "organization"];
    const userRole = allowedRoles.includes(role) ? role : "student";
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser)
      return res.status(400).json({ msg: "Email already exists" });

    const existingDeviceUser = await User.findOne({ signupDeviceId: deviceId });
    if (existingDeviceUser) {
      return res.status(400).json({ msg: "Only one account can be created from this system." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: fullName,
      email: normalizedEmail,
      password: hashedPassword,
      role: userRole,
      signupDeviceId: deviceId,
      credits: 20,
    });

    const token = generateToken(newUser);
    res.header("Authorization", `Bearer ${token}`);

    res.json({
      msg: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        credits: newUser.credits,
      },
      hasProfile: false,
    });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.signupDeviceId) {
      return res.status(400).json({ msg: "Only one account can be created from this system." });
    }
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user)
      return res.status(400).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ msg: "Incorrect password" });

    // Generate token
    const token = generateToken(user);

    // 🔍 Check if profile already exists
    const existingProfile = await UserProfile.findOne({ email: user.email });
    const hasProfile = !!existingProfile;
    console.log("Has profile:", hasProfile);
    console.log("User role:", user.role); // ✅ Debug log

    // Add token in header
    res.header("Authorization", `Bearer ${token}`);

    res.json({
      msg: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "student",
        credits: user.credits ?? 0,
      },
      hasProfile,
      profile: existingProfile || null,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// ✅ NEW: Endpoint to update user role
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.json({ success: true, msg: "If that email exists, a reset link has been sent." });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/home/reset-password/${rawToken}`;
    await sendMail(
      user.email,
      "Reset your InterviewEase password",
      `Use this link to reset your password. It expires in 15 minutes:\n\n${resetUrl}`
    );

    res.json({ success: true, msg: "Password reset link sent to your email." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ msg: "Failed to send reset email", error: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ msg: "Token and new password are required" });
    if (password.length < 6) return res.status(400).json({ msg: "Password must be at least 6 characters" });

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ msg: "Reset link is invalid or expired" });

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ success: true, msg: "Password reset successful. Please login." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ msg: "Failed to reset password", error: err.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const userId = req.user.id;
    const { role } = req.body;

    // Validate role
    const validRoles = ["student", "organization", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ msg: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({
      success: true,
      msg: "Role updated successfully",
      user: {
        id: user._id,
        fullName: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Update role error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
