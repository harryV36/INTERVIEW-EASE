import User from "../models/User.js";
import Payment from "../models/Payment.js";
import {
  AI_CREDIT_COST,
  chargeAiCredits,
} from "../services/creditService.js";

import {
  createProviderOrder,
  verifyProviderPayment,
  getPaymentProvider,
} from "../services/paymentService.js";

export const CREDIT_PLANS = {
  standard: {
    id: "standard",
    name: "Standard",
    credits: 200,
    amount: 299,
  },

  intermediate: {
    id: "intermediate",
    name: "Intermediate",
    credits: 1000,
    amount: 899,
  },

  advanced: {
    id: "advanced",
    name: "Advanced",
    credits: 5000,
    amount: 3999,
  },
};

export const getPlans = async (req, res) => {
  res.json({
    success: true,
    provider: getPaymentProvider(),
    plans: Object.values(CREDIT_PLANS),
  });
};

export const getCredits = async (req, res) => {
  const user = await User.findById(req.user.id).select("credits");

  if (!user) {
    return res.status(404).json({
      msg: "User not found",
    });
  }

  res.json({
    success: true,
    credits: user.credits ?? 0,
  });
};

export const createPaymentOrder = async (req, res) => {
  try {
    const { planId } = req.body;

    const plan = CREDIT_PLANS[planId];

    if (!plan) {
      return res.status(400).json({
        msg: "Invalid credit plan",
      });
    }

    const user = await User.findById(req.user.id).select(
      "name email"
    );

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    const receipt = `credits_${req.user.id}_${Date.now()}`.slice(
      0,
      40
    );

    const providerResult = await createProviderOrder({
      amount: plan.amount,
      currency: "INR",
      receipt,

      notes: {
        userId: req.user.id,
        planId: plan.id,
        credits: plan.credits,
        email: user.email,
      },
    });

    const order = providerResult.order;

    await Payment.create({
      userId: req.user.id,

      planId: plan.id,
      planName: plan.name,

      credits: plan.credits,
      amount: plan.amount,
      currency: "INR",

      provider: providerResult.provider,
      providerOrderId: order.id,

      status: "created",
    });

    res.json({
      success: true,

      provider: providerResult.provider,

      order,
      plan,
    });
  } catch (err) {
    console.error(
      "Create payment order error:",
      err.response?.data || err.message
    );

    res.status(500).json({
      msg: "Failed to create payment order",
      error: err.message,
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const {
      providerOrderId,
      providerPaymentId,
      providerSignature,

      // Temporary compatibility with the simulator/frontend
      orderId,
      paymentId,
      signature,
    } = req.body;

    const finalOrderId =
      providerOrderId || orderId;

    const finalPaymentId =
      providerPaymentId || paymentId;

    const finalSignature =
      providerSignature || signature;

    if (!finalOrderId || !finalPaymentId) {
      return res.status(400).json({
        msg: "Payment verification data missing",
      });
    }

    const payment = await Payment.findOne({
      providerOrderId: finalOrderId,
      userId: req.user.id,
      status: "created",
    });

    if (!payment) {
      return res.status(400).json({
        msg: "Payment already verified or not found",
      });
    }

    const verification = await verifyProviderPayment({
      orderId: finalOrderId,
      paymentId: finalPaymentId,
      signature: finalSignature,
    });

    if (!verification.verified) {
      await Payment.findOneAndUpdate(
        {
          providerOrderId: finalOrderId,
          userId: req.user.id,
        },
        {
          status: "failed",
        }
      );

      return res.status(400).json({
        msg: "Payment verification failed",
      });
    }

    payment.providerPaymentId =
      verification.paymentId || finalPaymentId;

    payment.providerSignature =
      verification.signature || finalSignature || null;

    payment.status = "paid";
    payment.paidAt = new Date();

    await payment.save();

    /*
     * IMPORTANT:
     *
     * $inc adds purchased credits to the
     * existing balance instead of replacing it.
     */
    const user = await User.findByIdAndUpdate(
      req.user.id,

      {
        $inc: {
          credits: payment.credits,
        },
      },

      {
        new: true,
      }
    ).select("credits");

    if (!user) {
      return res.status(404).json({
        msg: "User not found after payment verification",
      });
    }

    res.json({
      success: true,

      msg: `${payment.credits} credits added successfully`,

      provider: payment.provider,

      credits: user.credits ?? 0,
    });
  } catch (err) {
    console.error(
      "Verify payment error:",
      err.response?.data || err.message
    );

    res.status(500).json({
      msg: "Failed to verify payment",
      error: err.message,
    });
  }
};

export const chargeAiRequest = async (req, res) => {
  try {
    const credits = await chargeAiCredits(req.user.id);

    res.json({
      success: true,
      charged: AI_CREDIT_COST,
      credits,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      msg:
        err.message ||
        "Failed to charge credits",
    });
  }
};