# ============================================================
# app.py  —  AI Interview Backend
# Flask + Flask-SocketIO + Groq
# ============================================================

import os
import uuid
import threading
import time
import io
import re
import json
import base64
import urllib.error
import urllib.request
from collections import defaultdict
from datetime import datetime

from flask import Flask, request, jsonify, Response
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from dotenv import load_dotenv
import openai

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

try:
    from docx import Document as DocxDocument
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False

try:
    import cv2
    import numpy as np
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False

try:
    import cloudinary
    import cloudinary.uploader
    cloudinary.config(
        cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
        api_key=os.environ.get('CLOUDINARY_API_KEY'),
        api_secret=os.environ.get('CLOUDINARY_API_SECRET'),
    )
    HAS_CLOUDINARY = True
except ImportError:
    HAS_CLOUDINARY = False

load_dotenv()

# ── App setup ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ["SECRET_KEY"]
CORS(app, origins="*")
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode="threading",
    ping_timeout=60,
    ping_interval=25,
)

# ── Groq client ───────────────────────────────────────────────────────────────
client = openai.OpenAI(
    api_key=os.environ.get("GROQ_API_KEY", ""),
    base_url="https://api.groq.com/openai/v1",
)

MODEL_FAST  = "llama-3.1-8b-instant"
MODEL_SMART = "llama-3.3-70b-versatile"
AI_CREDIT_COST = 4
NODE_API_BASE = os.environ.get("NODE_API_BASE", "http://localhost:8000")


class CreditError(Exception):
    def __init__(self, message, status_code=402):
        super().__init__(message)
        self.status_code = status_code


def _auth_header_from_request():
    return request.headers.get("Authorization") or request.headers.get("authorization")


