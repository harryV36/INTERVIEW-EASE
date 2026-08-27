
// models/ScheduledInterview.js
import mongoose from "mongoose";

const scheduledInterviewSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    scheduledDate: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      default: 45, // in minutes
    },
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "cancelled", "missed"],
      default: "scheduled",
    },
    interviewConfig: {
      targetJobRole: String,
      targetCompany: String,
      experienceLevel: String,
      interviewType: [String],
      numberOfQuestions: Number,
      difficulty: String,
      techStack: [String],
      interviewFocus: [String],
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewSession",
    },
    scorecardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scorecard",
    },
    meetingLink: String,
    joinToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    notes: String,
  },
  { timestamps: true }
);

scheduledInterviewSchema.index({ organizationId: 1, assignedTo: 1 });
scheduledInterviewSchema.index({ scheduledDate: 1 });
scheduledInterviewSchema.index({ status: 1 });

export default mongoose.model("ScheduledInterview", scheduledInterviewSchema);
