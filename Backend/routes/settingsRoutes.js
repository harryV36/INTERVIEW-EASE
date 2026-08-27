// routes/settingsRoute.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getSettings,
  updateProfileSettings,
  updatePassword,
  updatePreferences,
  deleteAccount,
} from "../controllers/settingsController.js";

const router = express.Router();

// GET /api/settings/me
router.get("/me", authMiddleware, getSettings);

// PUT /api/settings/profile
router.put("/profile", authMiddleware, updateProfileSettings);

// PUT /api/settings/password
router.put("/password", authMiddleware, updatePassword);

// PUT /api/settings/preferences
router.put("/preferences", authMiddleware, updatePreferences);

// DELETE /api/settings/account
router.delete("/account", authMiddleware, deleteAccount);

export default router;
