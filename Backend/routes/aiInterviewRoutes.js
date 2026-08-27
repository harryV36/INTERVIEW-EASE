
// // routes/aiInterviewRoutes.jsimport express from "express";
// import authMiddleware from "../middleware/authMiddleware.js";
// import InterviewSession from "../models/InterviewSession.js";
// import Scorecard from "../models/Scorecard.js";
// import { openRouterChat } from "../services/openRouterClient.js";
// import express from "express";
// const router = express.Router();

// /* ----------------------------- Helpers ----------------------------- */

// // Fallback questions when AI fails
// const FALLBACK_QUESTIONS = {
//   mcq: [
//     {
//       id: "mcq-1",
//       section: "DSA / Problem Solving",
//       question: "What is the time complexity of binary search on a sorted array?",
//       options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
//       correctAnswer: "B",
//     },
//     {
//       id: "mcq-2",
//       section: "JavaScript",
//       question: "Which keyword is used to declare a constant in JavaScript?",
//       options: ["var", "let", "const", "static"],
//       correctAnswer: "C",
//     },
//   ],
//   coding: [
//     {
//       id: "code-1",
//       section: "Coding",
//       question: "Write a function to reverse a string in your preferred language.",
//     },
//   ],
// };

// // Safe JSON.parse with fallback (for objects)
// const tryParseJSON = (raw, fallback) => {
//   if (!raw) return fallback;
//   try {
//     if (typeof raw === "object" && raw !== null) return raw;
//     if (typeof raw === "string") return JSON.parse(raw);
//     return fallback;
//   } catch (err) {
//     console.error("tryParseJSON error:", err.message);
//     return fallback;
//   }
// };

// // Clean control characters from JSON string
// const cleanJSONString = (text) => {
//   if (!text || typeof text !== "string") return text;
  
//   return text
//     .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "")
//     .replace(/\t/g, "  ")
//     .replace(/\r\n/g, "\n")
//     .replace(/\r/g, "\n");
// };

// // Enhanced JSON parser with multiple fallback strategies
// const safeParseArray = (raw) => {
//   console.log("=== Starting JSON Parse ===");
//   console.log("Raw input type:", typeof raw);
//   console.log("Raw input preview:", typeof raw === 'string' ? raw.substring(0, 200) : raw);

//   try {
//     if (!raw) {
//       console.error("Empty or null input");
//       return [];
//     }

//     if (Array.isArray(raw)) {
//       console.log("Input is already an array");
//       return raw;
//     }

//     let text = typeof raw === "string" ? raw : JSON.stringify(raw);
    
//     // Clean control characters
//     text = cleanJSONString(text);
    
//     // Remove markdown code blocks
//     text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "");
    
//     // Remove any text before the first [ and after the last ]
//     const start = text.indexOf("[");
//     const end = text.lastIndexOf("]");
    
//     if (start === -1 || end === -1 || end <= start) {
//       console.error("No valid JSON array boundaries found");
//       console.error("Text preview:", text.substring(0, 300));
//       return extractScoringDataManually(text);
//     }

//     const clean = text.substring(start, end + 1);
//     console.log("Extracted JSON:", clean.substring(0, 200));
    
//     // Try to parse the cleaned JSON
//     const parsed = JSON.parse(clean);
    
//     if (!Array.isArray(parsed)) {
//       console.error("Parsed result is not an array");
//       return [];
//     }
    
//     console.log(`Successfully parsed ${parsed.length} items`);
//     return parsed;
    
//   } catch (err) {
//     console.error("=== JSON PARSE FAILED ===");
//     console.error("Error:", err.message);
//     console.error("Raw preview:", typeof raw === 'string' ? raw.substring(0, 500) : raw);
    
//     // Try manual extraction as fallback
//     try {
//       const fallbackData = extractScoringDataManually(raw);
//       if (fallbackData.length > 0) {
//         console.log(`Fallback extraction succeeded: ${fallbackData.length} items`);
//         return fallbackData;
//       }
//     } catch (fallbackErr) {
//       console.error("Fallback extraction failed:", fallbackErr.message);
//     }
    
//     return [];
//   }
// };

// // Manual extraction as last resort
// const extractScoringDataManually = (raw) => {
//   if (!raw || typeof raw !== "string") return [];
  
//   console.log("Attempting manual extraction...");
//   const results = [];
  
//   // Try to extract JSON objects using regex
//   const objectPattern = /\{[^{}]*"index"\s*:\s*\d+[^{}]*\}/g;
//   const matches = raw.match(objectPattern);
  
//   if (matches && matches.length > 0) {
//     console.log(`Found ${matches.length} potential score objects`);
    
//     for (const match of matches) {
//       try {
//         const obj = JSON.parse(match);
//         if (obj.index !== undefined && obj.score !== undefined) {
//           results.push({
//             index: obj.index,
//             score: obj.score || 0,
//             feedback: obj.feedback || "Extracted from partial data",
//             fluency: obj.fluency || 5,
//             confidence: obj.confidence || 5,
//             technicalAccuracy: obj.technicalAccuracy || 5,
//             keywordUsage: obj.keywordUsage || 5,
//             modelAnswer: obj.modelAnswer || ""
//           });
//         }
//       } catch (e) {
//         console.error("Failed to parse individual object:", e.message);
//       }
//     }
//   }
  
//   // If no objects found, try pattern matching for key-value pairs
//   if (results.length === 0) {
//     const scorePattern = /"score"\s*:\s*(\d+)/g;
//     const indexPattern = /"index"\s*:\s*(\d+)/g;
//     const feedbackPattern = /"feedback"\s*:\s*"([^"]+)"/g;
    