def charge_ai_credits(auth_header):
    if not auth_header:
        raise CreditError(f"Login required. Each AI request costs {AI_CREDIT_COST} credits.", 401)

    req = urllib.request.Request(
        f"{NODE_API_BASE}/api/payments/charge-ai",
        data=b"{}",
        method="POST",
        headers={
            "Authorization": auth_header,
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read().decode("utf-8") or "{}")
        except Exception:
            body = {}
        raise CreditError(body.get("msg") or "Unable to charge credits", e.code)
    except Exception as e:
        raise CreditError(f"Credit service unavailable: {e}", 503)

# ── In-memory session store ───────────────────────────────────────────────────
sessions = {}
sessions_lock = threading.Lock()

cam_threads = {}
cam_stops = {}

# ── Helpers ───────────────────────────────────────────────────────────────────

def get_session(session_id):
    with sessions_lock:
        s = sessions.get(session_id)
        if s is None:
            return None
        return {
            **s,
            "answers":      dict(s["answers"]),
            "questions":    list(s["questions"]),
            "topics":       list(s["topics"]),
            "face_frames":  list(s["face_frames"]),
            "conv_history": list(s.get("conv_history", [])),
        }


def upsert_session(session_id, **kwargs):
    with sessions_lock:
        if session_id not in sessions:
            sessions[session_id] = {
                "questions":    [],
                "current_index": 0,
                "answers":      {},
                "role":         "frontend",
                "topics":       [],
                "resume_text":  "",
                "speech_buffer": "",
                "started":      False,
                "completed":    False,
                "socket_id":    None,
                "face_frames":  [],
                "face_detected": False,
                "identity_verified": False,
                "reference_face": None,
                "cloudinary_public_id": None,
                "cloudinary_url": None,
                "chat_histories": {},
                "conv_history":  [],
                "auth_header":   "",
            }
        sessions[session_id].update(kwargs)

# ── Resume text extraction ────────────────────────────────────────────────────

def extract_resume_text(file_storage):
    filename = file_storage.filename.lower()
    raw = file_storage.read()

    if filename.endswith(".pdf") and HAS_PDFPLUMBER:
        try:
            with pdfplumber.open(io.BytesIO(raw)) as pdf:
                return "\n".join(
                    page.extract_text() or "" for page in pdf.pages
                ).strip()
        except Exception as e:
            print(f"[PDF] parse error: {e}")
            return ""

    if filename.endswith(".docx") and HAS_DOCX:
        try:
            doc = DocxDocument(io.BytesIO(raw))
            return "\n".join(p.text for p in doc.paragraphs).strip()
        except Exception as e:
            print(f"[DOCX] parse error: {e}")
            return ""

    try:
        return raw.decode("utf-8", errors="ignore").strip()
    except Exception:
        return ""

# ── ATS scoring ───────────────────────────────────────────────────────────────

ROLE_KEYWORDS = {
    "frontend":       ["react","vue","angular","css","html","javascript","typescript","webpack","vite"],
    "backend":        ["node","express","django","flask","rest","api","sql","mongodb","postgresql"],
    "fullstack":      ["react","node","api","database","javascript","html","css","backend","frontend"],
    "data_scientist": ["python","pandas","numpy","scikit","machine learning","statistics","jupyter","tensorflow"],
    "ml_engineer":    ["pytorch","tensorflow","model","training","inference","mlops","pipeline","deep learning"],
    "devops":         ["docker","kubernetes","ci/cd","terraform","aws","linux","bash","jenkins","github actions"],
    "mobile":         ["react native","flutter","swift","kotlin","android","ios","expo","xcode"],
    "qa":             ["testing","selenium","cypress","jest","automation","test cases","qa","regression"],
    "security":       ["penetration","vulnerability","firewall","encryption","owasp","siem","threat","cve"],
    "data_engineer":  ["spark","hadoop","airflow","etl","kafka","data pipeline","warehouse","bigquery"],
    "product":        ["roadmap","stakeholder","agile","scrum","user stories","kpi","product","sprint"],
    "uiux":           ["figma","ux","ui","wireframe","prototyping","user research","sketch","design system"],
    "manager":        ["leadership","team","management","hiring","mentoring","strategy","roadmap","agile"],
}

def compute_ats_score(text, role):
    text_lower = text.lower()
    keywords   = ROLE_KEYWORDS.get(role, ROLE_KEYWORDS["fullstack"])
    matched    = [kw for kw in keywords if kw in text_lower]
    score      = round((len(matched) / max(len(keywords), 1)) * 100)
    return min(score, 100), matched

# ── Question generation ───────────────────────────────────────────────────────

def generate_questions(role, topics, resume_text, n=5, auth_header=None):
    topics_str     = ", ".join(topics) if topics else "general software engineering concepts"
    resume_snippet = resume_text[:2500] if resume_text else "Not provided"

    prompt = f"""You are a senior technical interviewer at a top tech company.
Generate exactly {n} highly personalised interview questions for a {role} candidate.

Focus areas requested: {topics_str}

Candidate resume:
{resume_snippet}

Rules:
1. Read the resume and reference specific projects, tech stacks, companies or skills from it.
2. Do NOT write generic questions. Each question must feel written FOR this specific candidate.
3. Mix: 1 intro/background, 2 deep-technical (based on resume), 1 problem-solving/coding, 1 behavioural (STAR).
4. If resume has a project, ask about a specific challenge from that project.
5. Return ONLY a valid JSON array of {n} strings. No markdown, no numbering, no extra text.

Example output: ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]"""

    try:
        charge_ai_credits(auth_header)
        resp = client.chat.completions.create(
            model=MODEL_SMART,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=900,
        )
        raw = resp.choices[0].message.content.strip()
        raw = re.sub(r"```[a-z]*", "", raw).strip("`").strip()
        start = raw.find("[")
        end   = raw.rfind("]")
        if start != -1 and end != -1:
            raw = raw[start:end+1]
        questions = json.loads(raw)
        if isinstance(questions, list) and len(questions) >= 1:
            print(f"[generate_questions] ✅ Generated {len(questions)} questions with {MODEL_SMART}")
            return questions[:n]
    except Exception as e:
        if isinstance(e, CreditError):
            raise
        print(f"[generate_questions] ❌ error: {e}")

    return [
        f"Walk me through your background and what led you to pursue a {role} role.",
        f"What has been your most technically challenging project, and what did you learn?",
        f"How do you stay up to date with developments in the {role} space?",
        f"Describe a disagreement with a teammate about a technical decision. How did you handle it?",
        f"Write a function to check whether a given string is a palindrome.",
    ][:n]

# ── Conversational AI coaching (POST /chat-on-question) ──────────────────────

@app.route("/chat-on-question", methods=["POST"])
def chat_on_question():
    """
    Full back-and-forth coaching conversation on one interview question.
    Body: { question, role, user_message, history: [{role, content}] }
    Returns: { success, reply, history }
    """
    data         = request.get_json(force=True)
    question     = data.get("question", "").strip()
    role         = data.get("role", "software engineer").strip()
    user_message = data.get("user_message", "").strip()
    history      = data.get("history", [])

    if not question or not user_message:
        return jsonify({"success": False, "error": "question and user_message required"}), 400

    system_prompt = f"""You're a friendly interview coach helping someone prep for a {role} interview. You're sitting with them over coffee — relaxed, honest, helpful.

The question they're practising: "{question}"

How to respond:
- SHORT: 2-3 sentences + ONE follow-up question. Never more.
- Be a real friend: react to exactly what they said, quote them back if useful.
- If their answer was weak, be honest but warm — show them HOW to fix it in one sentence.
- For behaviour questions push for a real story (Situation → Action → Result).
- For tech questions push for depth: trade-offs, numbers, edge cases.
- Never say "Thank you for sharing", "Great answer!", "As an AI", or anything hollow.
- End EVERY reply with exactly one short follow-up question."""

    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        if msg.get("role") in ("user", "assistant") and msg.get("content"):
            messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": user_message})

    try:
        charge_ai_credits(_auth_header_from_request())
        resp = client.chat.completions.create(
            model=MODEL_SMART,
            messages=messages,
            temperature=0.75,
            max_tokens=420,
        )
        reply = resp.choices[0].message.content.strip()
        print(f"[chat-on-question] ✅ {len(reply)} chars with {MODEL_SMART}")
    except Exception as e:
        if isinstance(e, CreditError):
            return jsonify({"success": False, "error": str(e)}), e.status_code
        print(f"[chat-on-question] ❌ error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

    updated_history = list(history) + [
        {"role": "user",      "content": user_message},
        {"role": "assistant", "content": reply},
    ]

    return jsonify({"success": True, "reply": reply, "history": updated_history})


# ── Generate model answer ─────────────────────────────────────────────────────

@app.route("/generate-answer", methods=["POST"])
def generate_answer():
    data     = request.get_json(force=True)
    question = data.get("question", "")
    role     = data.get("role", "software engineer")

    if not question:
        return jsonify({"success": False, "error": "No question provided"}), 400

    prompt = f"""You are a senior {role} engineer with 8+ years of experience.
Write an ideal, complete interview answer for this question.

Rules:
- Use STAR method for behavioural questions (Situation, Task, Action, Result).
- For technical questions, explain clearly with real-world context and trade-offs.
- For coding questions, provide working code with a clear explanation.
- Be specific and use concrete examples. Under 260 words.

Question: {question}

Answer:"""

    try:
        charge_ai_credits(_auth_header_from_request())
        resp = client.chat.completions.create(
            model=MODEL_SMART,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
            max_tokens=480,
        )
        answer = resp.choices[0].message.content.strip()
        print(f"[generate-answer] ✅ {len(answer)} chars")
        return jsonify({"success": True, "answer": answer})
    except Exception as e:
        if isinstance(e, CreditError):
            return jsonify({"success": False, "error": str(e)}), e.status_code
        print(f"[generate-answer] ❌ error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# ── Stream AI interviewer response ────────────────────────────────────────────

def stream_ai_response(session_id, question, answer, role, auth_header=None, allow_skip=False):
    """
    Emit AI interviewer reply via SocketIO with full conversation context.
    Maya is a real human interviewer — warm, probing, conversational.
    Always responds to BOTH spoken and typed answers.
    """

    with sessions_lock:
        if session_id in sessions:
            conv_history = list(sessions[session_id].get("conv_history", []))
        else:
            conv_history = []

    answer_text = (answer or "").strip()
    is_empty_answer = not answer_text or answer_text in ["(no answer given)", "No answer provided"]

    skip_instruction = (
        " If the answer is completely blank or a one-word non-answer repeated, "
        "end your reply with [MOVE_NEXT]."
    ) if allow_skip else ""

    # ── Enhanced interactive interview prompt ─────────────────────────────────
    system_prompt = f"""You are Maya, a real senior engineer conducting a live {role} technical interview at a top company.

PERSONALITY & STYLE:
- You are warm, curious, and direct — like a brilliant senior colleague, not a robotic HR bot
- You have a sharp memory — you WILL reference what they said earlier in the conversation
- You genuinely care about finding the right person — you probe to understand, not to trip up
- You react to EXACTLY what they said — never give a generic response
- You use natural filler phrases occasionally: "Interesting", "Right, so...", "Mmm, okay"

WHEN THEY GIVE A GOOD ANSWER:
- Acknowledge ONE specific thing they said that was impressive (quote their exact words)
- Then immediately dig deeper: ask for the trade-off, the failure, the number, the alternative
- Example: "You mentioned caching — what happens when the cache is stale? How do you handle that?"

WHEN THEY GIVE A WEAK/VAGUE ANSWER:
- Name EXACTLY what's missing in plain language, kindly but directly
- Offer a specific clue to help them: "I want to hear the actual data structure you'd use here"
- Don't let them off the hook — push once more on the same point

WHEN THEY GIVE NO ANSWER OR SAY THEY DON'T KNOW:
- Be kind but keep them engaged: "That's okay — let's think through it together. Start with the basics: what would you consider first?"
- Ask a simpler scaffolding question to help them get started

STRUCTURE:
- Keep responses SHORT: 2-3 sentences max, then ONE specific follow-up question
- Never use lists or bullet points — this is a real conversation
- Never start with "Great!", "Excellent!", "Thank you for sharing" — these are hollow
- ALWAYS end with a clear, single follow-up question{skip_instruction}

CONTEXT: You're mid-interview. Stay consistent with everything said so far."""

    messages = [{"role": "system", "content": system_prompt}]

    # Include last 8 exchanges for rich context
    for entry in conv_history[-8:]:
        messages.append({"role": entry["role"], "content": entry["content"]})

    # Build user turn
    if is_empty_answer:
        user_content = f"[Question I asked]: {question}\n[Candidate response]: (said nothing / skipped)"
    else:
        user_content = f"[Question I asked]: {question}\n[Candidate's answer]: {answer_text}"

    messages.append({"role": "user", "content": user_content})

    try:
        charge_ai_credits(auth_header)
        resp = client.chat.completions.create(
            model=MODEL_FAST,
            messages=messages,
            stream=False,
            temperature=0.78,
            max_tokens=140,
        )
        full_text = resp.choices[0].message.content.strip()
        print(f"[stream_ai_response] ✅ {len(full_text)} chars, history_len={len(conv_history)}")
    except Exception as e:
        if isinstance(e, CreditError):
            full_text = str(e)
            socketio.emit("ai_streaming",
                {"chunk": full_text, "done": True, "full_text": full_text, "error": True},
                room=session_id)
            return False
        print(f"[stream_ai_response] ❌ {e}")
        full_text = "Alright, take a moment to think — what's the first thing that comes to mind?"

    # Check skip signal
    move_next = False
    if allow_skip and "[MOVE_NEXT]" in full_text:
        full_text = full_text.replace("[MOVE_NEXT]", "").strip()
        move_next = True

    # Persist exchange to conversation history
    user_entry = {"role": "user", "content": user_content}
    ai_entry   = {"role": "assistant", "content": full_text}
    with sessions_lock:
        if session_id in sessions:
            h = sessions[session_id].setdefault("conv_history", [])
            h.append(user_entry)
            h.append(ai_entry)

    socketio.emit("ai_streaming",
        {"chunk": full_text, "done": True, "full_text": full_text, "move_next": move_next},
        room=session_id)

    return move_next

# ── Answer evaluation ─────────────────────────────────────────────────────────

def evaluate_answer(question, answer, role, auth_header=None):
    prompt = f"""You are an expert technical interviewer scoring a candidate's answer.
Role: {role}
Question: {question}
Answer: {answer.strip() or "No answer provided."}

Score on these 9 dimensions (each 0-100):
fluency, confidence, technicalAccuracy, keywordUsage, depth, structure, relevance, exampleQuality, communicationClarity

Also provide:
- analysis: 2-3 sentence qualitative feedback (specific to THIS answer)
- improvements: array of 2-3 actionable improvement tips

Return ONLY a valid JSON object. No markdown, no extra text."""

    try:
        charge_ai_credits(auth_header)
        resp = client.chat.completions.create(
            model=MODEL_SMART,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=450,
        )
        raw = resp.choices[0].message.content.strip()
        raw = re.sub(r"```[a-z]*", "", raw).strip("`").strip()
        start = raw.find("{")
        end   = raw.rfind("}")
        if start != -1 and end != -1:
            raw = raw[start:end+1]
        return json.loads(raw)
    except Exception as e:
        if isinstance(e, CreditError):
            raise
        print(f"[evaluate_answer] ❌ error: {e}")
        base = 40 if not answer.strip() else 60
        return {
            "fluency": base, "confidence": base, "technicalAccuracy": base,
            "keywordUsage": base, "depth": base, "structure": base,
            "relevance": base, "exampleQuality": base, "communicationClarity": base,
            "analysis": "Answer evaluated. Keep practising to improve your responses.",
            "improvements": ["Be more specific", "Use technical terms", "Give concrete examples"],
        }


def compute_final_results(session, auth_header=None):
    questions = session.get("questions", [])
    answers   = session.get("answers", {})
    role      = session.get("role", "software engineer")

    if not questions:
        dims = ["fluency","confidence","technicalAccuracy","keywordUsage",
                "depth","structure","relevance","exampleQuality","communicationClarity","overallScore"]
        return {
            "aggregated_scores": {d: 0 for d in dims},
            "questions": [],
            "overall_band": "INCOMPLETE",
            "overall_message": "No questions were answered.",
            "global_improvement_tips": ["Complete the full interview before submitting."],
        }

    per_question = []
    agg = defaultdict(list)

    for i, q in enumerate(questions):
        answer = answers.get(i, answers.get(str(i), ""))
        scores = evaluate_answer(q, answer, role, auth_header)

        dims = ["fluency","confidence","technicalAccuracy","keywordUsage",
                "depth","structure","relevance","exampleQuality","communicationClarity"]
        for d in dims:
            agg[d].append(scores.get(d, 50))

        q_avg = round(sum(scores.get(d, 50) for d in dims) / len(dims))
        per_question.append({
            "question":          q,
            "answer":            answer,
            "score":             q_avg,
            "analysis":          scores.get("analysis", ""),
            "feedback":          scores.get("analysis", ""),
            "improvements":      scores.get("improvements", []),
            "fluency":           scores.get("fluency", 50),
            "confidence":        scores.get("confidence", 50),
            "technicalAccuracy": scores.get("technicalAccuracy", 50),
            "keywordUsage":      scores.get("keywordUsage", 50),
        })

    aggregated = {d: round(sum(v) / len(v)) for d, v in agg.items()}
    overall    = round(sum(aggregated.values()) / max(len(aggregated), 1))
    aggregated["overallScore"] = overall

    agg_display = {k: round(v / 10, 1) for k, v in aggregated.items()}

    if overall >= 80:   band, msg = "EXCELLENT",  "Outstanding! You're well-prepared."
    elif overall >= 65: band, msg = "GOOD",        "Good job. A few areas to polish."
    elif overall >= 50: band, msg = "AVERAGE",     "Decent effort. More practice will help."
    else:               band, msg = "NEEDS WORK",  "Keep practising — you'll get there!"

    try:
        charge_ai_credits(auth_header)
        tips_resp = client.chat.completions.create(
            model=MODEL_FAST,
            messages=[{"role": "user", "content":
                f"Based on interview score {overall}/100 for a {role} candidate, "
                f"give exactly 3 concise actionable improvement tips. "
                f"Return ONLY a JSON array of 3 strings, no markdown."}],
            temperature=0.5,
            max_tokens=220,
        )
        tips_raw = tips_resp.choices[0].message.content.strip()
        tips_raw = re.sub(r"```[a-z]*", "", tips_raw).strip("`").strip()
        tips_raw = tips_raw[tips_raw.find("["):tips_raw.rfind("]")+1]
        tips = json.loads(tips_raw)
        if not isinstance(tips, list):
            raise ValueError
    except Exception:
        tips = [
            "Review core concepts for your role and practise explaining them aloud.",
            "Structure every answer using STAR (Situation, Task, Action, Result).",
            "Prepare 2-3 concrete examples from real projects to back each claim.",
        ]

    per_question_display = []
    for pq in per_question:
        pq_d = dict(pq)
        for dim in ["score","fluency","confidence","technicalAccuracy","keywordUsage"]:
            pq_d[dim] = round(pq_d.get(dim, 50) / 10, 1)
        per_question_display.append(pq_d)

    return {
        "aggregated_scores":       agg_display,
        "questions":               per_question_display,
        "overall_band":            band,
        "overall_message":         msg,
        "global_improvement_tips": tips,
    }

# ── Lightweight face comparison (Haar + histogram, no dlib) ──────────────────

def compare_faces_lightweight(ref_bytes, frame_bytes):
    if not HAS_CV2 or not ref_bytes or not frame_bytes:
        return True, 1, 1.0

    _cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )

    try:
        ref_arr   = np.frombuffer(ref_bytes,   dtype=np.uint8)
        frame_arr = np.frombuffer(frame_bytes, dtype=np.uint8)
        ref_img   = cv2.imdecode(ref_arr,   cv2.IMREAD_COLOR)
        frame_img = cv2.imdecode(frame_arr, cv2.IMREAD_COLOR)

        if ref_img is None or frame_img is None:
            return True, 1, 1.0

        ref_gray   = cv2.cvtColor(ref_img,   cv2.COLOR_BGR2GRAY)
        frame_gray = cv2.cvtColor(frame_img, cv2.COLOR_BGR2GRAY)

        ref_faces   = _cascade.detectMultiScale(ref_gray,   1.1, 4, minSize=(50, 50))
        frame_faces = _cascade.detectMultiScale(frame_gray, 1.1, 4, minSize=(50, 50))

        face_count = len(frame_faces)

        if len(ref_faces) == 0 or face_count == 0:
            return False, face_count, 0.0

        rx, ry, rw, rh = max(ref_faces,   key=lambda f: f[2] * f[3])
        ref_face = cv2.resize(ref_img[ry:ry+rh, rx:rx+rw], (64, 64))

        fx, fy, fw, fh = max(frame_faces, key=lambda f: f[2] * f[3])
        cur_face = cv2.resize(frame_img[fy:fy+fh, fx:fx+fw], (64, 64))

        ref_hsv = cv2.cvtColor(ref_face, cv2.COLOR_BGR2HSV)
        cur_hsv = cv2.cvtColor(cur_face, cv2.COLOR_BGR2HSV)

        ref_h = cv2.calcHist([ref_hsv], [0, 1], None, [50, 60], [0, 180, 0, 256])
        cur_h = cv2.calcHist([cur_hsv], [0, 1], None, [50, 60], [0, 180, 0, 256])

        cv2.normalize(ref_h, ref_h, 0, 1, cv2.NORM_MINMAX)
        cv2.normalize(cur_h, cur_h, 0, 1, cv2.NORM_MINMAX)

        score = cv2.compareHist(ref_h, cur_h, cv2.HISTCMP_CORREL)
        match = float(score) >= 0.38

        return match, face_count, float(score)

    except Exception as e:
        print(f"[face_compare] error: {e}")
        return True, 1, 1.0


# ── Background face verification loop ────────────────────────────────────────

def start_face_verification_loop(session_id):
    def _loop():
        consecutive_mismatches = 0
        while True:
            time.sleep(50)

            session = get_session(session_id)
            if not session or session.get("completed"):
                break
            if not session.get("started"):
                continue

            ref_bytes  = session.get("reference_face")
            frames     = session.get("face_frames", [])
            if not frames or not ref_bytes:
                continue

            frame_bytes = frames[-1]
            match, face_count, score = compare_faces_lightweight(ref_bytes, frame_bytes)

            if face_count == 0:
                consecutive_mismatches += 1
                socketio.emit("violation_detected", {
                    "type": "no_face",
                    "message": "No face detected. Please stay visible in the camera.",
                    "severity": "high",
                }, room=session_id)

            elif face_count > 1:
                socketio.emit("violation_detected", {
                    "type": "multiple_faces",
                    "message": "Multiple people detected. Only you should be on camera.",
                    "severity": "high",
                }, room=session_id)

            elif not match:
                consecutive_mismatches += 1
                socketio.emit("violation_detected", {
                    "type": "face_mismatch",
                    "message": "Face doesn't match registered identity.",
                    "severity": "high",
                }, room=session_id)
                if consecutive_mismatches >= 3:
                    socketio.emit("violation_detected", {
                        "type": "face_mismatch_critical",
                        "message": "Identity verification failed 3 times. Interview is being terminated.",
                        "severity": "critical",
                    }, room=session_id)
                    break
            else:
                consecutive_mismatches = 0
                socketio.emit("face_verification_status", {
                    "matched": True,
                    "score": round(score, 3),
                }, room=session_id)

    threading.Thread(target=_loop, daemon=True).start()


def webcam_capture_thread(session_id, stop_event):
    """No-op: frontend sends frames via /update-frame."""
    stop_event.wait()

# ─────────────────────────────────────────────────────────────────────────────
# HTTP Routes
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "sessions": len(sessions),
                    "models": {"fast": MODEL_FAST, "smart": MODEL_SMART}})


