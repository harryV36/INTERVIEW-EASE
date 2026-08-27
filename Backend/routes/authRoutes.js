// import express from "express";
// import { registerUser, loginUser } from "../controllers/authController.js";

// const router = express.Router();

// router.post("/signup", registerUser);
// router.post("/login", loginUser);

// export default router;


import express from "express";
import {
  registerUser,
  loginUser,
  updateUserRole,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// ✅ NEW: Add this route to update user role
router.put("/update-role", authMiddleware, updateUserRole);

export default router;
