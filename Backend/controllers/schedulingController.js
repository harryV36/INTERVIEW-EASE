// controllers/schedulingController.js
import ScheduledInterview from "../models/ScheduledInterview.js";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import InterviewSession from "../models/InterviewSession.js";
import crypto from "crypto";
import { createTransport } from "nodemailer";
import { chargeOrgCredits, getOrgCredits } from "../services/creditService.js";

const transporter = createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ============================================================
   SCHEDULE INTERVIEW  — costs 2 org credits per interview
============================================================ */
export const scheduleInterview = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      assignedTo,
      title,
      description,
      scheduledDate,
      duration,
      interviewConfig,
      notes,
    } = req.body;

    const organization = await Organization.findOne({
      $or: [
        { ownerId: userId },
        { "members.userId": userId, "members.role": "admin" },
      ],
    });

    if (!organization) {
      return res.status(403).json({
        success: false,
        msg: "You don't have permission to schedule interviews",
      });
    }

    const assignedIds = Array.isArray(assignedTo)
      ? assignedTo.filter(Boolean)
      : assignedTo
        ? [assignedTo]
        : [];

    if (assignedIds.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "Please select at least one member",
      });
    }

    const invalidMembers = assignedIds.filter(
      (memberId) => !organization.members.some((m) => m.userId.toString() === memberId)
    );

    if (invalidMembers.length > 0) {
      return res.status(400).json({
        success: false,
        msg: "One or more selected users are not members of this organization",
      });
    }

    // ── Charge 2 org credits per interview ──────────────────────────────
    try {
      for (let i = 0; i < assignedIds.length; i += 1) {
        await chargeOrgCredits(organization._id, "schedule_interview");
      }
    } catch (creditErr) {
      return res.status(402).json({
        success: false,
        msg: creditErr.message,
        orgCredits: await getOrgCredits(organization._id),
      });
    }

    const scheduledInterviews = [];

    for (const memberId of assignedIds) {
      const joinToken = crypto.randomBytes(24).toString("hex");
      const meetingLink = `${process.env.FRONTEND_URL}/feature-individual-student?scheduled=true&token=${joinToken}`;

      const scheduledInterview = await ScheduledInterview.create({
        organizationId: organization._id,
        assignedTo: memberId,
        assignedBy: userId,
        title,
        description,
        scheduledDate: new Date(scheduledDate),
        duration: duration || 45,
        interviewConfig,
        meetingLink,
        joinToken,
        notes,
        status: "scheduled",
        reminderSent: false,
      });

      scheduledInterviews.push(scheduledInterview);

      const user = await User.findById(memberId);
      if (user && user.email) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: `Interview Scheduled: ${title}`,
          html: `
            <h2>Interview Scheduled</h2>
            <p><strong>Title:</strong> ${title}</p>
            <p><strong>Date & Time:</strong> ${new Date(scheduledDate).toLocaleString()}</p>
            <p><strong>Duration:</strong> ${duration || 45} minutes</p>
            <p><strong>Description:</strong> ${description || "N/A"}</p>
            <p><strong>Meeting Link:</strong></p>
            <a href="${meetingLink}" style="padding:10px 20px;background:#1d4ed8;color:#fff;border-radius:8px;text-decoration:none">
              Join Interview
            </a>
            <p>Please make sure you're prepared and join on time.</p>
          `,
        }).catch((e) => console.warn("Email send failed:", e.message));
      }
    }

    res.json({
      success: true,
      msg: "Interview scheduled successfully",
      interviews: scheduledInterviews,
      assignedCount: scheduledInterviews.length,
      orgCreditsRemaining: await getOrgCredits(organization._id),
    });
  } catch (err) {
    console.error("Schedule interview error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

/* ============================================================
   GET SCHEDULED INTERVIEWS (ADMIN)
============================================================ */
export const getScheduledInterviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, startDate, endDate } = req.query;

    const organization = await Organization.findOne({
      $or: [
        { ownerId: userId },
        { "members.userId": userId, "members.role": "admin" },
      ],
    });

    if (!organization) {
      return res.status(404).json({ success: false, msg: "Organization not found" });
    }

    const query = { organizationId: organization._id };
    if (status) query.status = status;
    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate);
      if (endDate)   query.scheduledDate.$lte = new Date(endDate);
    }

    const interviews = await ScheduledInterview.find(query)
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name email")
      .sort({ scheduledDate: -1 });

    res.json({
      success: true,
      interviews,
      orgCredits: organization.credits?.balance ?? 0,
    });
  } catch (err) {
    console.error("Get scheduled interviews error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

/* ============================================================
   GET MY SCHEDULED INTERVIEWS (MEMBER)
============================================================ */
export const getMyScheduledInterviews = async (req, res) => {
  try {
    const userId = req.user.id;

    const interviews = await ScheduledInterview.find({
      assignedTo: userId,
      status: { $in: ["scheduled", "in-progress"] },
    })
      .populate("assignedBy", "name email")
      .populate("organizationId", "name")
      .sort({ scheduledDate: 1 });

    res.json({ success: true, interviews });
  } catch (err) {
    console.error("Get my scheduled interviews error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

/* ============================================================
   GET SCHEDULED CONFIG (AUTO-FILL INTERVIEW SETUP)
============================================================ */
export const getScheduledInterviewConfig = async (req, res) => {
  try {
    const { token } = req.params;

    const interview = await ScheduledInterview.findOne({
      status: "scheduled",
      $or: [
        { joinToken: token },
        { meetingLink: { $regex: token, $options: "i" } },
      ],
    }).populate("assignedTo", "name email");

    if (!interview) {
      return res.status(404).json({ success: false, msg: "Invalid or expired interview link" });
    }

    const now = new Date();
    const scheduledTime = new Date(interview.scheduledDate);
    const tenMinutesBefore = new Date(scheduledTime.getTime() - 10 * 60 * 1000);

    if (now < tenMinutesBefore) {
      return res.status(403).json({
        success: false,
        msg: "Interview hasn't started yet",
        scheduledTime: scheduledTime.toISOString(),
      });
    }

    res.json({
      success: true,
      config: {
        ...interview.interviewConfig,
        duration: interview.duration,
        scheduledDate: interview.scheduledDate,
        title: interview.title,
        description: interview.description,
        customNotes: interview.notes || "",
        userName: interview.assignedTo?.name || "",
        userEmail: interview.assignedTo?.email || "",
        targetJobRole: interview.interviewConfig?.targetJobRole || "",
        isScheduled: true,
        token,
      },
    });
  } catch (err) {
    console.error("Get scheduled config error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

/* ============================================================
   JOIN SCHEDULED INTERVIEW
============================================================ */
export const joinScheduledInterview = async (req, res) => {
  try {
    const { token, sessionId } = req.body;
    const interview = await ScheduledInterview.findOne({
      $or: [
        { joinToken: token },
        { meetingLink: { $regex: token, $options: "i" } },
      ],
      assignedTo: req.user.id,
      status: { $in: ["scheduled", "in-progress"] },
    });

    if (!interview) {
      return res.status(403).json({ success: false, msg: "Invalid or expired interview link" });
    }

    if (sessionId) {
      interview.sessionId = sessionId;
      interview.status = "in-progress";
      await interview.save();
      return res.json({ success: true, sessionId: interview.sessionId });
    }

    if (interview.sessionId) {
      return res.json({ success: true, sessionId: interview.sessionId });
    }

    if (!interview.sessionId) {
      const session = await InterviewSession.create({
        user: req.user.id,
        generatedQuestions: [],
        config: interview.interviewConfig,
      });
      interview.sessionId = session._id;
      interview.status = "in-progress";
      await interview.save();
    }

    res.json({ success: true, sessionId: interview.sessionId });
  } catch (err) {
    console.error("Join interview error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

/* ============================================================
   UPDATE INTERVIEW STATUS
============================================================ */
export const updateInterviewStatus = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { status, sessionId, scorecardId } = req.body;

    const interview = await ScheduledInterview.findById(interviewId);
    if (!interview) return res.status(404).json({ success: false, msg: "Interview not found" });

    interview.status = status;
    if (sessionId)   interview.sessionId   = sessionId;
    if (scorecardId) interview.scorecardId = scorecardId;
    await interview.save();

    res.json({ success: true, msg: "Interview status updated", interview });
  } catch (err) {
    console.error("Update interview status error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

/* ============================================================
   CANCEL INTERVIEW
============================================================ */
export const cancelInterview = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.user.id;

    const interview = await ScheduledInterview.findById(interviewId);
    if (!interview) return res.status(404).json({ success: false, msg: "Interview not found" });

    if (
      interview.assignedTo.toString() !== userId &&
      interview.assignedBy.toString() !== userId
    ) {
      return res.status(403).json({ success: false, msg: "You don't have permission to cancel this interview" });
    }

    interview.status = "cancelled";
    await interview.save();

    res.json({ success: true, msg: "Interview cancelled successfully" });
  } catch (err) {
    console.error("Cancel interview error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

/* ============================================================
   GET ORG CREDITS
============================================================ */
export const getOrganizationCredits = async (req, res) => {
  try {
    const userId = req.user.id;
    const org = await Organization.findOne({
      $or: [{ ownerId: userId }, { "members.userId": userId, "members.role": "admin" }],
    }).select("credits name");

    if (!org) return res.status(404).json({ success: false, msg: "Organization not found" });

    res.json({
      success: true,
      orgName: org.name,
      credits: org.credits?.balance ?? 0,
      history: (org.credits?.history || []).slice(-10).reverse(),
    });
  } catch (err) {
    console.error("Get org credits error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

/* ============================================================
   SEND INTERVIEW REMINDERS (CRON)
============================================================ */
export const sendInterviewReminders = async (req, res) => {
  try {
    const now = new Date();
    const reminderTime = new Date(now.getTime() + 30 * 60 * 1000);

    const interviews = await ScheduledInterview.find({
      status: "scheduled",
      reminderSent: false,
      scheduledDate: { $gte: now, $lte: reminderTime },
    }).populate("assignedTo", "email");

    for (const interview of interviews) {
      if (interview.assignedTo?.email) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: interview.assignedTo.email,
          subject: `Reminder: Interview in 30 minutes`,
          html: `<p>Your interview is starting in 30 minutes.</p><a href="${interview.meetingLink}">Join Interview</a>`,
        }).catch(() => {});
        interview.reminderSent = true;
        await interview.save();
      }
    }

    res.json({ success: true, msg: `Sent ${interviews.length} reminders` });
  } catch (err) {
    console.error("Send reminders error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

export default {
  getScheduledInterviewConfig,
  scheduleInterview,
  getScheduledInterviews,
  getMyScheduledInterviews,
  joinScheduledInterview,
  updateInterviewStatus,
  cancelInterview,
  sendInterviewReminders,
  getOrganizationCredits,
};