@app.route("/upload-resume", methods=["POST"])
def upload_resume():
    session_id = request.form.get("session_id") or str(uuid.uuid4())
    role       = request.form.get("role",   "fullstack")
    topics_raw = request.form.get("topics", "")
    topics     = [t.strip() for t in topics_raw.split(",") if t.strip()]
    auth_header = _auth_header_from_request()

    resume_text = ""
    ats_score   = 0
    matched_kw  = []

    if "resume" in request.files:
        file = request.files["resume"]
        resume_text = extract_resume_text(file)
        ats_score, matched_kw = compute_ats_score(resume_text, role)
        print(f"[upload-resume] Extracted {len(resume_text)} chars, ATS={ats_score}")

    try:
        questions = generate_questions(role, topics, resume_text, auth_header=auth_header)
    except CreditError as e:
        return jsonify({"success": False, "error": str(e)}), e.status_code

    upsert_session(
        session_id,
        role=role,
        topics=topics,
        resume_text=resume_text,
        questions=questions,
        answers={},
        current_index=0,
        speech_buffer="",
        started=False,
        completed=False,
        auth_header=auth_header or "",
    )

    return jsonify({
        "session_id":       session_id,
        "questions":        questions,
        "ats_score":        ats_score,
        "matched_keywords": matched_kw,
        "text_summary":     resume_text[:1500] if resume_text else "",
        "role":             role,
        "message":          "Resume uploaded and questions generated.",
    })


