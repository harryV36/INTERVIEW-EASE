
// import express from "express";
// import authMiddleware  from "../middleware/authMiddleware.js";
// import multer from "multer";
// import {
//   createOrganization,
//   getOrganization,
//   updateOrganization,
//   sendInvitation,
//   sendBulkInvitations,
//   validateInvitation,
//   acceptInvitation,
//   declineInvitation,
//   removeMember,
//   removeBulkMembers,
//   revokeBulkInvitations,
//   updateMemberRole,
//   getMembersPerformance,
//   getMemberScores,
// } from "../controllers/organizationController.js";

// const router = express.Router();

// // Configure multer for file uploads
// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = [
//       "application/vnd.ms-excel",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//       "text/csv",
//     ];
//     if (allowedTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error("Invalid file type. Only Excel and CSV files are allowed."));
//     }
//   },
// });

// // Organization CRUD
// router.post("/create", authMiddleware, createOrganization);
// router.get("/", authMiddleware, getOrganization);
// router.put("/update", authMiddleware, updateOrganization);

// // Invitations
// router.post("/invite", authMiddleware, sendInvitation);
// router.post("/invite/bulk", authMiddleware, sendBulkInvitations);
// router.post("/invite/revoke/bulk", authMiddleware, revokeBulkInvitations);
// router.get("/accept-invite/:token", validateInvitation);
// router.post("/accept-invite/:token", authMiddleware, acceptInvitation);
// router.post("/decline-invite/:token", declineInvitation);

// // Members
// router.get("/members/performance", authMiddleware, getMembersPerformance);
// router.get("/member/:memberId/scores", authMiddleware, getMemberScores);
// router.delete("/member/:memberId", authMiddleware, removeMember);
// router.delete("/members/bulk", authMiddleware, removeBulkMembers);
// router.patch("/member/:memberId/role", authMiddleware, updateMemberRole);

// export default router;

// routes/organizationRoutes.js
import express from "express";
import authMiddleware  from "../middleware/authMiddleware.js";
import multer from "multer";
import {
  createOrganization,
  getOrganization,
  updateOrganization,
  sendInvitation,
  sendBulkInvitations,
  validateInvitation,
  acceptInvitation,
  declineInvitation,
  removeMember,
  removeBulkMembers,
  revokeBulkInvitations,
  updateMemberRole,
  getMembersPerformance,
  getMemberScores,
  filterCandidates,
} from "../controllers/organizationController.js";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only Excel and CSV files are allowed."));
    }
  },
});

// Organization CRUD
router.post("/create", authMiddleware, createOrganization);
router.get("/", authMiddleware, getOrganization);
router.put("/update", authMiddleware, updateOrganization);

// Invitations
router.post("/invite", authMiddleware, sendInvitation);
router.post("/invite/bulk", authMiddleware, sendBulkInvitations);
router.post("/invite/revoke/bulk", authMiddleware, revokeBulkInvitations);
router.get("/accept-invite/:token", validateInvitation);
router.post("/accept-invite/:token", authMiddleware, acceptInvitation);
router.post("/decline-invite/:token", declineInvitation);

// Members
router.get("/members/performance", authMiddleware, getMembersPerformance);

// ⭐ FIXED: This route must come BEFORE the :memberId route
router.get("/member/:memberId/scores", authMiddleware, getMemberScores);

// AI Candidate Filter
router.post("/filter-candidates", authMiddleware, filterCandidates);

router.delete("/member/:memberId", authMiddleware, removeMember);
router.delete("/members/bulk", authMiddleware, removeBulkMembers);
router.patch("/member/:memberId/role", authMiddleware, updateMemberRole);

export default router;