//     const scores = [];
//     const indices = [];
//     const feedbacks = [];
    
//     let match;
//     while ((match = scorePattern.exec(raw)) !== null) {
//       scores.push(parseInt(match[1], 10));
//     }
    
//     while ((match = indexPattern.exec(raw)) !== null) {
//       indices.push(parseInt(match[1], 10));
//     }
    
//     while ((match = feedbackPattern.exec(raw)) !== null) {
//       feedbacks.push(match[1]);
//     }
    
//     if (scores.length > 0 && scores.length === indices.length) {
//       console.log(`Extracted ${scores.length} scores via pattern matching`);
//       for (let i = 0; i < scores.length; i++) {
//         results.push({
//           index: indices[i],
//           score: scores[i],
//           feedback: feedbacks[i] || "Score extracted from malformed JSON",
//           fluency: 5,
//           confidence: 5,
//           technicalAccuracy: 5,
//           keywordUsage: 5,
//           modelAnswer: ""
//         });
//       }
//     }
//   }
  
//   console.log(`Manual extraction result: ${results.length} items`);
//   return results;
// };

// /* ============================================================
//    POST /api/ai-interviews/start
// ============================================================ */
// router.post("/start", authMiddleware, async (req, res) => {
//   try {
//     const {
//       targetJobRole,
//       targetCompany,
//       experienceLevel,
//       interviewType,
//       duration,
//       numberOfQuestions,
//       difficulty,
//       techStack,
//       interviewFocus,
//       preferredLanguage,
//       feedbackStyle,
//       customNotes,
//     } = req.body;

//     const totalQ = Number(numberOfQuestions || 10);
//     const mcqCount = Math.max(1, Math.round(totalQ * 0.8));
//     const codingCount = Math.max(1, totalQ - mcqCount);

//     const systemPrompt = `You are an AI interview question generator. You MUST return ONLY valid JSON, nothing else.

// CRITICAL RULES:
// - Return ONLY the JSON object, no explanations
// - Do NOT use markdown code blocks
// - Do NOT include any text before or after the JSON
// - Ensure all strings are properly escaped

// Generate exactly ${mcqCount} MCQs and ${codingCount} coding questions.

// Context:
// - Role: ${targetJobRole || "Software Engineer"}
// - Company: ${targetCompany || "General"}
// - Level: ${experienceLevel || "Mid-level"}
// - Difficulty: ${difficulty || "Medium"}
// - Focus: ${(interviewFocus || []).join(", ") || "General CS"}
// - Tech: ${(techStack || []).join(", ") || "General"}

// Return this EXACT structure:
// {
//   "mcq": [
//     {
//       "id": "mcq-1",
//       "section": "Category Name",
//       "question": "Question text?",
//       "options": ["Option A", "Option B", "Option C", "Option D"],
//       "correctAnswer": "A"
//     }
//   ],
//   "coding": [
//     {
//       "id": "code-1",
//       "section": "Category Name",
//       "question": "Question text"
//     }
//   ]
// }`;

//     const userPrompt = `Generate the interview questions now. Return ONLY valid JSON.`;

//     const raw = await openRouterChat(
//       [
//         { role: "system", content: systemPrompt },
//         { role: "user", content: userPrompt },
//       ],
//       { json: true }
//     );

//     let parsed;
//     if (!raw) {
//       console.error("OpenRouter returned null. Using fallback questions.");
//       parsed = FALLBACK_QUESTIONS;
//     } else {
//       parsed = tryParseJSON(raw, FALLBACK_QUESTIONS);
//     }

//     const questions = [];

//     (parsed.mcq || []).forEach((q) => {
//       questions.push({
//         type: "mcq",
//         section: q.section || "MCQ",
//         question: q.question,
//         options: q.options || [],
//         correctAnswer: q.correctAnswer || "",
//         difficulty: difficulty || "Medium",
//       });
//     });

//     (parsed.coding || []).forEach((q) => {
//       questions.push({
//         type: "coding",
//         section: q.section || "Coding",
//         question: q.question,
//         options: [],
//         correctAnswer: "",
//         difficulty: difficulty || "Medium",
//       });
//     });

//     const session = await InterviewSession.create({
//       user: req.user.id,
//       topics: interviewFocus || [],
//       generatedQuestions: questions,
//       config: {
//         targetJobRole,
//         targetCompany,
//         experienceLevel,
//         interviewType,
//         duration,
//         numberOfQuestions: totalQ,
//         difficulty,
//         techStack,
//         interviewFocus,
//         preferredLanguage,
//         feedbackStyle,
//         customNotes,
//       },
//     });

//     return res.json({
//       success: true,
//       sessionId: session._id,
//       questions: session.generatedQuestions,
//     });
//   } catch (err) {
//     console.error("AI interview start error:", err);
//     return res.status(500).json({
//       success: false,
//       msg: "Failed to start interview",
//     });
//   }
// });

// /* ============================================================
//    GET /api/ai-interviews/session/:id
// ============================================================ */
// router.get("/session/:id", authMiddleware, async (req, res) => {
//   try {
//     const session = await InterviewSession.findById(req.params.id);

//     if (!session || String(session.user) !== String(req.user.id)) {
//       return res.status(404).json({ success: false, msg: "Session not found" });
//     }

//     return res.json({
//       success: true,
//       session: {
//         id: session._id,
//         questions: session.generatedQuestions,
//         generatedQuestions: session.generatedQuestions,
//         config: session.config,
//       },
//     });
//   } catch (err) {
//     console.error("Fetch session error:", err);
//     return res.status(500).json({
//       success: false,
//       msg: "Failed to load session",
//     });
//   }
// });

