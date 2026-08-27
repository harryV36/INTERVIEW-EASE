// // index.js / app.js
// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import connectDB from "./config/db.js";

// import authRouter from "./routes/authRoutes.js";
// import profileRouter from "./routes/profileRoutes.js";
// import ScorecardRoute from "./routes/scorecardRoute.js";
// import settingsRoute from "./routes/settingsRoutes.js";
// import interviewRoutes from "./routes/interviewRoutes.js";
// import devRoutes from "./routes/devRoutes.js";
// import aiInterviewRoutes from "./routes/aiInterviewRoutes.js";


// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// // Connect DB
// connectDB();

// // ------------------ ROUTES ------------------
// app.use("/api/auth", authRouter);
// app.use("/api/profile", profileRouter);
// app.use("/api/scorecards", ScorecardRoute);
// app.use("/api/settings", settingsRoute);
// app.use("/api/interviews", interviewRoutes);
// // app.use("/api/admin", adminRoutes);
// // app.use("/api/org", organizationRoutes);
// // ⭐ YOUR ROUTE MUST BE HERE (BEFORE ERROR HANDLER)
// app.use("/api/ai-interviews", aiInterviewRoutes);

// // Test routes
// app.use("/api/dev", devRoutes);

// // Root
// app.get("/", (req, res) => res.send("API is running..."));

// // ------------------ GLOBAL ERROR HANDLER (LAST!) ------------------
// app.use((err, req, res, next) => {
//   console.error("GLOBAL ERROR:", err.stack || err);
//   res.status(500).json({
//     msg: "Server error",
//     error: err.message || String(err),
//   });
// });

// // ------------------ SERVER ------------------
// const PORT = process.env.PORT || 8000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// index.js (UPDATED - Add new routes)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import profileRouter from "./routes/profileRoutes.js";
import ScorecardRoute from "./routes/scorecardRoute.js";
import settingsRoute from "./routes/settingsRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import devRoutes from "./routes/devRoutes.js";
import aiInterviewRoutes from "./routes/aiInterviewRoutes.js";
import organizationRoutes from "./routes/organizationRoutes.js";
import schedulingRoutes from "./routes/schedulingRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

// Connect DB
connectDB();

// ------------------ ROUTES ------------------
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/scorecards", ScorecardRoute);
app.use("/api/settings", settingsRoute);
app.use("/api/interviews", interviewRoutes);
app.use("/api/ai-interviews", aiInterviewRoutes);

// ⭐ NEW ORGANIZATION ROUTES
app.use("/api/organization", organizationRoutes);
app.use("/api/scheduling", schedulingRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/payments", paymentRoutes);
// Add this route
// Dev/Test routes
app.use("/api/dev", devRoutes);

// Root
app.get("/", (req, res) => res.send("API is running..."));

// ------------------ GLOBAL ERROR HANDLER ------------------
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err.stack || err);
  res.status(500).json({
    msg: "Server error",
    error: err.message || String(err),
  });
});

// ------------------ SERVER ------------------
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
