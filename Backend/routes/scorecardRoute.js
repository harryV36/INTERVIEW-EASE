// routes/scorecardRoute.js (FIXED)
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import Scorecard from "../models/Scorecard.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ⚠️ IMPORTANT: Put specific routes BEFORE parameterized routes
// This prevents "me" from being treated as an ObjectId

// Get all my scorecards (authenticated user)
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const scorecards = await Scorecard.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      scorecards,
    });
  } catch (err) {
    console.error("Get my scorecards error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

// Get latest scorecard for authenticated user
router.get("/latest", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const scorecard = await Scorecard.findOne({ userId })
      .sort({ createdAt: -1 });

    if (!scorecard) {
      return res.json({
        success: false,
        error: "No scorecard found",
      });
    }

    res.json({
      success: true,
      scorecard,
    });
  } catch (err) {
    console.error("Get latest scorecard error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

// Get scorecard by ID
router.get("/:scorecardId", async (req, res) => {
  try {
    const { scorecardId } = req.params;

    // Validate ObjectId format
    if (!scorecardId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        msg: "Invalid scorecard ID format",
      });
    }

    const scorecard = await Scorecard.findById(scorecardId);

    if (!scorecard) {
      return res.status(404).json({
        success: false,
        msg: "Scorecard not found",
      });
    }

    res.json({
      success: true,
      scorecard,
    });
  } catch (err) {
    console.error("Scorecard detail error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

// Create/Update scorecard
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    let scorecardData = req.body;

    // CRITICAL FIX: Ensure questionScores is an array of numbers, not strings
    if (scorecardData.questionScores) {
      if (typeof scorecardData.questionScores === "string") {
        // Try to parse if it's a JSON string
        try {
          scorecardData.questionScores = JSON.parse(scorecardData.questionScores);
        } catch (e) {
          console.warn("Could not parse questionScores string, using empty array");
          scorecardData.questionScores = [];
        }
      }

      // Ensure it's an array of numbers
      if (Array.isArray(scorecardData.questionScores)) {
        scorecardData.questionScores = scorecardData.questionScores.map((score) => {
          // Handle case where score might be an object with indexed key
          if (typeof score === "object" && score !== null) {
            // Try to extract numeric value from object
            const values = Object.values(score).filter((v) => typeof v === "number");
            return values.length > 0 ? values[0] : parseFloat(score) || 0;
          }
          return parseFloat(score) || 0;
        });
      } else {
        scorecardData.questionScores = [];
      }
    }

    // Ensure questions array exists
    if (!Array.isArray(scorecardData.questions)) {
      scorecardData.questions = [];
    }

    // Ensure scores object exists with all required fields
    if (!scorecardData.scores) {
      scorecardData.scores = {
        overallScore: 0,
        fluency: 0,
        confidence: 0,
        technicalAccuracy: 0,
        keywordUsage: 0,
        aiVideoScore: 0,
        consistencyScore: 0,
      };
    }

    // Ensure extraDimensions object exists
    if (!scorecardData.extraDimensions) {
      scorecardData.extraDimensions = {
        depth: 0,
        structure: 0,
        relevance: 0,
        exampleQuality: 0,
        communicationClarity: 0,
      };
    }

    const scorecard = await Scorecard.create({
      ...scorecardData,
      userId,
    });

    res.json({
      success: true,
      scorecard,
    });
  } catch (err) {
    console.error("Create scorecard error:", err);
    res.status(500).json({ success: false, msg: "Server error", error: err.message });
  }
});

// Upload face photo captured during interview to Cloudinary
// Accepts both multipart/form-data (file) and application/json (imageBuffer hex)
router.post("/upload-face-photo", authMiddleware, upload.single("photo"), async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { sessionId, imageBuffer } = req.body;
    let photoBuffer = req.file?.buffer;

    if (!sessionId || (!photoBuffer && !imageBuffer)) {
      return res.status(400).json({
        success: false,
        error: "Missing sessionId or photo data"
      });
    }

    // Convert hex string to buffer if needed
    if (!photoBuffer && imageBuffer) {
      try {
        photoBuffer = Buffer.from(imageBuffer, 'hex');
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: "Invalid image buffer format"
        });
      }
    }

    // Upload to Cloudinary
    try {
      const cloudinary = require("cloudinary").v2;
      
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });

      // Upload directly from buffer using upload_stream
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const publicId = `interview-faces/${userId}/${sessionId}_${timestamp}`;
      
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            public_id: publicId,
            folder: "interview-faces",
            resource_type: "image",
            overwrite: true
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        stream.end(photoBuffer);
      });

      const cloudinaryUrl = result.secure_url;
      console.log("✅ Face photo uploaded to Cloudinary:", cloudinaryUrl);

      // Save URL to Scorecard
      try {
        const scorecard = await Scorecard.findOne({
          sessionId: sessionId,
          userId: userId
        });

        if (scorecard) {
          scorecard.latestPhotoUrl = cloudinaryUrl;
          await scorecard.save();
          console.log("✅ Photo URL saved to Scorecard:", cloudinaryUrl);
        } else {
          console.warn("⚠️ Scorecard not found for session:", sessionId);
        }
      } catch (dbError) {
        console.error("⚠️ Scorecard update failed:", dbError);
      }

      return res.json({
        success: true,
        url: cloudinaryUrl,
        message: "Face photo uploaded successfully"
      });
    } catch (cloudinaryError) {
      console.error("❌ Cloudinary error:", cloudinaryError);
      return res.status(500).json({
        success: false,
        error: `Cloudinary error: ${cloudinaryError.message}`
      });
    }
  } catch (err) {
    console.error("❌ Face photo upload error:", err);
    res.status(500).json({
      success: false,
      error: `Failed to upload face photo: ${err.message}`
    });
  }
});

export default router;