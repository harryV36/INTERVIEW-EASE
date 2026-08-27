// src/components/interviewQuestion/ScorecardPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const LETTERS = "ABCD";

const ScorecardPage = () => {
  const { scorecardId } = useParams();
  const navigate = useNavigate();

  const [scorecard, setScorecard] = useState(null);
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        if (!token) {
          setError("Authentication token missing. Please log in again.");
          setLoading(false);
          return;
        }

        // 1) Get scorecard document
        const resSc = await axios.get(
          `http://localhost:8000/api/scorecards/${scorecardId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!resSc.data.success || !resSc.data.scorecard) {
          setError("Scorecard not found.");
          setLoading(false);
          return;
        }

        const sc = resSc.data.scorecard;
        setScorecard(sc);

        // 2) Get original interview session (for options, types, etc.)
        if (sc.sessionId) {
          try {
            const resSession = await axios.get(
              `http://localhost:8000/api/ai-interviews/session/${sc.sessionId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (resSession.data.success && resSession.data.session) {
              const q =
                resSession.data.session.questions ||
                resSession.data.session.generatedQuestions ||
                [];
              setSessionQuestions(q);
            }
          } catch (err) {
            console.error("Failed to fetch session for scorecard:", err);
          }
        }
      } catch (err) {
        console.error("Error fetching scorecard:", err);
        setError("Failed to load scorecard. Check your backend.");
      } finally {
        setLoading(false);
      }
    };

    if (scorecardId) {
      fetchData();
    } else {
      setError("No scorecard ID in URL.");
      setLoading(false);
    }
  }, [scorecardId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 text-sm">Loading scorecard…</p>
      </div>
    );
  }

  if (error || !scorecard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="bg-white rounded-2xl shadow-md p-6 max-w-md w-full text-center">
          <p className="text-red-600 text-sm mb-4">
            {error || "Scorecard not found."}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-full bg-indigo-500 text-white text-xs font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const {
    scores = {},
    overallBand,
    overallMessage,
    questions = [],
    questionScores = [],
    submittedAnswers = [],
    aiFeedback = [],
    correctAnswers = [],
    mcqSummary,
    codingSummary,
    createdAt,
    role,
  } = scorecard;

  const overallScore = scores?.overallScore ?? 0;

  const getSessionQuestion = (idx) => sessionQuestions[idx] || null;

  const getCorrectLetter = (idx) => {
    const ca = correctAnswers[idx];
    return ca?.correct || null;
  };

  const getUserRawAnswer = (idx) =>
    submittedAnswers[idx]?.answer || "";

  const mapLetterToText = (letter, sq) => {
    if (!sq || !Array.isArray(sq.options)) return letter;
    const pos = LETTERS.indexOf((letter || "").toUpperCase());
    if (pos < 0) return letter;
    return sq.options[pos] || letter;
  };

  // For MCQ: map letter -> option text
  // For Coding: use stored model solution (full code)
  const getCorrectAnswer = (idx) => {
    const sq = getSessionQuestion(idx);
    if (!sq) return { type: "unknown", text: null };

    if (sq.type === "coding") {
      const entry = correctAnswers[idx];
      const text = entry?.correct || null; // this should be modelAnswer (code)
      return { type: "coding", text };
    }

    // MCQ
    const correctLetter =
      getCorrectLetter(idx) || sq.correctAnswer || "";

    if (!correctLetter) return { type: "mcq", text: null };

    const text = mapLetterToText(correctLetter, sq);
    return { type: "mcq", text };
  };

  const getUserAnswerText = (idx) => {
    const sq = getSessionQuestion(idx);
    const raw = getUserRawAnswer(idx);

    if (!raw) return "Not answered";
    if (!sq || sq.type === "coding") return raw;

    return mapLetterToText(raw, sq);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Interview Scorecard
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Role: <span className="font-medium">{role || "Unknown Role"}</span>
            </p>
            <p className="text-[11px] text-slate-400">
              Date: {createdAt ? new Date(createdAt).toLocaleString() : "—"}
            </p>
          </div>
          <button
            onClick={() => navigate("/profile/scores")}
            className="text-xs text-slate-600 underline hover:text-slate-900"
          >
            Back to Scores
          </button>
        </div>

        {/* Interview Proof - Photo Display */}
        {scorecard.latestPhotoUrl && (
          <div className="bg-white rounded-3xl shadow-md border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              📸 Interview Proof
            </h3>
            <div className="flex gap-6">
              <img
                src={scorecard.latestPhotoUrl}
                alt="Interview Proof"
                className="w-32 h-32 object-cover rounded-2xl border-2 border-slate-300 shadow-md"
              />
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-sm text-slate-700 font-medium">
                  Interview Completed Successfully ✅
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  This image serves as proof of interview completion. It was captured during the interview session.
                </p>
                <p className="text-xs text-slate-400 mt-3">
                  Image URL: {scorecard.latestPhotoUrl.substring(0, 50)}...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">Overall Score</p>
            <p className="text-3xl font-bold text-slate-900">
              {overallScore.toFixed(1)}
              <span className="text-sm text-slate-500 ml-1">/ 100</span>
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {overallMessage ||
                "Score combines MCQ accuracy and coding answer quality."}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">Performance Band</p>
            <p className="text-lg font-semibold text-indigo-600">
              {overallBand}
            </p>
            {mcqSummary && (
              <p className="mt-2 text-xs text-slate-500">
                MCQs: {mcqSummary.correct}/{mcqSummary.totalQuestions} correct (
                {mcqSummary.scorePercent?.toFixed(1)}%)
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">Coding Summary</p>
            {codingSummary ? (
              <>
                <p className="text-sm text-slate-900">
                  Questions: {codingSummary.totalQuestions}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Avg score: {codingSummary.averageScore?.toFixed(1)} / 100
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-500">No coding questions.</p>
            )}
          </div>
        </div>

        {/* Question-wise breakdown */}
        <div className="bg-white rounded-3xl shadow-md border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Question-wise Breakdown
          </h2>

          {questions.length === 0 ? (
            <p className="text-xs text-slate-500">No question data found.</p>
          ) : (
            <div className="space-y-3">
              {questions.map((qText, idx) => {
                const score = questionScores[idx] ?? 0;
                const fb = aiFeedback[idx] || {};
                const userAnsText = getUserAnswerText(idx);
                const { type: qType, text: correctText } = getCorrectAnswer(idx);

                return (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-2xl p-3 bg-slate-50/60 space-y-2"
                  >
                    {/* QUESTION */}
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="text-[11px] text-slate-500 mb-1">
                          Q{idx + 1}
                        </p>
                        <p className="text-sm text-slate-900 font-medium">
                          {qText}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 mb-1">
                          Score (0–20)
                        </p>
                        <p className="text-base font-semibold text-indigo-600">
                          {score.toFixed(1)}
                        </p>
                      </div>
                    </div>

                    {/* USER ANSWER */}
                    <div className="text-xs">
                      <span className="font-semibold">Your Answer:</span>{" "}
                      {qType === "coding" ? (
                        <pre className="mt-1 bg-slate-900 text-slate-50 rounded-lg p-2 text-[11px] overflow-x-auto whitespace-pre-wrap">
                          {userAnsText}
                        </pre>
                      ) : (
                        <span>{userAnsText}</span>
                      )}
                    </div>

                    {/* CORRECT ANSWER */}
                    {correctText && (
                      <div className="text-xs">
                        <span className="font-semibold text-emerald-700">
                          Correct Answer:
                        </span>{" "}
                        {qType === "coding" ? (
                          <pre className="mt-1 bg-slate-900 text-emerald-100 rounded-lg p-2 text-[11px] overflow-x-auto whitespace-pre-wrap">
                            {correctText}
                          </pre>
                        ) : (
                          <span className="text-emerald-700">{correctText}</span>
                        )}
                      </div>
                    )}

                    {/* AI FEEDBACK */}
                    {fb.feedback && (
                      <p className="mt-1 text-xs text-slate-600">
                        <span className="font-semibold">AI Feedback:</span>{" "}
                        {fb.feedback}
                      </p>
                    )}

                    {/* AI METRICS */}
                    {(fb.fluency ||
                      fb.confidence ||
                      fb.technicalAccuracy ||
                      fb.keywordUsage) && (
                      <div className="flex flex-wrap gap-2 mt-2 text-[10px] text-slate-600">
                        {"fluency" in fb && (
                          <span className="px-2 py-1 bg-slate-100 rounded-full">
                            Fluency: {fb.fluency}
                          </span>
                        )}
                        {"confidence" in fb && (
                          <span className="px-2 py-1 bg-slate-100 rounded-full">
                            Confidence: {fb.confidence}
                          </span>
                        )}
                        {"technicalAccuracy" in fb && (
                          <span className="px-2 py-1 bg-slate-100 rounded-full">
                            Technical: {fb.technicalAccuracy}
                          </span>
                        )}
                        {"keywordUsage" in fb && (
                          <span className="px-2 py-1 bg-slate-100 rounded-full">
                            Keywords: {fb.keywordUsage}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScorecardPage;