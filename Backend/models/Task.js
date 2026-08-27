// // models/Task.js
// import mongoose from "mongoose";

// const taskSchema = new mongoose.Schema(
//   {
//     organizationId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Organization",
//       required: true,
//     },
//     title: {
//       type: String,
//       required: true,
//     },
//     description: String,
//     assignedTo: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     assignedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     dueDate: Date,
//     priority: {
//       type: String,
//       enum: ["low", "medium", "high", "urgent"],
//       default: "medium",
//     },
//     status: {
//       type: String,
//       enum: ["pending", "in-progress", "completed", "cancelled"],
//       default: "pending",
//     },
//     type: {
//       type: String,
//       enum: ["interview", "training", "assessment", "other"],
//       default: "other",
//     },
//     accessToken: {
//       type: String,
//       unique: true,
//       sparse: true,
//     },
//     sessionId: String,
//     interviewSetup: mongoose.Schema.Types.Mixed,
//     completionScore: Number,
//     scorecardId: mongoose.Schema.Types.ObjectId,
//     attachments: [
//       {
//         name: String,
//         url: String,
//         uploadedAt: Date,
//       },
//     ],
//     comments: [
//       {
//         userId: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "User",
//         },
//         text: String,
//         createdAt: {
//           type: Date,
//           default: Date.now,
//         },
//       },
//     ],
//     completedAt: Date,
//   },
//   { timestamps: true }
// );

// taskSchema.index({ organizationId: 1, assignedTo: 1 });
// taskSchema.index({ status: 1 });
// taskSchema.index({ dueDate: 1 });

// export default mongoose.model("Task", taskSchema);


// models/Task.js
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: String,
    
    // Multi-member assignment
    assignedTo: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      email: String,
      name: String,
      status: {
        type: String,
        enum: ["pending", "in-progress", "completed", "cancelled"],
        default: "pending",
      },
      sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterviewSession",
      },
      scorecardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Scorecard",
      },
      completionScore: Number,
      startedAt: Date,
      completedAt: Date,
      accessToken: {
        type: String,
        unique: true,
        sparse: true,
      },
      taskLink: String,
    }],

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    dueDate: Date,
    
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    type: {
      type: String,
      enum: ["interview", "assessment", "project", "other"],
      default: "interview",
    },

    // Overall task status (aggregated from assignedTo statuses)
    overallStatus: {
      type: String,
      enum: ["pending", "in-progress", "completed", "cancelled"],
      default: "pending",
    },

    // Interview configuration
    interviewSetup: {
      category: String,
      targetJobRole: String,
      customJobRole: String,
      targetCompany: String,
      customCompany: String,
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
      autoStartTimer: Number,
    },

    // Custom fields added by organization
    customFields: [{
      fieldName: {
        type: String,
        required: true,
      },
      fieldValue: String,
      fieldType: {
        type: String,
        enum: ["text", "number", "select", "multiselect", "date"],
        default: "text",
      },
      options: [String], // For select/multiselect types
    }],

    // Comments/Notes
    comments: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      text: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],

    // Completion tracking
    completionStats: {
      totalAssigned: {
        type: Number,
        default: 0,
      },
      completed: {
        type: Number,
        default: 0,
      },
      inProgress: {
        type: Number,
        default: 0,
      },
      pending: {
        type: Number,
        default: 0,
      },
      averageScore: Number,
    },
  },
  { timestamps: true }
);

// Indexes
taskSchema.index({ organizationId: 1 });
taskSchema.index({ "assignedTo.userId": 1 });
taskSchema.index({ assignedBy: 1 });
taskSchema.index({ overallStatus: 1 });
taskSchema.index({ dueDate: 1 });

// Method to update completion stats
taskSchema.methods.updateCompletionStats = function() {
  this.completionStats.totalAssigned = this.assignedTo.length;
  this.completionStats.completed = this.assignedTo.filter(a => a.status === "completed").length;
  this.completionStats.inProgress = this.assignedTo.filter(a => a.status === "in-progress").length;
  this.completionStats.pending = this.assignedTo.filter(a => a.status === "pending").length;
  
  const scores = this.assignedTo
    .filter(a => a.completionScore !== undefined)
    .map(a => a.completionScore);
  
  if (scores.length > 0) {
    this.completionStats.averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  // Update overall status
  if (this.completionStats.completed === this.completionStats.totalAssigned) {
    this.overallStatus = "completed";
  } else if (this.completionStats.inProgress > 0 || this.completionStats.completed > 0) {
    this.overallStatus = "in-progress";
  } else {
    this.overallStatus = "pending";
  }
};

// Pre-save hook to update stats
taskSchema.pre("save", function(next) {
  if (this.isModified("assignedTo")) {
    this.updateCompletionStats();
  }
  next();
});

export default mongoose.model("Task", taskSchema);