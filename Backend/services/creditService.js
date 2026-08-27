import User from "../models/User.js";
import Organization from "../models/Organization.js";

// ─── Centralised credit cost table (1–4 scale) ───────────────────────────────
// Rule: simple lookups = 1, light AI = 2, heavy AI = 3, real-time AI = 4
export const CREDIT_COSTS = {
  // User-level actions
  question_generation:  1,   // Generate interview questions list
  resume_parse:         2,   // Parse / analyse a resume
  answer_feedback:      2,   // AI feedback on a single typed answer
  scorecard:            3,   // Full scorecard generation after interview
  interview_question:   4,   // Live interview AI response (per question)
  chat_on_question:     2,   // Practice chat on one question
  generate_answer:      2,   // Model answer generation
  analyze_resume:       3,   // Full resume analysis report

  // Org-level actions (charged from org credit pool)
  candidate_filter:     4,   // NL → DB query candidate filter
  schedule_interview:   2,   // Schedule an org interview (per member)
  create_task:          1,   // Create an org task (per task)

  // Fallback
  default:              4,
};

// Backward-compat export (Python app still uses this via /api/payments/charge-ai)
export const AI_CREDIT_COST = CREDIT_COSTS.default;

/**
 * Resolve a cost from either a number (clamped 1-4) or an action key string.
 */
export function resolveCost(costOrAction) {
  if (typeof costOrAction === "number") return Math.min(4, Math.max(1, Math.round(costOrAction)));
  return CREDIT_COSTS[costOrAction] ?? CREDIT_COSTS.default;
}

/**
 * Charge credits from a USER's wallet.
 * @param {string} userId
 * @param {string|number} costOrAction - action key or numeric cost
 * @returns {number} remaining user credits
 */
export async function chargeAiCredits(userId, costOrAction = "default") {
  const cost = resolveCost(costOrAction);

  const user = await User.findOneAndUpdate(
    { _id: userId, credits: { $gte: cost } },
    { $inc: { credits: -cost } },
    { new: true }
  ).select("credits");

  if (!user) {
    const err = new Error(
      `Insufficient credits. This action costs ${cost} credit${cost !== 1 ? "s" : ""}. Please top up on the Pricing page.`
    );
    err.statusCode = 402;
    throw err;
  }

  return user.credits ?? 0;
}

/**
 * Charge credits from an ORGANISATION's credit pool.
 * Always used when org admin schedules tasks/interviews for members.
 * Members are never charged directly for org-initiated actions.
 * @param {string} organizationId
 * @param {string|number} costOrAction
 * @returns {number} remaining org credit balance
 */
export async function chargeOrgCredits(organizationId, costOrAction = "default") {
  const cost = resolveCost(costOrAction);
  const actionLabel = typeof costOrAction === "string" ? costOrAction : "ai_action";

  const org = await Organization.findOneAndUpdate(
    { _id: organizationId, "credits.balance": { $gte: cost } },
    {
      $inc: { "credits.balance": -cost },
      $push: {
        "credits.history": {
          action: actionLabel,
          cost,
          deductedAt: new Date(),
        },
      },
    },
    { new: true }
  ).select("credits");

  if (!org) {
    const err = new Error(
      `Insufficient organisation credits — need ${cost} credit${cost !== 1 ? "s" : ""}. Please top up the organisation balance.`
    );
    err.statusCode = 402;
    throw err;
  }

  return org.credits?.balance ?? 0;
}

/** Get org credit balance (read-only) */
export async function getOrgCredits(organizationId) {
  const org = await Organization.findById(organizationId).select("credits");
  return org?.credits?.balance ?? 0;
}

/** Add credits to an org (e.g. after owner purchases plan) */
export async function addOrgCredits(organizationId, amount) {
  const org = await Organization.findByIdAndUpdate(
    organizationId,
    { $inc: { "credits.balance": amount } },
    { new: true }
  ).select("credits");
  return org?.credits?.balance ?? 0;
}
