
// // models/InterviewSession.js
// import mongoose from "mongoose";

// const QuestionSchema = new mongoose.Schema(
//   {
//     type: {
//       type: String,
//       enum: ["mcq", "coding"],
//       required: true,
//     },
//     section: {
//       type: String, // e.g. "DSA", "System Design"
//     },
//     question: {
//       type: String,
//       required: true,
//     },
//     // For MCQs
//     options: [String],
//     correctAnswer: {
//       type: String, // store the correct option text OR "A"/"B"/"C"/"D"
//     },
//     // For analytics
//     difficulty: {
//       type: String,
//       enum: ["Easy", "Medium", "Hard"],
//       default: "Medium",
//     },
//     timestamp: {
//       type: Date,
//       default: Date.now,
//     },
//   },
//   { _id: true }
// );

// const interViewSessionSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//     resumeURL: {
//       type: String,
//     },
//     topics: [String],
//     transcript: {
//       type: String,
//     },

//     // NEW: richer question structure
//     generatedQuestions: [QuestionSchema],

//     // store the config used to generate this round (optional but useful)
//     config: {
//       targetJobRole: String,
//       targetCompany: String,
//       experienceLevel: String,
//       interviewType: [String],
//       duration: String,
//       numberOfQuestions: Number,
//       difficulty: String,
//       techStack: [String],
//       interviewFocus: [String],
//       preferredLanguage: String,
//       feedbackStyle: String,
//       customNotes: String,
//     },

//     score: {
//       type: Number,
//       default: 0,
//     },

//     // link to scorecard if created
//     scorecardId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Scorecard",
//     },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("InterviewSession", interViewSessionSchema);


// models/InterviewSession.js
import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["mcq", "coding", "behavioral", "technical"],
    required: true,
  },
  section: String,
  question: {
    type: String,
    required: true,
  },
  options: [String], // For MCQ
  correctAnswer: String, // For MCQ
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    default: "Medium",
  },
});

const interviewSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // 🆕 Reference to task if this is a task-based interview
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },

    topics: [String],
    
    generatedQuestions: [questionSchema],

    config: {
      targetJobRole: String,
      targetCompany: String,
      experienceLevel: String,
      interviewType: [String],
      duration: Number,
      numberOfQuestions: Number,
      difficulty: String,
      techStack: [String],
      interviewFocus: [String],
      preferredLanguage: String,
      feedbackStyle: String,
      customNotes: String,
    },

    score: Number,
    
    scorecardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scorecard",
    },

    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "abandoned"],
      default: "pending",
    },

    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

// Indexes
interviewSessionSchema.index({ user: 1, createdAt: -1 });
interviewSessionSchema.index({ taskId: 1 });
interviewSessionSchema.index({ status: 1 });

export default mongoose.model("InterviewSession", interviewSessionSchema);