@app.route("/analyze-resume", methods=["POST"])
def analyze_resume():
    data = request.get_json(force=True)
    text = data.get("text", "")
    role = data.get("role", "software engineer")

    if not text:
        return jsonify({"error": "No resume text provided"}), 400

    prompt = f"""You are an expert resume reviewer and career coach.
Analyse this resume for a {role} candidate and return a JSON object with EXACTLY these keys:
- strengths: array of 3 specific strengths (reference actual content from the resume)
- weaknesses: array of 3 specific areas that need improvement
- suggestions: array of 3 concrete, actionable improvement suggestions
- keywords_missing: array of 4-6 important missing keywords for a {role} role
- overall_impression: 2-sentence summary of resume quality
- ats_tips: array of 2 quick ATS formatting tips

Resume:
{text[:3000]}

Return ONLY valid JSON. No markdown, no extra text."""

    try:
        charge_ai_credits(_auth_header_from_request())
        resp = client.chat.completions.create(
            model=MODEL_SMART,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=800,
        )
        raw = resp.choices[0].message.content.strip()
        raw = re.sub(r"```[a-z]*", "", raw).strip("`").strip()
        start = raw.find("{")
        end   = raw.rfind("}")
        if start != -1 and end != -1:
            raw = raw[start:end+1]
        analysis = json.loads(raw)
        print(f"[analyze-resume] ✅ success with {MODEL_SMART}")
    except Exception as e:
        if isinstance(e, CreditError):
            return jsonify({"success": False, "error": str(e)}), e.status_code
        print(f"[analyze-resume] ❌ error: {e}")
        analysis = {
            "strengths":          ["Relevant technical experience", "Projects demonstrate practical skills", "Appropriate educational background"],
            "weaknesses":         ["Impact metrics are missing", "Action verbs could be stronger", "Skills section needs more specificity"],
            "suggestions":        ["Add quantified achievements (e.g. 'reduced load time by 40%')", "Include GitHub or portfolio link", "Tailor summary to the job description"],
            "keywords_missing":   ["CI/CD", "unit testing", "system design", "agile", "code review"],
            "overall_impression": "Solid resume with good technical foundation. Adding measurable achievements and missing keywords will improve ATS pass rate.",
            "ats_tips":           ["Use standard headings: Experience, Education, Skills", "Avoid tables or columns — ATS cannot parse them"],
        }

    return jsonify({"analysis": analysis})


