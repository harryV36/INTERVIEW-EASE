// routes/devRoutes.js
import express from "express";
import multer from "multer";
import { parseOnly } from "../controllers/devController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// PUBLIC dev parsing endpoint (use for testing)
router.post("/parse-only", upload.single("resume"), parseOnly);

export default router;
