
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createTask,
  getTaskByToken,
  startTaskInterview,
  completeTaskInterview,
  getAllTasks,
  getMyTasks,
  updateTask,
  deleteTask,
  addTaskComment,
} from "../controllers/taskController.js";

const router = express.Router();

// Task CRUD (authenticated)
router.post("/create", authMiddleware, createTask);
router.get("/all", authMiddleware, getAllTasks);
router.get("/my-tasks", authMiddleware, getMyTasks);
router.put("/:taskId", authMiddleware, updateTask);
router.delete("/:taskId", authMiddleware, deleteTask);
router.post("/:taskId/comment", authMiddleware, addTaskComment);

// Public task access (no auth required - uses token)
router.get("/by-token/:token", getTaskByToken);
router.post("/start/:token", startTaskInterview);
router.post("/complete/:token", completeTaskInterview);

export default router;