def _delete_cloudinary_image(session_id):
    session = get_session(session_id)
    if not session:
        return
    public_id = session.get("cloudinary_public_id")
    if not public_id or not HAS_CLOUDINARY:
        return
    try:
        cloudinary.uploader.destroy(public_id, resource_type="image")
        print(f"✅ Reference photo deleted from Cloudinary: {public_id}")
    except Exception as e:
        print(f"[Cloudinary] ❌ Delete failed for {public_id}: {e}")


@app.route("/submit-interview", methods=["POST"])
def submit_interview():
    data       = request.get_json(force=True)
    session_id = data.get("session_id", "")

    session = get_session(session_id)
    if not session:
        return jsonify({
            "success": True,
            "results": {
                "aggregated_scores": {k: 6.0 for k in
                    ["fluency","confidence","technicalAccuracy","keywordUsage",
                     "depth","structure","relevance","exampleQuality","communicationClarity","overallScore"]},
                "questions": [],
                "overall_band": "INCOMPLETE",
                "overall_message": "Session not found.",
                "global_improvement_tips": ["Ensure stable session before starting."],
            }
        })

    with sessions_lock:
        sessions[session_id]["completed"] = True

    _delete_cloudinary_image(session_id)

    auth_header = _auth_header_from_request() or session.get("auth_header", "")
    try:
        results = compute_final_results(session, auth_header)
    except CreditError as e:
        return jsonify({"success": False, "error": str(e)}), e.status_code
    return jsonify({"success": True, "results": results})