// /* ============================================================
//    POST /api/ai-interviews/submit/:id
// ============================================================ */
// router.post("/submit/:id", authMiddleware, async (req, res) => {
//   try {
//     const { answers } = req.body;
//     const session = await InterviewSession.findById(req.params.id);

//     if (!session || String(session.user) !== String(req.user.id)) {
//       return res.status(404).json({ success: false, msg: "Session not found" });
//     }

//     const questions = session.generatedQuestions;
//     const answerMap = new Map(
//       (answers || []).map((a) => [String(a.questionId), a.answer])
//     );

//     const questionTexts = [];
//     const submittedAnswers = [];
//     const questionScores = [];
//     const aiFeedback = [];
//     const correctAnswers = [];

//     let mcqTotal = 0;
//     let mcqCorrect = 0;
//     let codingTotal = 0;
//     let codingScoreSum = 0;

//     const codingForAI = [];

//     // First pass: Process MCQs and collect coding questions
//     for (const q of questions) {
//       const qId = String(q._id);
//       const userAnswer = answerMap.get(qId) || "";

//       questionTexts.push(q.question);
//       submittedAnswers.push({
//         answer: userAnswer,
//         questionType: q.type,
//       });

//       if (q.type === "mcq") {
//         mcqTotal += 1;
//         const isCorrect =
//           q.correctAnswer &&
//           userAnswer &&
//           userAnswer.trim().toLowerCase() ===
//             q.correctAnswer.trim().toLowerCase();

//         const score = isCorrect ? 20 : 0;
//         questionScores.push(score);
        
//         // Provide better MCQ feedback
//         let mcqFeedback = "Incorrect answer.";
//         if (isCorrect) {
//           mcqFeedback = "Correct! Well done.";
//         } else if (userAnswer) {
//           mcqFeedback = `Incorrect. The correct answer is option ${q.correctAnswer}.`;
//         } else {
//           mcqFeedback = "No answer provided.";
//         }
        
//         aiFeedback.push({
//           feedback: mcqFeedback,
//           fluency: 0,
//           confidence: 0,
//           technicalAccuracy: isCorrect ? 10 : 0,
//           keywordUsage: 0,
//         });

//         correctAnswers.push({
//           questionId: qId,
//           correct: q.correctAnswer || null,
//         });

//         if (isCorrect) mcqCorrect += 1;
//       } else {
//         // Coding question
//         codingTotal += 1;
//         codingForAI.push({
//           index: codingForAI.length,
//           question: q.question,
//           answer: userAnswer || "No answer provided",
//           section: q.section || "Coding"
//         });
        
//         // Initialize with placeholder values
//         questionScores.push(0);
//         aiFeedback.push({
//           feedback: "Evaluating...",
//           fluency: 5,
//           confidence: 5,
//           technicalAccuracy: 5,
//           keywordUsage: 5,
//         });

//         correctAnswers.push({
//           questionId: qId,
//           correct: null,
//         });
//       }
//     }

//     console.log(`\n=== CODING EVALUATION START ===`);
//     console.log(`Total coding questions: ${codingTotal}`);
//     console.log(`Questions to evaluate:`, codingForAI.length);

//     // ===== AI scoring for coding questions =====
//     if (codingTotal > 0 && codingForAI.length > 0) {
//       const systemPrompt = `You are a technical interview evaluator. You MUST return ONLY valid JSON array format.

// CRITICAL JSON FORMATTING RULES:
// 1. Return ONLY a JSON array, starting with [ and ending with ]
// 2. NO markdown code blocks (no \`\`\`json)
// 3. NO explanations before or after the JSON
// 4. NO trailing commas
// 5. Escape special characters properly:
//    - Newlines as \\n
//    - Tabs as \\t (or use spaces)
//    - Quotes as \\"
//    - Backslashes as \\\\

// SCORING GUIDELINES:
// - Score 0-100 based on correctness, efficiency, and code quality
// - Provide constructive feedback (100-150 chars)
// - Rate fluency, confidence, technical accuracy, keyword usage (0-10 scale)
// - Include a reference solution in modelAnswer with proper escaping

// EXAMPLE OUTPUT FORMAT (copy this structure exactly):
// [
//   {
//     "index": 0,
//     "score": 75,
//     "feedback": "Good approach but missing edge case handling. Consider null checks.",
//     "fluency": 7,
//     "confidence": 8,
//     "technicalAccuracy": 7,
//     "keywordUsage": 6,
//     "modelAnswer": "function reverseString(str) {\\n  if (!str) return '';\\n  return str.split('').reverse().join('');\\n}"
//   }
// ]`;

//       const questionsText = codingForAI.map((item, idx) => 
//         `Question ${idx} (${item.section}):\n${item.question}\n\nCandidate's Answer:\n${item.answer}\n`
//       ).join('\n---\n\n');

//       const userPrompt = `Evaluate these ${codingForAI.length} coding answer(s).

// ${questionsText}

// Return ONLY a JSON array with ${codingForAI.length} object(s). Start your response with [ and end with ]. No other text.`;

//       console.log("\n=== Sending to AI ===");
//       console.log("Questions being evaluated:", codingForAI.length);

//       let rawEval;
//       try {
//         rawEval = await openRouterChat(
//           [
//             { role: "system", content: systemPrompt },
//             { role: "user", content: userPrompt },
//           ],
//           { json: true }
//         );
        
//         console.log("\n=== AI Response Received ===");
//         console.log("Response type:", typeof rawEval);
//         console.log("Response preview:", typeof rawEval === 'string' 
//           ? rawEval.substring(0, 300) 
//           : JSON.stringify(rawEval).substring(0, 300));
        
