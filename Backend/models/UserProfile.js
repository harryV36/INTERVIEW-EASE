// models/UserProfile.js
import mongoose from "mongoose";

const experienceSchema = new mongoose.Schema({
  company: { type: String, required: true },
  title: { type: String, required: true },
  year: { type: String, required: true },
  description: { type: String, required: true },
});

const socialLinksSchema = new mongoose.Schema({
  github: { type: String },
  linkedin: { type: String },
  portfolio: { type: String },
});

const userProfileSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },

    phone: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
    },

    skills: {
      type: [String],
      default: [],
    },

    experience: {
      type: [experienceSchema],
      default: [],
    },

    socials: {
      type: socialLinksSchema,
      default: {},
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    // ✅ NEW: settings/preferences
    notificationPrefs: {
      email: { type: Boolean, default: true },
      reminders: { type: Boolean, default: true },
      interviewTips: { type: Boolean, default: false },
    },

    theme: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },

    // ✅ Academic / Education fields
    college: { type: String, default: "" },
    graduationYear: { type: String, default: "" },
    marks10th: { type: Number, default: null },
    board10th: { type: String, default: "" },
    marks12th: { type: Number, default: null },
    board12th: { type: String, default: "" },
  },
  { timestamps: true }
);

const UserProfile = mongoose.model("UserProfile", userProfileSchema);

export default UserProfile;