@app.route("/terminate-interview", methods=["POST"])
def terminate_interview():
    data       = request.get_json(force=True)
    session_id = data.get("session_id", "")
    if session_id in sessions:
        with sessions_lock:
            sessions[session_id]["completed"] = True
    _delete_cloudinary_image(session_id)
    return jsonify({"success": True})


@app.route("/upload-image", methods=["POST"])
def upload_image():
    session_id = request.form.get("session_id", "")
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400
    file      = request.files["image"]
    img_bytes = file.read()

    cloudinary_public_id = None
    cloudinary_url       = None

    if HAS_CLOUDINARY:
        try:
            result = cloudinary.uploader.upload(
                img_bytes,
                folder="interview_faces",
                public_id=f"ref_{session_id}",
                overwrite=True,
                resource_type="image",
            )
            cloudinary_public_id = result.get("public_id")
            cloudinary_url       = result.get("secure_url")
            print(f"[Cloudinary] ✅ Uploaded reference face: {cloudinary_public_id}")
        except Exception as e:
            print(f"[Cloudinary] ❌ Upload failed: {e}")

    upsert_session(
        session_id,
        reference_face=img_bytes,
        identity_verified=True,
        cloudinary_public_id=cloudinary_public_id,
        cloudinary_url=cloudinary_url,
    )

    start_face_verification_loop(session_id)

    return jsonify({
        "success": True,
        "message": "Reference face stored.",
        "cloudinary_url": cloudinary_url,
    })