//       } catch (aiError) {
//         console.error("AI API call failed:", aiError);
//         rawEval = null;
//       }

//       const parsedEval = safeParseArray(rawEval);

//       console.log("\n=== Parse Results ===");
//       console.log("Successfully parsed items:", parsedEval.length);
//       console.log("Expected items:", codingForAI.length);

//       if (parsedEval.length === 0) {
//         console.error("❌ CRITICAL: No scores parsed from AI response");
//         console.error("Raw response:", rawEval?.substring?.(0, 1000));
        
//         // Apply default scoring for all coding questions
//         let codingIndex = 0;
//         for (let i = 0; i < questions.length; i++) {
//           if (questions[i].type === "coding") {
//             const userAnswer = answerMap.get(String(questions[i]._id)) || "";
//             const hasAnswer = userAnswer.trim().length > 0;
            
//             questionScores[i] = hasAnswer ? 10 : 0; // Give partial credit if answered
//             aiFeedback[i] = {
//               feedback: hasAnswer 
//                 ? "Your answer was received but AI evaluation is temporarily unavailable. You've been given partial credit. A detailed review may be provided later."
//                 : "No answer was provided for this question.",
//               fluency: 5,
//               confidence: 5,
//               technicalAccuracy: hasAnswer ? 5 : 0,
//               keywordUsage: 5,
//             };
//             codingIndex++;
//           }
//         }
//       } else {
//         console.log("✓ Successfully parsed AI evaluation");
        
//         // Map AI scores to questions
//         let codingIndex = 0;
//         for (let i = 0; i < questions.length; i++) {
//           if (questions[i].type === "coding") {
//             const evalObj = parsedEval.find((p) => p.index === codingIndex);
            
//             if (evalObj) {
//               const score = Math.max(0, Math.min(100, Number(evalObj.score || 0)));
//               questionScores[i] = (score / 100) * 20;
              
//               aiFeedback[i] = {
//                 feedback: evalObj.feedback || "Evaluation completed.",
//                 fluency: Math.max(0, Math.min(10, Number(evalObj.fluency ?? 5))),
//                 confidence: Math.max(0, Math.min(10, Number(evalObj.confidence ?? 5))),
//                 technicalAccuracy: Math.max(0, Math.min(10, Number(evalObj.technicalAccuracy ?? 5))),
//                 keywordUsage: Math.max(0, Math.min(10, Number(evalObj.keywordUsage ?? 5))),
//               };
              
//               codingScoreSum += score;

//               // Store model answer if provided
//               if (evalObj.modelAnswer && typeof evalObj.modelAnswer === "string") {
//                 const cleanModelAnswer = evalObj.modelAnswer.trim();
//                 if (cleanModelAnswer.length > 0) {
//                   correctAnswers[i].correct = cleanModelAnswer;
//                 }
//               }
              
//               console.log(`✓ Question ${codingIndex}: Score ${score}/100, Feedback: "${evalObj.feedback?.substring(0, 50)}..."`);
//             } else {
//               console.warn(`⚠ No evaluation found for coding question ${codingIndex}`);
              
//               const userAnswer = answerMap.get(String(questions[i]._id)) || "";
//               const hasAnswer = userAnswer.trim().length > 0;
              
//               questionScores[i] = hasAnswer ? 10 : 0;
//               aiFeedback[i].feedback = hasAnswer
//                 ? "Answer received but not fully evaluated. Partial credit given."
//                 : "No answer provided.";
//             }
//             codingIndex++;
//           }
//         }
//       }
//     }

//     console.log("\n=== SCORING SUMMARY ===");
//     console.log(`MCQ: ${mcqCorrect}/${mcqTotal} correct`);
//     console.log(`Coding: ${codingTotal} questions, avg score: ${codingTotal > 0 ? (codingScoreSum / codingTotal).toFixed(1) : 0}`);

//     // ===== Overall scoring =====
//     const mcqPercent = mcqTotal > 0 ? (mcqCorrect / mcqTotal) * 100 : 0;
//     const codingAverage = codingTotal > 0 ? codingScoreSum / codingTotal : 0;

//     const overallScore = mcqTotal > 0 && codingTotal > 0
//       ? mcqPercent * 0.8 + codingAverage * 0.2
//       : mcqTotal > 0
//       ? mcqPercent
//       : codingAverage;

//     let overallBand = "Needs Improvement";
//     if (overallScore >= 80) overallBand = "Excellent";
//     else if (overallScore >= 60) overallBand = "Good";
//     else if (overallScore >= 40) overallBand = "Average";

//     const scores = {
//       overallScore,
//       fluency: 5,
//       confidence: 5,
//       technicalAccuracy: 5,
//       keywordUsage: 5,
//       aiVideoScore: 0,
//       consistencyScore: 0,
//     };

//     const extraDimensions = {
//       depth: 0,
//       structure: 0,
//       relevance: 0,
//       exampleQuality: 0,
//       communicationClarity: 0,
//     };

//     const scorecard = await Scorecard.create({
//       userId: req.user.id,
//       scores,
//       extraDimensions,
//       overallBand,
//       overallMessage:
//         mcqTotal > 0 && codingTotal > 0
//           ? "Score combines 80% MCQ accuracy and 20% coding answer quality."
//           : mcqTotal > 0
//           ? "Score based on MCQ accuracy."
//           : "Score based on coding answer quality.",
//       globalImprovementTips: [],
//       questions: questionTexts,
//       questionScores,
//       submittedAnswers,
//       aiFeedback,
//       correctAnswers,
//       sessionId: String(session._id),
//       role: session?.config?.targetJobRole || "",
//       mcqSummary: {
//         totalQuestions: mcqTotal,
//         correct: mcqCorrect,
//         scorePercent: mcqPercent,
//       },
//       codingSummary: {
//         totalQuestions: codingTotal,
//         averageScore: codingAverage,
//       },
//     });

