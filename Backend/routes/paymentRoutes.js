import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getPlans,
  getCredits,
  createPaymentOrder,
  verifyPayment,
  chargeAiRequest,
} from "../controllers/paymentController.js";

const router = express.Router();

router.get("/plans", getPlans);
router.get("/credits", authMiddleware, getCredits);
router.post("/create-order", authMiddleware, createPaymentOrder);
router.post("/verify", authMiddleware, verifyPayment);
router.post("/charge-ai", authMiddleware, chargeAiRequest);

export default router;
