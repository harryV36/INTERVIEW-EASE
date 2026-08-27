// models/Scorecard.js
import mongoose from "mongoose";
const { Schema } = mongoose;

/* -------------------------------------------------------------------
   SUB-SCHEMA: VIOLATION TRACKING
------------------------------------------------------------------- */
const ViolationSchema = new Schema(
  {
    type: { type: String, enum: ["no_face", "unknown_face", "multiple_faces"], required: true },
    severity: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    timestamp: { type: Date, default: Date.now },
    message: { type: String, default: "" },
    violation_count: { type: Number, default: 0 },
  },
  { _id: false }
);

/* -------------------------------------------------------------------
   SUB-SCHEMA: MAIN SCORE METRICS (same metrics used on the UI)
------------------------------------------------------------------- */
const ScoresSchema = new Schema(
  {
    overallScore: { type: Number, required: true, default: 0 }, // 0–100

    fluency: { type: Number, required: true, default: 0 }, // /10
    confidence: { type: Number, required: true, default: 0 }, // /10
    technicalAccuracy: { type: Number, required: true, default: 0 }, // /10
    keywordUsage: { type: Number, required: true, default: 0 }, // /10

    aiVideoScore: { type: Number, default: 0 },
    consistencyScore: { type: Number, default: 0 },
  },
  { _id: false }
);

/* -------------------------------------------------------------------
   SUB-SCHEMA: EXTRA DIMENSIONS
------------------------------------------------------------------- */
const ExtraDimensionsSchema = new Schema(
  {
    depth: { type: Number, default: 0 },
    structure: { type: Number, default: 0 },
    relevance: { type: Number, default: 0 },
    exampleQuality: { type: Number, default: 0 },
    communicationClarity: { type: Number, default: 0 },
  },
  { _id: false }
);

/* -------------------------------------------------------------------
   SUB-SCHEMA: AI FEEDBACK PER QUESTION
------------------------------------------------------------------- */
const AIQuestionFeedbackSchema = new Schema(
  {
    feedback: { type: String, default: "" },
    fluency: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    technicalAccuracy: { type: Number, default: 0 },
    keywordUsage: { type: Number, default: 0 },
    depth: { type: Number, default: 0 },
    structure: { type: Number, default: 0 },
    relevance: { type: Number, default: 0 },
    exampleQuality: { type: Number, default: 0 },
    communicationClarity: { type: Number, default: 0 },
  },
  { _id: false }
);

/* -------------------------------------------------------------------
   SUB-SCHEMA: Correct Answers
------------------------------------------------------------------- */
const CorrectAnswerSchema = new Schema(
  {
    questionId: { type: String, required: true },
    correct: { type: String, default: null }, // "A", "B", "C", "D" or null for coding
  },
  { _id: false }
);

/* -------------------------------------------------------------------
   MAIN SCORECARD SCHEMA (FINAL)
------------------------------------------------------------------- */
const ScorecardSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    scores: { type: ScoresSchema, required: true },

    extraDimensions: { type: ExtraDimensionsSchema, default: {} },

    overallBand: { type: String, default: "" },
    overallMessage: { type: String, default: "" },

    globalImprovementTips: [{ type: String }],

    // QUESTION-LEVEL DATA
    questions: [{ type: String }], // actual questions
    questionScores: [{ type: Number }], // score for each question (average of 5 questions)

    submittedAnswers: [
      {
        answer: { type: String, default: "" },
        questionType: { type: String, enum: ["mcq", "coding"], default: "mcq" },
      },
    ],

    aiFeedback: [AIQuestionFeedbackSchema],

    correctAnswers: [CorrectAnswerSchema],

    // Linking to interview session
    sessionId: { type: String },

    // Job role targeted
    role: { type: String, default: "" },

    // Score summaries
    mcqSummary: {
      totalQuestions: { type: Number, default: 0 },
      correct: { type: Number, default: 0 },
      scorePercent: { type: Number, default: 0 },
    },

    codingSummary: {
      totalQuestions: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
    },

    // VIOLATION TRACKING
    violations: [ViolationSchema],
    totalViolations: { type: Number, default: 0 },
    violationDetails: { type: String, default: "" }, // Summary of violations

    // FACE RECOGNITION & PHOTOS
    hasPhotoCapture: { type: Boolean, default: false },
    latestPhotoUrl: { type: String, default: "" }, // Cloudinary URL of latest captured photo
    photoCloudinaryId: { type: String, default: "" }, // For deletion if needed
    faceDetected: { type: Boolean, default: true },
    interviewStartTime: { type: Date, default: Date.now },
    interviewEndTime: { type: Date, default: null },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Faster fetch on history screen
ScorecardSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Scorecard", ScorecardSchema);