//     session.score = overallScore;
//     session.scorecardId = scorecard._id;
//     await session.save();

//     console.log(`\n✓ Scorecard created: ${scorecard._id}`);
//     console.log(`✓ Overall score: ${overallScore.toFixed(1)}/100 (${overallBand})\n`);

//     return res.json({
//       success: true,
//       scorecardId: scorecard._id,
//       overallScore,
//     });
//   } catch (err) {
//     console.error("Submit interview error:", err);
//     return res.status(500).json({
//       success: false,
//       msg: "Failed to submit interview",
//     });
//   }
// });

// export default router;

// routes/aiInterviewRoutes.js - Enhanced with custom fields support
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import InterviewSession from "../models/InterviewSession.js";
import Scorecard from "../models/Scorecard.js";
import Task from "../models/Task.js";
import ScheduledInterview from "../models/ScheduledInterview.js";
import { openRouterChat } from "../services/openRouterClient.js";
import { chargeAiCredits } from "../services/creditService.js";

const router = express.Router();

/* ----------------------------- Helpers ----------------------------- */

const FALLBACK_QUESTIONS = {
  mcq: [
    {
      id: "mcq-1",
      section: "DSA / Problem Solving",
      question: "What is the time complexity of binary search on a sorted array?",
      options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
      correctAnswer: "B",
    },
    {
      id: "mcq-2",
      section: "JavaScript",
      question: "Which keyword is used to declare a constant in JavaScript?",
      options: ["var", "let", "const", "static"],
      correctAnswer: "C",
    },
  ],
  coding: [
    {
      id: "code-1",
      section: "Coding",
      question: "Write a function to reverse a string in your preferred language.",
    },
  ],
};

const tryParseJSON = (raw, fallback) => {
  if (!raw) return fallback;
  try {
    if (typeof raw === "object" && raw !== null) return raw;
    if (typeof raw === "string") return JSON.parse(raw);
    return fallback;
  } catch (err) {
    console.error("tryParseJSON error:", err.message);
    return fallback;
  }
};

const cleanJSONString = (text) => {
  if (!text || typeof text !== "string") return text;
  
  return text
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\t/g, "  ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
};

const safeParseArray = (raw) => {
  console.log("=== Starting JSON Parse ===");
  console.log("Raw input type:", typeof raw);

  try {
    if (!raw) {
      console.error("Empty or null input");
      return [];
    }

    if (Array.isArray(raw)) {
      console.log("Input is already an array");
      return raw;
    }

    let text = typeof raw === "string" ? raw : JSON.stringify(raw);
    
    text = cleanJSONString(text);
    text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "");
    
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    
    if (start === -1 || end === -1 || end <= start) {
      console.error("No valid JSON array boundaries found");
      return extractScoringDataManually(text);
    }

    const clean = text.substring(start, end + 1);
    const parsed = JSON.parse(clean);
    
    if (!Array.isArray(parsed)) {
      console.error("Parsed result is not an array");
      return [];
    }
    
    console.log(`Successfully parsed ${parsed.length} items`);
    return parsed;
    
  } catch (err) {
    console.error("=== JSON PARSE FAILED ===");
    console.error("Error:", err.message);
    
    try {
      const fallbackData = extractScoringDataManually(raw);
      if (fallbackData.length > 0) {
        console.log(`Fallback extraction succeeded: ${fallbackData.length} items`);
        return fallbackData;
      }
    } catch (fallbackErr) {
      console.error("Fallback extraction failed:", fallbackErr.message);
    }
    
    return [];
  }
};

const extractScoringDataManually = (raw) => {
  if (!raw || typeof raw !== "string") return [];
  
  console.log("Attempting manual extraction...");
  const results = [];
  
  const objectPattern = /\{[^{}]*"index"\s*:\s*\d+[^{}]*\}/g;
  const matches = raw.match(objectPattern);
  
  if (matches && matches.length > 0) {
    console.log(`Found ${matches.length} potential score objects`);
    
    for (const match of matches) {
      try {
        const obj = JSON.parse(match);
        if (obj.index !== undefined && obj.score !== undefined) {
          results.push({
            index: obj.index,
            score: obj.score || 0,
            feedback: obj.feedback || "Extracted from partial data",
            fluency: obj.fluency || 5,
            confidence: obj.confidence || 5,
            technicalAccuracy: obj.technicalAccuracy || 5,
            keywordUsage: obj.keywordUsage || 5,
            modelAnswer: obj.modelAnswer || ""
          });
        }
      } catch (e) {
        console.error("Failed to parse individual object:", e.message);
      }
    }
  }
  
  if (results.length === 0) {
    const scorePattern = /"score"\s*:\s*(\d+)/g;
    const indexPattern = /"index"\s*:\s*(\d+)/g;
    const feedbackPattern = /"feedback"\s*:\s*"([^"]+)"/g;
    
    const scores = [];
    const indices = [];
    const feedbacks = [];
    
    let match;
    while ((match = scorePattern.exec(raw)) !== null) {
      scores.push(parseInt(match[1], 10));
    }
    
    while ((match = indexPattern.exec(raw)) !== null) {
      indices.push(parseInt(match[1], 10));
    }
    
    while ((match = feedbackPattern.exec(raw)) !== null) {
      feedbacks.push(match[1]);
    }
    
    if (scores.length > 0 && scores.length === indices.length) {
      console.log(`Extracted ${scores.length} scores via pattern matching`);
      for (let i = 0; i < scores.length; i++) {
        results.push({
          index: indices[i],
          score: scores[i],
          feedback: feedbacks[i] || "Score extracted from malformed JSON",
          fluency: 5,
          confidence: 5,
          technicalAccuracy: 5,
          keywordUsage: 5,
          modelAnswer: ""
        });
      }
    }
  }
  
  console.log(`Manual extraction result: ${results.length} items`);
  return results;
};

