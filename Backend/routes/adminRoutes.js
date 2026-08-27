import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  adminDashboard,
  getStudents,
  autoRemove,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/dashboard", authMiddleware, adminDashboard);
router.get("/students", authMiddleware, getStudents);
router.post("/auto-remove", authMiddleware, autoRemove);

export default router;
