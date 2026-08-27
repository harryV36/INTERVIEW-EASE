// src/components/interviewQuestion/InterviewQuestionsPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { ListChecks, Code2, ListOrdered, CheckCircle2 } from "lucide-react";

const InterviewQuestionsPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // TIMER
  const [timeLeft, setTimeLeft] = useState(0);
  const [autoSubmitting, setAutoSubmitting] = useState(false);

  /* ------------------------------------------------
   * LOAD INTERVIEW SESSION
   * ------------------------------------------------ */
  useEffect(() => {
    if (!sessionId) {
      setError("No session ID found. Please start an interview first.");
      setLoading(false);
      return;
    }

    const fetchSession = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const res = await axios.get(
          `http://localhost:8000/api/ai-interviews/session/${sessionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const q = res.data.session.questions || [];
        setQuestions(q);

        const initial = {};
        q.forEach((question) => {
          initial[question._id] = "";
        });
        setAnswers(initial);

        const duration = Number(res.data.session.config?.duration || 15);
        setTimeLeft(duration * 60);
      } catch (err) {
        setError("Failed to load interview.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  /* ------------------------------------------------
   * TIMER LOGIC
   * ------------------------------------------------ */
  useEffect(() => {
    if (timeLeft <= 0) {
      if (!autoSubmitting && questions.length > 0) {
        setAutoSubmitting(true);
        handleSubmit(true);
      }
      return;
    }

    const t = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, autoSubmitting]);

  const handleAnswerChange = (qid, value) => {
    if (autoSubmitting || submitting) return;
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  /* ------------------------------------------------
   * SUBMIT ANSWERS
   * ------------------------------------------------ */
  const handleSubmit = async (auto = false) => {
    if (!auto && !window.confirm("Submit answers for scoring?")) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      const payload = {
        answers: questions.map((q) => ({
          questionId: q._id,
          answer: answers[q._id] || "",
        })),
      };

      const res = await axios.post(
        `http://localhost:8000/api/ai-interviews/submit/${sessionId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) navigate(`/scorecard/${res.data.scorecardId}`);
    } catch (err) {
      console.error(err);
      if (!auto) alert("Error submitting interview.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------------------------------------
   * UI CHECKS
   * ------------------------------------------------ */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Loading interview questions…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        No questions found.
      </div>
    );
  }

  /* ------------------------------------------------
   * HELPERS
   * ------------------------------------------------ */
  const optionLetter = (idx) => "ABCD"[idx] ?? "?";

  const formatTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const currentQuestion = questions[activeIndex];
  const answeredCount = Object.values(answers).filter((v) => v).length;

  const mcqCount = questions.filter((q) => q.type === "mcq").length;
  const codingCount = questions.filter((q) => q.type === "coding").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 px-4 py-8">
      <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-[260px,1fr]">

        {/* ------------------------------------------------------------------
            LEFT SIDEBAR — HORIZONTAL QUESTION BAR
        ------------------------------------------------------------------ */}
        <aside className="bg-white rounded-3xl shadow-md border border-slate-100 p-4 flex flex-col gap-4">

          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <ListChecks size={20} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Interview Questions
              </h2>
              <p className="text-[11px] text-slate-500">
                {answeredCount}/{questions.length} answered
              </p>
            </div>
          </div>

          {/* COUNTS */}
          <div className="flex justify-between bg-slate-50 rounded-xl px-3 py-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <ListOrdered size={14} className="text-indigo-500" /> MCQ: {mcqCount}
            </span>

            <span className="flex items-center gap-1">
              <Code2 size={14} className="text-amber-500" /> Coding: {codingCount}
            </span>
          </div>

          {/* ------------------------------------------------------------------
              ⭐ NEW HORIZONTAL QUESTION NAVIGATION ⭐
          ------------------------------------------------------------------ */}
          <div className="w-full overflow-x-auto pb-2 custom-scroll">
            <div className="flex gap-2">
              {questions.map((q, index) => {
                const isActive = index === activeIndex;
                const answered = !!answers[q._id];

                return (
                  <button
                    key={q._id}
                    onClick={() => setActiveIndex(index)}
                    className={`
                      px-3 py-1.5 rounded-full text-xs whitespace-nowrap font-medium border transition
                      ${
                        isActive
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white border-slate-300 text-slate-600 hover:bg-slate-100"
                      }
                    `}
                  >
                    Q{index + 1} {answered && "✓"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SUBMIT */}
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting || autoSubmitting}
            className="mt-2 w-full px-4 py-2.5 rounded-full bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting || autoSubmitting ? "Submitting..." : "Submit & Get Score"}
          </button>
        </aside>

        {/* ------------------------------------------------------------------
            RIGHT PANEL — border removed, shadow only
        ------------------------------------------------------------------ */}
        <main className="bg-white rounded-3xl shadow-lg p-8 flex flex-col gap-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Question {activeIndex + 1} / {questions.length}
            </p>

            <div
              className={`px-4 py-2 rounded-full text-white text-xs font-semibold shadow 
              ${timeLeft <= 60 ? "bg-red-500" : "bg-indigo-600"}`}
            >
              ⏳ {formatTime(timeLeft)}
            </div>
          </div>

          {/* Question text */}
          <p className="font-semibold text-slate-900 text-sm md:text-base">
            {currentQuestion.question}
          </p>

          {/* MCQ */}
          {currentQuestion.type === "mcq" ? (
            <div className="space-y-2">
              {currentQuestion.options?.map((opt, idx) => {
                const letter = optionLetter(idx);
                const selected = answers[currentQuestion._id] === letter;

                return (
                  <label
                    key={idx}
                    className={`flex items-center gap-3 px-3 py-2 rounded-2xl border text-sm cursor-pointer 
                      ${
                        selected
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 hover:bg-slate-50"
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name={`ans-${currentQuestion._id}`}
                      className="accent-indigo-500"
                      checked={selected} 
                      onChange={() =>
                        handleAnswerChange(currentQuestion._id, letter)
                      }
                    />
                    <span className="font-semibold">{letter}.</span>
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            /* CODING */
            <textarea
              className="w-full min-h-[160px] text-sm rounded-2xl border bg-slate-50 px-3 py-2 focus:ring-indigo-200"
              placeholder="Write your solution here…"
              value={answers[currentQuestion._id] || ""}
              onChange={(e) =>
                handleAnswerChange(currentQuestion._id, e.target.value)
              }
            />
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t text-xs">
            <button
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex((i) => i - 1)}
              className="px-4 py-2 rounded-full shadow hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-slate-500">
              {answeredCount}/{questions.length} answered
            </span>

            <button
              disabled={activeIndex === questions.length - 1}
              onClick={() => setActiveIndex((i) => i + 1)}
              className="px-4 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default InterviewQuestionsPage;
