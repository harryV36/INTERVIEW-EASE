// routes/schedulingRoutes.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  scheduleInterview,
  getScheduledInterviews,
  getMyScheduledInterviews,
  updateInterviewStatus,
  cancelInterview,
  sendInterviewReminders,
  joinScheduledInterview,
  getScheduledInterviewConfig,
  getOrganizationCredits,
} from "../controllers/schedulingController.js";

const router = express.Router();

router.post("/schedule",            authMiddleware, scheduleInterview);
router.get("/all",                  authMiddleware, getScheduledInterviews);
router.get("/my-interviews",        authMiddleware, getMyScheduledInterviews);
router.put("/:interviewId/status",  authMiddleware, updateInterviewStatus);
router.delete("/:interviewId/cancel", authMiddleware, cancelInterview);
router.post("/send-reminders",      sendInterviewReminders);
router.post("/join",                authMiddleware, joinScheduledInterview);
// ⭐ FIXED: This route should NOT require auth since it's accessed from email links by non-authenticated users
router.get("/config/:token",        getScheduledInterviewConfig);
router.get("/org-credits",          authMiddleware, getOrganizationCredits);

export default router;
