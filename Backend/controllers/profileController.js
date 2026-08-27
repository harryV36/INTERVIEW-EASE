// controllers/profileController.js
import UserProfile from "../models/UserProfile.js";
import User from "../models/User.js";
import pdfParse from "pdf-parse-fixed";
import mammoth from "mammoth";
import { openRouterChat } from "../services/openRouterClient.js";
import { chargeAiCredits } from "../services/creditService.js";

/* ----------------------------------------
   SAVE / UPDATE PROFILE (Manual Form Save)
----------------------------------------- */
export const saveProfile = async (req, res) => {
  try {
    const data = req.body;

    let userId = null;
    if (req.user?.id) {
      userId = req.user.id;
    } else {
      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) userId = existingUser._id;
    }

    const updateData = {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || "",
      location: data.location || "",
      role: data.role || "",
      bio: data.bio || "",
      skills: data.skills || [],
      experience: data.experience || [],
      socials: data.socials || {},
      // Education fields
      college: data.college || "",
      graduationYear: data.graduationYear || "",
      marks10th: data.marks10th != null ? Number(data.marks10th) : null,
      board10th: data.board10th || "",
      marks12th: data.marks12th != null ? Number(data.marks12th) : null,
      board12th: data.board12th || "",
    };

    if (userId) updateData.userId = userId;

    const profile = await UserProfile.findOneAndUpdate(
      { email: data.email },
      updateData,
      { new: true, upsert: true }
    );

    return res.json({ success: true, profile });
  } catch (err) {
    console.error("Error saving profile:", err);
    return res.status(500).json({ success: false, error: "Failed to save profile" });
  }
};

/* ----------------------------------------
   GET PROFILE BY EMAIL
----------------------------------------- */
export const getProfile = async (req, res) => {
  try {
    const email = req.params.email;
    const profile = await UserProfile.findOne({ email });
    return res.json({ success: true, profile: profile || null });
  } catch (err) {
    console.error("Error fetching profile:", err);
    return res.status(500).json({ success: false, error: "Profile fetch failed" });
  }
};

/* ----------------------------------------
   RESUME UPLOAD → AI PARSE → AUTO-FILL + SAVE
   Uses Groq llama-3.1-8b-instant (fast, free-tier friendly)
   Charges 4 credits per call
----------------------------------------- */
export const parseResumeAndSaveProfile = async (req, res) => {
  try {
    console.log("=== /api/profile/parse-resume hit ===");

    if (!req.file?.buffer) {
      return res.status(400).json({ success: false, error: "Resume file is required" });
    }

    const { originalname, mimetype, buffer } = req.file;

    /* ---- Parse file to text ---- */
    let text = "";
    const isPdf  = /\.pdf$/i.test(originalname) || /pdf/i.test(mimetype);
    const isDocx = /\.docx$/i.test(originalname) || /word/i.test(mimetype);

    if (isPdf) {
      const result = await pdfParse(buffer);
      text = result.text || "";
    } else if (isDocx) {
      const output = await mammoth.extractRawText({ buffer });
      text = output.value || "";
    } else {
      text = buffer.toString("utf8");
    }
    text = text.replace(/\r\n/g, "\n").trim();

    /* ---- Charge 4 credits for AI call ---- */
    let remainingCredits = 0;
    if (req.user?.id) {
      try {
        remainingCredits = await chargeAiCredits(req.user.id, 4);
      } catch (creditErr) {
        return res.status(402).json({ success: false, error: creditErr.message });
      }
    }

    /* ---- AI extraction via Groq ---- */
    const parsedProfile = await extractProfileWithAI(text);

    /* ---- Resolve email + userId ---- */
    let email = parsedProfile.email || null;
    let userId = null;

    if (req.user?.id) {
      const authUser = await User.findById(req.user.id);
      if (authUser) {
        email = authUser.email;
        userId = authUser._id;
      }
    } else if (email) {
      const existing = await User.findOne({ email });
      if (existing) userId = existing._id;
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Could not detect email from resume.",
        parsed: parsedProfile,
      });
    }

    /* ---- Clean experience ---- */
    const sanitizedExperience = Array.isArray(parsedProfile.experience)
      ? parsedProfile.experience
          .map((e) => ({
            company: (e.company || "").trim(),
            title: (e.title || "").trim(),
            year: (e.year || "").trim(),
            description: (e.description || "").trim(),
          }))
          .filter((e) => e.company && e.title && e.year)
      : [];

    /* ---- Upsert profile ---- */
    const updateData = {
      fullName: parsedProfile.fullName || "",
      email,
      phone: parsedProfile.phone || "",
      location: parsedProfile.location || "",
      role: parsedProfile.role || "",
      bio: parsedProfile.bio || "",
      skills: parsedProfile.skills || [],
      experience: sanitizedExperience,
      socials: parsedProfile.socials || {},
      college: parsedProfile.college || "",
      graduationYear: parsedProfile.graduationYear || "",
      marks10th: parsedProfile.marks10th != null ? Number(parsedProfile.marks10th) : null,
      board10th: parsedProfile.board10th || "",
      marks12th: parsedProfile.marks12th != null ? Number(parsedProfile.marks12th) : null,
      board12th: parsedProfile.board12th || "",
    };

    if (userId) updateData.userId = userId;

    const profile = await UserProfile.findOneAndUpdate(
      { email },
      updateData,
      { new: true, upsert: true }
    );

    return res.json({ success: true, profile, parsed: parsedProfile, remainingCredits });
  } catch (err) {
    console.error("Resume parse error:", err);
    return res.status(500).json({ success: false, error: "Resume parse error: " + err.message });
  }
};

