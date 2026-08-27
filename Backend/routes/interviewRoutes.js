// // routes/interviewRoutes.js
// import express from "express";
// import authMiddleware from "../middleware/authMiddleware.js";
// import Scorecard from "../models/Scorecard.js";

// const router = express.Router();

// /* ----------------------------------------------
//    GET /api/interviews/me → Fetch history
// ---------------------------------------------- */
// router.get("/me", authMiddleware, async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const scorecards = await Scorecard
//       .find({ userId })
//       .sort({ createdAt: -1 });

//     const formatted = scorecards.map((s) => ({
//       id: s._id,

//       // ✅ Use the actual role instead of the first question
//       role:
//         s.role ||                     // main field
//         s.targetRole ||               // fallback 1
//         s.position ||                 // fallback 2
//         "Interview Session",          // fallback 3

//       date: s.createdAt,
//       score: s.scores?.overallScore || 0,
//       status: s.scores?.overallScore > 0 ? "Completed" : "In Progress",
//     }));

//     return res.json({ success: true, interviews: formatted });

//   } catch (err) {
//     console.error("Scorecard fetch error:", err);
//     return res.status(500).json({
//       success: false,
//       msg: "Failed to load interviews",
//     });
//   }
// });

// /* ---------------------------------------------------
//    GET /api/interviews/details/:id → Full Scorecard
// --------------------------------------------------- */
// router.get("/details/:id", authMiddleware, async (req, res) => {
//   try {
//     const scorecard = await Scorecard.findById(req.params.id);

//     if (!scorecard) {
//       return res
//         .status(404)
//         .json({ success: false, msg: "Scorecard not found" });
//     }

//     return res.json({ success: true, session: scorecard });

//   } catch (err) {
//     console.error("Scorecard detail error:", err);
//     return res
//       .status(500)
//       .json({ success: false, msg: "Failed to load details" });
//   }
// });

// export default router;

// routes/interviewRoutes.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import Scorecard from "../models/Scorecard.js";

const router = express.Router();

/* ----------------------------------------------
   GET /api/interviews/me → Fetch interview history
---------------------------------------------- */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all scorecards for this user
    const scorecards = await Scorecard
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    const formatted = scorecards.map((s) => ({
      id: s._id,

      // ✅ FINAL: USE ONLY REAL ROLE FROM DATABASE
      role:
        s.role && s.role.trim() !== ""
          ? s.role
          : "Unknown Role",  // no questions fallback EVER

      date: s.createdAt,
      score: s.scores?.overallScore || 0,
      status: s.scores?.overallScore > 0 ? "Completed" : "In Progress",
      latestPhotoUrl: s.latestPhotoUrl || null,  // ✅ ADD PHOTO URL
      totalViolations: s.totalViolations || 0,  // ✅ ADD VIOLATION COUNT
    }));

    return res.json({
      success: true,
      interviews: formatted,
    });

  } catch (err) {
    console.error("Scorecard fetch error:", err);
    return res.status(500).json({
      success: false,
      msg: "Failed to load interviews",
    });
  }
});

/* ---------------------------------------------------
   GET /api/interviews/details/:id → Full Scorecard
--------------------------------------------------- */
router.get("/details/:id", authMiddleware, async (req, res) => {
  try {
    const scorecard = await Scorecard.findById(req.params.id).lean();

    if (!scorecard) {
      return res.status(404).json({
        success: false,
        msg: "Scorecard not found",
      });
    }

    // Also normalize role here
    scorecard.role =
      scorecard.role && scorecard.role.trim() !== ""
        ? scorecard.role
        : "Unknown Role";

    return res.json({
      success: true,
      session: scorecard,
    });

  } catch (err) {
    console.error("Scorecard detail error:", err);
    return res.status(500).json({
      success: false,
      msg: "Failed to load details",
    });
  }
});

export default router;
