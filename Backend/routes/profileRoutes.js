// routes/profileRoutes.js
import express from "express";
import multer from "multer";
import { saveProfile, getProfile, parseResumeAndSaveProfile } from "../controllers/profileController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Use memory storage for multer for quick parsing
const upload = multer({ storage: multer.memoryStorage() });

/* GET PROFILE BY EMAIL (protected) */
router.get("/:email", authMiddleware, getProfile);

/* SAVE / UPDATE PROFILE (protected) */
router.post("/save", authMiddleware, saveProfile);

/* UPLOAD RESUME -> PARSE -> AUTOFILL (protected) */
router.post("/parse-resume", authMiddleware, upload.single("resume"), parseResumeAndSaveProfile);

export default router;





// import express from "express";
// import multer from "multer";
// import {
//   saveProfile,
//   getProfile,
//   parseResumeAndSaveProfile,
// } from "../controllers/profileController.js";
// import authMiddleware from "../middleware/authMiddleware.js";
// import UserProfile from "../models/UserProfile.js";

// const router = express.Router();

// // Multer memory storage
// const upload = multer({ storage: multer.memoryStorage() });

// /**
//  * ✅ GET LOGGED-IN USER PROFILE (NEW)
//  * Route: GET /api/profile/me
//  * Used for avatar, navbar, settings, etc.
//  */
// router.get("/me", authMiddleware, async (req, res) => {
//   try {
//     const profile = await UserProfile.findOne({ userId: req.user.id });

//     if (!profile) {
//       return res.status(404).json({ msg: "Profile not found" });
//     }

//     res.json(profile);
//   } catch (error) {
//     console.error("Get profile (/me) error:", error);
//     res.status(500).json({ msg: "Server error" });
//   }
// });

// /**
//  * EXISTING ROUTES (UNCHANGED)
//  */

// // GET PROFILE BY EMAIL (protected)
// router.get("/:email", authMiddleware, getProfile);

// // SAVE / UPDATE PROFILE (protected)
// router.post("/save", authMiddleware, saveProfile);

// // UPLOAD RESUME -> PARSE -> AUTOFILL (protected)
// router.post(
//   "/parse-resume",
//   authMiddleware,
//   upload.single("resume"),
//   parseResumeAndSaveProfile
// );

// export default router;