/* ============================================================
   POST /api/ai-interviews/start
============================================================ */
router.post("/start", authMiddleware, async (req, res) => {
  try {
    const {
      targetJobRole,
      targetCompany,
      experienceLevel,
      interviewType,
      duration,
      numberOfQuestions,
      difficulty,
      techStack,
      interviewFocus,
      preferredLanguage,
      feedbackStyle,
      customNotes,
      taskId,
      taskToken,
    } = req.body;

    const totalQ = Number(numberOfQuestions || 10);
    const mcqCount = Math.max(1, Math.round(totalQ * 0.8));
    const codingCount = Math.max(1, totalQ - mcqCount);

    // 🆕 Fetch task if taskId or taskToken provided
    let task = null;
    let customFieldsContext = "";
    
    if (taskId) {
      task = await Task.findById(taskId);
    } else if (taskToken) {
      task = await Task.findOne({ "assignedTo.accessToken": taskToken });
    }

    // 🆕 Build custom fields context
    if (task && task.customFields && task.customFields.length > 0) {
      customFieldsContext = "\n\n=== ADDITIONAL ORGANIZATIONAL CONTEXT ===\n";
      customFieldsContext += "The organization has provided the following specific requirements and context:\n\n";
      
      task.customFields.forEach((field) => {
        customFieldsContext += `• ${field.fieldName}: ${field.fieldValue}\n`;
      });
      
      customFieldsContext += "\nPlease consider these organizational requirements when generating interview questions. Tailor questions to reflect these specific contexts, constraints, or expectations.\n";
    }

    // 🆕 Enhanced system prompt with custom fields
    const systemPrompt = `You are an AI interview question generator. You MUST return ONLY valid JSON, nothing else.

CRITICAL RULES:
- Return ONLY the JSON object, no explanations
- Do NOT use markdown code blocks
- Do NOT include any text before or after the JSON
- Ensure all strings are properly escaped

Generate exactly ${mcqCount} MCQs and ${codingCount} coding questions.

Context:
- Role: ${targetJobRole || "Software Engineer"}
- Company: ${targetCompany || "General"}
- Level: ${experienceLevel || "Mid-level"}
- Difficulty: ${difficulty || "Medium"}
- Focus: ${(interviewFocus || []).join(", ") || "General CS"}
- Tech: ${(techStack || []).join(", ") || "General"}
- Interview Type: ${(interviewType || []).join(", ") || "General"}
- Language Preference: ${preferredLanguage || "English"}
- Feedback Style: ${feedbackStyle || "Balanced"}

${customNotes ? `\n=== SPECIAL INSTRUCTIONS ===\n${customNotes}\n` : ""}

${customFieldsContext}

IMPORTANT: If custom organizational context is provided above, ensure that:
1. Questions are aligned with the mentioned organizational requirements
2. Scenarios reflect the specific context (e.g., project type, team size, tech constraints)
3. Difficulty and scope match the organizational needs
4. Technical questions use relevant technologies mentioned in the context

Return this EXACT structure:
{
  "mcq": [
    {
      "id": "mcq-1",
      "section": "Category Name",
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "A"
    }
  ],
  "coding": [
    {
      "id": "code-1",
      "section": "Category Name",
      "question": "Question text"
    }
  ]
}`;

    const userPrompt = `Generate the interview questions now. Return ONLY valid JSON.`;

    console.log("\n🎯 Generating interview with custom context...");
    if (task) {
      console.log("📋 Task ID:", task._id);
      console.log("🏢 Custom Fields:", task.customFields?.length || 0);
    }

    await chargeAiCredits(req.user.id);
    const raw = await openRouterChat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { json: true }
    );

    let parsed;
    if (!raw) {
      console.error("OpenRouter returned null. Using fallback questions.");
      parsed = FALLBACK_QUESTIONS;
    } else {
      parsed = tryParseJSON(raw, FALLBACK_QUESTIONS);
    }

    const questions = [];

    (parsed.mcq || []).forEach((q) => {
      questions.push({
        type: "mcq",
        section: q.section || "MCQ",
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer || "",
        difficulty: difficulty || "Medium",
      });
    });

    (parsed.coding || []).forEach((q) => {
      questions.push({
        type: "coding",
        section: q.section || "Coding",
        question: q.question,
        options: [],
        correctAnswer: "",
        difficulty: difficulty || "Medium",
      });
    });

    const session = await InterviewSession.create({
      user: req.user.id,
      topics: interviewFocus || [],
      generatedQuestions: questions,
      config: {
        targetJobRole,
        targetCompany,
        experienceLevel,
        interviewType,
        duration,
        numberOfQuestions: totalQ,
        difficulty,
        techStack,
        interviewFocus,
        preferredLanguage,
        feedbackStyle,
        customNotes,
      },
      // 🆕 Store task reference
      taskId: task?._id,
    });

    console.log("✅ Interview session created:", session._id);
    console.log("📝 Questions generated:", questions.length);

    return res.json({
      success: true,
      sessionId: session._id,
      questions: session.generatedQuestions,
    });
  } catch (err) {
    console.error("AI interview start error:", err);
    return res.status(err.statusCode || 500).json({
      success: false,
      msg: err.statusCode ? err.message : "Failed to start interview",
    });
  }
});