@app.route("/update-frame", methods=["POST"])
def update_frame():
    session_id = request.form.get("session_id", "")
    if not session_id:
        return jsonify({"ok": False}), 400

    if "frame" in request.files:
        img_bytes = request.files["frame"].read()
    elif request.data:
        img_bytes = request.data
    else:
        return jsonify({"ok": False}), 400

    face_count = 0
    if HAS_CV2:
        try:
            arr   = np.frombuffer(img_bytes, dtype=np.uint8)
            img   = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if img is not None:
                gray    = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                _casc   = cv2.CascadeClassifier(
                    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
                )
                faces     = _casc.detectMultiScale(gray, 1.1, 4, minSize=(40, 40))
                face_count = len(faces)
        except Exception as e:
            print(f"[update-frame] detection error: {e}")

    with sessions_lock:
        if session_id in sessions:
            sessions[session_id]["face_frames"]  = [img_bytes]
            sessions[session_id]["face_detected"] = face_count > 0

    return jsonify({"ok": True, "face_count": face_count})


@app.route("/register-face", methods=["POST"])
def register_face():
    data       = request.get_json(force=True)
    session_id = data.get("session_id", "")
    image_b64  = data.get("image", "")
    if not session_id or not image_b64:
        return jsonify({"error": "session_id and image required"}), 400
    try:
        img_bytes = base64.b64decode(image_b64.split(",")[-1])
        upsert_session(session_id, reference_face=img_bytes, identity_verified=True)
        return jsonify({"success": True, "message": "Face registered."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/check-face", methods=["GET"])
def check_face():
    session_id = request.args.get("session_id", "")
    session    = get_session(session_id)
    if not session:
        return jsonify({"face_detected": False, "identity_verified": False,
                        "face_count": 0, "violation": None})

    frames = session.get("face_frames", [])
    face_count = 0
    violation  = None

    if HAS_CV2 and frames:
        try:
            _cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            )
            arr   = np.frombuffer(frames[-1], dtype=np.uint8)
            img   = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if img is not None:
                gray  = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                faces = _cascade.detectMultiScale(gray, 1.1, 4, minSize=(50, 50))
                face_count = len(faces)

                if face_count == 0:
                    violation = {"type": "no_face", "message": "No face detected — please centre yourself in the camera.", "severity": "warning"}
                elif face_count > 1:
                    violation = {"type": "multiple_faces", "message": "Multiple people detected in frame.", "severity": "high"}
                else:
                    h, w = img.shape[:2]
                    fx, fy, fw, fh = max(faces, key=lambda f: f[2]*f[3])
                    cx, cy = fx + fw//2, fy + fh//2
                    margin = 0.20
                    if cx < w * margin or cx > w * (1-margin) or cy < h * margin or cy > h * (1-margin):
                        violation = {"type": "out_of_frame", "message": "Move closer — your face is at the edge of the frame.", "severity": "warning"}
        except Exception as e:
            print(f"[check-face] error: {e}")

    return jsonify({
        "face_detected":     face_count > 0,
        "identity_verified": session.get("identity_verified", False),
        "face_count":        face_count,
        "violation":         violation,
    })


@app.route("/video", methods=["GET"])
def video_feed():
    session_id = request.args.get("session_id", "")

    def generate():
        blank = _blank_frame()
        try:
            while True:
                s      = get_session(session_id)
                frames = s.get("face_frames", []) if s else []
                frame  = frames[-1] if frames else blank
                yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + frame + b"\r\n")
                time.sleep(0.05)
        except GeneratorExit:
            pass

    return Response(generate(), mimetype="multipart/x-mixed-replace; boundary=frame")


def _blank_frame():
    if HAS_CV2:
        blank = np.zeros((240, 320, 3), dtype=np.uint8)
        _, buf = cv2.imencode(".jpg", blank)
        return buf.tobytes()
    return (
        b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00"
        b"\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t"
        b"\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a"
        b"\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f\'9=82<.342\x1e\xc0"
        b"\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00"
        b"\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00"
        b"\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01"
        b"\x01\x00\x00?\x00\xfb\xff\xd9"
    )

# ─────────────────────────────────────────────────────────────────────────────
# SocketIO Events
# ─────────────────────────────────────────────────────────────────────────────

@socketio.on("connect")
def on_connect():
    print(f"[WS] Client connected: {request.sid}")

@socketio.on("disconnect")
def on_disconnect():
    print(f"[WS] Client disconnected: {request.sid}")


@socketio.on("join_session")
def on_join_session(data):
    session_id = data.get("session_id", "")
    token = data.get("token", "")
    if not session_id:
        emit("error", {"message": "session_id required"})
        return

    join_room(session_id)
    update = {"socket_id": request.sid}
    if token:
        update["auth_header"] = f"Bearer {token}"
    upsert_session(session_id, **update)

    if session_id not in cam_threads and HAS_CV2:
        stop_event = threading.Event()
        cam_stops[session_id]  = stop_event
        t = threading.Thread(target=webcam_capture_thread, args=(session_id, stop_event), daemon=True)
        t.start()
        cam_threads[session_id] = t

    emit("session_joined", {"session_id": session_id, "status": "ok"})


@socketio.on("start_interview")
def on_start_interview(data):
    session_id = data.get("session_id", "")
    token = data.get("token", "")
    if token:
        with sessions_lock:
            if session_id in sessions:
                sessions[session_id]["auth_header"] = f"Bearer {token}"
    session    = get_session(session_id)
    if not session:
        emit("error", {"message": "Session not found. Upload resume first."})
        return

    questions = session.get("questions", [])
    if not questions:
        try:
            questions = generate_questions(
                session.get("role", "fullstack"),
                session.get("topics", []),
                session.get("resume_text", ""),
                auth_header=session.get("auth_header", ""),
            )
        except CreditError as e:
            emit("error", {"message": str(e)})
            return
        with sessions_lock:
            sessions[session_id]["questions"] = questions

    with sessions_lock:
        sessions[session_id]["started"]       = True
        sessions[session_id]["current_index"] = 0
        sessions[session_id]["answers"]       = {}
        sessions[session_id]["speech_buffer"] = ""
        sessions[session_id]["conv_history"]  = []

    role_display = session.get("role", "software engineering").replace("_", " ")
    greeting = (
        f"Hey! Great to meet you — I'm Maya. I'll be your interviewer today. "
        f"We've got {len(questions)} questions lined up for a {role_display} role. "
        f"Take a breath, relax — just talk to me like you would a colleague. "
        f"Ready when you are!"
    )

    emit("interview_started", {
        "current_question": questions[0],
        "index": 0,
        "total": len(questions),
        "greeting": greeting,
    }, room=session_id)

    socketio.emit("ai_streaming", {
        "chunk": greeting, "done": True, "full_text": greeting, "is_greeting": True,
    }, room=session_id)

    print(f"[Interview] ✅ Started session {session_id}, {len(questions)} questions")


