import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    planId: {
      type: String,
      enum: ["standard", "intermediate", "advanced"],
      required: true,
    },

    planName: {
      type: String,
      required: true,
    },

    credits: {
      type: Number,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    // Payment provider used for this transaction.
    // Examples: "simulator".
    provider: {
      type: String,
      enum: ["simulator"],
      default: "simulator",
      required: true,
      },

    // Provider-neutral order ID.
    providerOrderId: {
      type: String,
      required: true,
      unique: true,
    },

    // Provider-neutral payment ID.
    providerPaymentId: String,

    // Provider-neutral payment signature.
    providerSignature: String,

    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
    },

    paidAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
