// services/openRouterClient.js  —  powered by Groq
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// ✅ Updated models — llama3-8b-8192 was decommissioned May 2025
// Fast small tasks  → llama-3.1-8b-instant
// Quality/complex   → llama-3.3-70b-versatile
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

const openRouterClient = axios.create({
  baseURL: "https://api.groq.com/openai/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

export async function openRouterChat(messages, { model, json } = {}) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ GROQ_API_KEY not set. Using fallback (no AI).");
    return null;
  }

  const usedModel = model || DEFAULT_MODEL;

  try {
    const body = {
      model: usedModel,
      messages,
      temperature: 0.4,
    };

    if (json) {
      body.response_format = { type: "json_object" };
    }

    const res = await openRouterClient.post("/chat/completions", body, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const message = res.data?.choices?.[0]?.message || {};

    if (json) {
      if (typeof message.content === "string") return message.content;
      if (typeof message.content === "object" && message.content !== null)
        return JSON.stringify(message.content);
      return JSON.stringify(message);
    }

    if (typeof message.content === "string") return message.content;
    return JSON.stringify(message.content ?? message);
  } catch (err) {
    console.error(
      "OpenRouter chat error:",
      err.response?.data || err.message || err
    );
    return null;
  }
}