@socketio.on("speech_chunk")
def on_speech_chunk(data):
    session_id = data.get("session_id", "")
    text       = data.get("text", "")
    is_final   = data.get("is_final", False)

    if not get_session(session_id) or not text:
        return

    with sessions_lock:
        buf = sessions[session_id].get("speech_buffer", "")
        sessions[session_id]["speech_buffer"] = (buf + " " + text).strip()
        accumulated = sessions[session_id]["speech_buffer"]

    emit("speech_feedback", {
        "interim": not is_final, "text": text, "accumulated": accumulated,
    }, room=session_id)


@socketio.on("request_next_question")
def on_next_question(data):
    session_id = data.get("session_id", "")
    if not get_session(session_id):
        return

    with sessions_lock:
        questions    = list(sessions[session_id]["questions"])
        server_idx   = sessions[session_id]["current_index"]
        client_idx   = data.get("question_index")
        idx          = server_idx
        if isinstance(client_idx, int) and 0 <= client_idx < len(questions):
            idx = client_idx
        buffer        = sessions[session_id].get("speech_buffer", "").strip()
        answer_override = (data.get("answer_override") or "").strip()
        if answer_override:
            sessions[session_id]["answers"][idx] = answer_override
        elif buffer and idx not in sessions[session_id]["answers"]:
            sessions[session_id]["answers"][idx] = buffer
        sessions[session_id]["speech_buffer"] = ""
        current_q    = (data.get("question") or "").strip() or (questions[idx] if idx < len(questions) else "")
        answer_given = sessions[session_id]["answers"].get(idx, buffer)
        role         = sessions[session_id].get("role", "software")
        auth_header  = sessions[session_id].get("auth_header", "")
        next_idx     = idx + 1
        sessions[session_id]["current_index"] = idx

    emit("processing_answer", {}, room=session_id)

    def respond_and_advance():
        stream_ai_response(session_id, current_q, answer_given, role, auth_header)
        with sessions_lock:
            if session_id not in sessions:
                return
            if next_idx >= len(sessions[session_id]["questions"]):
                sessions[session_id]["completed"] = True
                socketio.emit("interview_complete", {}, room=session_id)
                print(f"[Interview] ✅ Completed session {session_id}")
            else:
                sessions[session_id]["current_index"] = next_idx
                next_q = sessions[session_id]["questions"][next_idx]
                socketio.emit("question_changed", {
                    "question": next_q,
                    "index":    next_idx,
                    "total":    len(sessions[session_id]["questions"]),
                }, room=session_id)

    threading.Thread(target=respond_and_advance, daemon=True).start()


@socketio.on("manual_submit")
def on_manual_submit(data):
    session_id = data.get("session_id", "")
    answer     = data.get("answer", "").strip()
    if not get_session(session_id):
        return

    # FIX: Allow empty answer through — AI will prompt them to elaborate
    # Don't gate on empty answer — let Maya handle it gracefully

    with sessions_lock:
        questions  = list(sessions[session_id]["questions"])
        server_idx = sessions[session_id]["current_index"]
        client_idx = data.get("question_index")
        idx        = server_idx
        if isinstance(client_idx, int) and 0 <= client_idx < len(questions):
            idx = client_idx
        combined  = answer or "(no answer given)"
        sessions[session_id]["answers"][idx]  = combined
        sessions[session_id]["speech_buffer"] = ""
        sessions[session_id]["current_index"] = idx
        current_q = (data.get("question") or "").strip() or (questions[idx] if idx < len(questions) else "")
        role      = sessions[session_id].get("role", "software")
        auth_header = sessions[session_id].get("auth_header", "")

    emit("processing_answer", {}, room=session_id)

    def manual_respond():
        move = stream_ai_response(session_id, current_q, combined, role, auth_header, allow_skip=True)
        if move:
            with sessions_lock:
                if session_id not in sessions:
                    return
                next_idx = sessions[session_id]["current_index"] + 1
                if next_idx >= len(sessions[session_id]["questions"]):
                    sessions[session_id]["completed"] = True
                    socketio.emit("interview_complete", {}, room=session_id)
                else:
                    sessions[session_id]["current_index"] = next_idx
                    next_q = sessions[session_id]["questions"][next_idx]
                    socketio.emit("question_changed", {
                        "question": next_q, "index": next_idx,
                        "total": len(sessions[session_id]["questions"]),
                        "auto_advanced": True,
                    }, room=session_id)

    threading.Thread(target=manual_respond, daemon=True).start()


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"[Server] Starting on port {port}")
    print(f"[Server] Fast model : {MODEL_FAST}")
    print(f"[Server] Smart model: {MODEL_SMART}")
    socketio.run(app, host="0.0.0.0", port=port, debug=True, allow_unsafe_werkzeug=True)
