import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["member", "admin"],
    default: "member",
  },
  status: {
    type: String,
    enum: ["active", "suspended", "pending"],
    default: "pending",
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  department: String,
  position: String,
});

const invitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "declined", "expired"],
    default: "pending",
  },
  token: {
    type: String,
    required: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    website: String,
    industry: String,
    size: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "500+", "", null],
      default: null,
    },
    logo: String,
    members: [memberSchema],
    invitations: [invitationSchema],
    settings: {
      allowMemberInvites: {
        type: Boolean,
        default: false,
      },
      requireApprovalForJoin: {
        type: Boolean,
        default: true,
      },
      autoScheduleInterviews: {
        type: Boolean,
        default: false,
      },
    },
    subscription: {
      plan: {
        type: String,
        enum: ["free", "basic", "professional", "enterprise"],
        default: "free",
      },
      maxMembers: {
        type: Number,
        default: 10,
      },
      features: [String],
    },
    // ── Org credit pool ─────────────────────────────────────────────────────
    // All AI costs for member tasks/scheduled interviews are deducted here,
    // NOT from individual member accounts.
    credits: {
      balance: {
        type: Number,
        default: 20, // 20 free credits on creation (same as user signup)
        min: 0,
      },
      history: [
        {
          action: String,
          cost: Number,
          deductedAt: { type: Date, default: Date.now },
        },
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
organizationSchema.index({ ownerId: 1 });
organizationSchema.index({ "members.userId": 1 });
organizationSchema.index({ "invitations.email": 1 });

export default mongoose.model("Organization", organizationSchema);