/* ----------------------------------------
   AI-powered profile extraction from resume text
   Model: llama-3.1-8b-instant (fast + free-tier friendly)
----------------------------------------- */
async function extractProfileWithAI(rawText) {
  // Truncate to ~4000 chars to stay within token limits for free tier
  const text = rawText.slice(0, 4000);

  const prompt = `You are a resume parser. Extract all information from the resume text below and return ONLY a valid JSON object.

JSON schema:
{
  "fullName": "string",
  "email": "string",
  "phone": "string",
  "location": "string (city, country)",
  "role": "string (current job title or desired role)",
  "bio": "string (professional summary if present, else empty)",
  "skills": ["array of skills as strings"],
  "experience": [{"company": "string", "title": "string", "year": "string e.g. 2022-2024", "description": "string (brief)"}],
  "socials": {"github": "full URL or empty", "linkedin": "full URL or empty", "portfolio": "URL or empty"},
  "marks10th": null or number (percentage, e.g. 89.6),
  "board10th": "string (e.g. CBSE, ICSE, State Board, or empty)",
  "marks12th": null or number (percentage),
  "board12th": "string",
  "college": "string (current or most recent college/university name)",
  "graduationYear": "string (e.g. 2025 or 2023-2027 or empty)"
}

Rules:
- Return ONLY the JSON object, no explanation
- For marks, extract percentage value as a number (e.g. 89.6 not "89.6%")
- If information is not present, use null for numbers and "" for strings
- Extract ALL skills mentioned anywhere in the resume

Resume text:
${text}`;

  try {
    const response = await openRouterChat(
      [{ role: "user", content: prompt }],
      { model: "llama-3.1-8b-instant", json: true }
    );

    if (!response) throw new Error("AI returned null");

    const parsed = JSON.parse(response);
    return parsed;
  } catch (err) {
    console.error("AI extraction failed, falling back to regex:", err.message);
    return fallbackRegexExtract(rawText);
  }
}

/* ---- Fallback regex extraction (used if AI fails) ---- */
function fallbackRegexExtract(text) {
  if (!text) return emptyProfile();

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const email = emailMatch ? emailMatch[0].toLowerCase() : "";

  const phoneMatch = text.match(/(\+?\d[\d\s-]{6,15})/);
  const phone = phoneMatch ? phoneMatch[0] : "";

  let fullName = "";
  for (let i = 0; i < 5; i++) {
    const line = lines[i] || "";
    if (line.includes(email) || line.includes(phone)) continue;
    if (line.split(" ").length >= 2 && line.length < 40) { fullName = line; break; }
  }

  const skillKeywords = [
    "javascript","react","redux","node","express","mongodb","python","django",
    "java","spring","html","css","sql","aws","docker","git","typescript","nextjs",
    "flutter","dart","kotlin","swift","c++","c#","php","ruby","go","rust","vue",
    "angular","tailwind","graphql","rest","api","mysql","postgresql","firebase",
  ];
  const lowerText = text.toLowerCase();
  const skills = skillKeywords.filter((s) => lowerText.includes(s));

  const experience = [];
  lines.forEach((line) => {
    if (/(19|20)\d{2}/.test(line) && line.length < 120) {
      experience.push({
        company: line.split("-")[0].trim(),
        title: "",
        year: line.match(/(19|20)\d{2}/)[0],
        description: "",
      });
    }
  });

  const socials = {};
  const github = text.match(/github\.com\/[A-Za-z0-9_.-]+/i);
  const linkedin = text.match(/linkedin\.com\/in\/[A-Za-z0-9_.-]+/i);
  if (github) socials.github = "https://" + github[0];
  if (linkedin) socials.linkedin = "https://" + linkedin[0];

  // Try to extract marks
  const marks10Match = text.match(/10th[^0-9]*([0-9]{2,3}(?:\.[0-9]+)?)\s*%/i);
  const marks12Match = text.match(/12th[^0-9]*([0-9]{2,3}(?:\.[0-9]+)?)\s*%/i);

  return {
    fullName, email, phone, skills, experience, socials,
    location: "", role: "", bio: "",
    marks10th: marks10Match ? parseFloat(marks10Match[1]) : null,
    marks12th: marks12Match ? parseFloat(marks12Match[1]) : null,
    board10th: "", board12th: "", college: "", graduationYear: "",
  };
}

function emptyProfile() {
  return {
    fullName: "", email: "", phone: "", skills: [], experience: [],
    socials: {}, location: "", role: "", bio: "",
    marks10th: null, marks12th: null, board10th: "", board12th: "",
    college: "", graduationYear: "",
  };
}