/* ============================================================
   GET /api/ai-interviews/session/:id
============================================================ */
router.get("/session/:id", authMiddleware, async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id);

    if (!session || String(session.user) !== String(req.user.id)) {
      return res.status(404).json({ success: false, msg: "Session not found" });
    }

    return res.json({
      success: true,
      session: {
        id: session._id,
        questions: session.generatedQuestions,
        generatedQuestions: session.generatedQuestions,
        config: session.config,
      },
    });
  } catch (err) {
    console.error("Fetch session error:", err);
    return res.status(500).json({
      success: false,
      msg: "Failed to load session",
    });
  }
});

/* ============================================================
   POST /api/ai-interviews/submit/:id
============================================================ */
router.post("/submit/:id", authMiddleware, async (req, res) => {
  try {
    const { answers } = req.body;
    const session = await InterviewSession.findById(req.params.id);

    if (!session || String(session.user) !== String(req.user.id)) {
      return res.status(404).json({ success: false, msg: "Session not found" });
    }

    const questions = session.generatedQuestions;
    const answerMap = new Map(
      (answers || []).map((a) => [String(a.questionId), a.answer])
    );

    const questionTexts = [];
    const submittedAnswers = [];
    const questionScores = [];
    const aiFeedback = [];
    const correctAnswers = [];

    let mcqTotal = 0;
    let mcqCorrect = 0;
    let codingTotal = 0;
    let codingScoreSum = 0;

    const codingForAI = [];

    // First pass: Process MCQs and collect coding questions
    for (const q of questions) {
      const qId = String(q._id);
      const userAnswer = answerMap.get(qId) || "";

      questionTexts.push(q.question);
      submittedAnswers.push({
        answer: userAnswer,
        questionType: q.type,
      });

      if (q.type === "mcq") {
        mcqTotal += 1;
        const isCorrect =
          q.correctAnswer &&
          userAnswer &&
          userAnswer.trim().toLowerCase() ===
            q.correctAnswer.trim().toLowerCase();

        const score = isCorrect ? 20 : 0;
        questionScores.push(score);
        
        let mcqFeedback = "Incorrect answer.";
        if (isCorrect) {
          mcqFeedback = "Correct! Well done.";
        } else if (userAnswer) {
          mcqFeedback = `Incorrect. The correct answer is option ${q.correctAnswer}.`;
        } else {
          mcqFeedback = "No answer provided.";
        }
        
        aiFeedback.push({
          feedback: mcqFeedback,
          fluency: 0,
          confidence: 0,
          technicalAccuracy: isCorrect ? 10 : 0,
          keywordUsage: 0,
        });

        correctAnswers.push({
          questionId: qId,
          correct: q.correctAnswer || null,
        });

        if (isCorrect) mcqCorrect += 1;
      } else {
        codingTotal += 1;
        codingForAI.push({
          index: codingForAI.length,
          question: q.question,
          answer: userAnswer || "No answer provided",
          section: q.section || "Coding"
        });
        
        questionScores.push(0);
        aiFeedback.push({
          feedback: "Evaluating...",
          fluency: 5,
          confidence: 5,
          technicalAccuracy: 5,
          keywordUsage: 5,
        });

        correctAnswers.push({
          questionId: qId,
          correct: null,
        });
      }
    }

    console.log(`\n=== CODING EVALUATION START ===`);
    console.log(`Total coding questions: ${codingTotal}`);

    // AI scoring for coding questions
    if (codingTotal > 0 && codingForAI.length > 0) {
      const systemPrompt = `You are a technical interview evaluator. You MUST return ONLY valid JSON array format.

CRITICAL JSON FORMATTING RULES:
1. Return ONLY a JSON array, starting with [ and ending with ]
2. NO markdown code blocks (no \`\`\`json)
3. NO explanations before or after the JSON
4. NO trailing commas
5. Escape special characters properly

SCORING GUIDELINES:
- Score 0-100 based on correctness, efficiency, and code quality
- Provide constructive feedback (100-150 chars)
- Rate fluency, confidence, technical accuracy, keyword usage (0-10 scale)
- Include a reference solution in modelAnswer

EXAMPLE OUTPUT FORMAT:
[
  {
    "index": 0,
    "score": 75,
    "feedback": "Good approach but missing edge case handling.",
    "fluency": 7,
    "confidence": 8,
    "technicalAccuracy": 7,
    "keywordUsage": 6,
    "modelAnswer": "function reverseString(str) { return str.split('').reverse().join(''); }"
  }
]`;

      const questionsText = codingForAI.map((item, idx) => 
        `Question ${idx} (${item.section}):\n${item.question}\n\nCandidate's Answer:\n${item.answer}\n`
      ).join('\n---\n\n');

      const userPrompt = `Evaluate these ${codingForAI.length} coding answer(s).

${questionsText}

Return ONLY a JSON array with ${codingForAI.length} object(s). Start with [ and end with ]. No other text.`;

      console.log("\n=== Sending to AI ===");

      let rawEval;
      try {
        await chargeAiCredits(req.user.id);
        rawEval = await openRouterChat(
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          { json: true }
        );
        
        console.log("\n=== AI Response Received ===");
        
      } catch (aiError) {
        console.error("AI API call failed:", aiError);
        rawEval = null;
      }

      const parsedEval = safeParseArray(rawEval);

      console.log("\n=== Parse Results ===");
      console.log("Successfully parsed items:", parsedEval.length);

      if (parsedEval.length === 0) {
        console.error("❌ CRITICAL: No scores parsed from AI response");
        
        let codingIndex = 0;
        for (let i = 0; i < questions.length; i++) {
          if (questions[i].type === "coding") {
            const userAnswer = answerMap.get(String(questions[i]._id)) || "";
            const hasAnswer = userAnswer.trim().length > 0;
            
            questionScores[i] = hasAnswer ? 10 : 0;
            aiFeedback[i] = {
              feedback: hasAnswer 
                ? "Your answer was received but AI evaluation is temporarily unavailable."
                : "No answer provided.",
              fluency: 5,
              confidence: 5,
              technicalAccuracy: hasAnswer ? 5 : 0,
              keywordUsage: 5,
            };
            codingIndex++;
          }
        }
      } else {
        console.log("✓ Successfully parsed AI evaluation");
        
        let codingIndex = 0;
        for (let i = 0; i < questions.length; i++) {
          if (questions[i].type === "coding") {
            const evalObj = parsedEval.find((p) => p.index === codingIndex);
            
            if (evalObj) {
              const score = Math.max(0, Math.min(100, Number(evalObj.score || 0)));
              questionScores[i] = (score / 100) * 20;
              
              aiFeedback[i] = {
                feedback: evalObj.feedback || "Evaluation completed.",
                fluency: Math.max(0, Math.min(10, Number(evalObj.fluency ?? 5))),
                confidence: Math.max(0, Math.min(10, Number(evalObj.confidence ?? 5))),
                technicalAccuracy: Math.max(0, Math.min(10, Number(evalObj.technicalAccuracy ?? 5))),
                keywordUsage: Math.max(0, Math.min(10, Number(evalObj.keywordUsage ?? 5))),
              };
              
              codingScoreSum += score;

              if (evalObj.modelAnswer && typeof evalObj.modelAnswer === "string") {
                const cleanModelAnswer = evalObj.modelAnswer.trim();
                if (cleanModelAnswer.length > 0) {
                  correctAnswers[i].correct = cleanModelAnswer;
                }
              }
              
              console.log(`✓ Question ${codingIndex}: Score ${score}/100`);
            }
            codingIndex++;
          }
        }
      }
    }

    console.log("\n=== SCORING SUMMARY ===");
    console.log(`MCQ: ${mcqCorrect}/${mcqTotal} correct`);
    console.log(`Coding: ${codingTotal} questions`);

    const mcqPercent = mcqTotal > 0 ? (mcqCorrect / mcqTotal) * 100 : 0;
    const codingAverage = codingTotal > 0 ? codingScoreSum / codingTotal : 0;

    const overallScore = mcqTotal > 0 && codingTotal > 0
      ? mcqPercent * 0.8 + codingAverage * 0.2
      : mcqTotal > 0
      ? mcqPercent
      : codingAverage;

    let overallBand = "Needs Improvement";
    if (overallScore >= 80) overallBand = "Excellent";
    else if (overallScore >= 60) overallBand = "Good";
    else if (overallScore >= 40) overallBand = "Average";

    const scores = {
      overallScore,
      fluency: 5,
      confidence: 5,
      technicalAccuracy: 5,
      keywordUsage: 5,
      aiVideoScore: 0,
      consistencyScore: 0,
    };

    const scorecard = await Scorecard.create({
      userId: req.user.id,
      scores,
      overallBand,
      overallMessage: "Interview evaluation complete",
      questions: questionTexts,
      questionScores,
      submittedAnswers,
      aiFeedback,
      correctAnswers,
      sessionId: String(session._id),
      role: session?.config?.targetJobRole || "",
      mcqSummary: {
        totalQuestions: mcqTotal,
        correct: mcqCorrect,
        scorePercent: mcqPercent,
      },
      codingSummary: {
        totalQuestions: codingTotal,
        averageScore: codingAverage,
      },
    });

    session.score = overallScore;
    session.scorecardId = scorecard._id;
    await session.save();

    // 🆕 Update task if this was a task-based interview
    if (session.taskId) {
      try {
        const task = await Task.findById(session.taskId);
        if (task) {
          const assignment = task.assignedTo.find(
            a => String(a.userId) === String(req.user.id)
          );
          
          if (assignment) {
            assignment.status = "completed";
            assignment.scorecardId = scorecard._id;
            assignment.completionScore = overallScore;
            assignment.completedAt = new Date();
            
            await task.save();
            console.log("✅ Task updated with completion data");
          }
        }
      } catch (taskErr) {
        console.error("Error updating task:", taskErr);
      }
    }

    // 🆕 Update scheduled interview if linked to this session
    try {
      const scheduledInterview = await ScheduledInterview.findOne({
        sessionId: session._id,
      });

      if (scheduledInterview) {
        scheduledInterview.status = "completed";
        scheduledInterview.scorecardId = scorecard._id;
        await scheduledInterview.save();
        console.log("✅ Scheduled interview marked completed");
      }
    } catch (scheduledErr) {
      console.error("Error updating scheduled interview:", scheduledErr);
    }

    console.log(`\n✓ Scorecard created: ${scorecard._id}`);
    console.log(`✓ Overall score: ${overallScore.toFixed(1)}/100 (${overallBand})\n`);

    return res.json({
      success: true,
      scorecardId: scorecard._id,
      overallScore,
    });
  } catch (err) {
    console.error("Submit interview error:", err);
    return res.status(err.statusCode || 500).json({
      success: false,
      msg: err.statusCode ? err.message : "Failed to submit interview",
    });
  }
});

export default router;
