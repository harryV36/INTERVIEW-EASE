import { useEffect, useState, useRef } from "react";

export default function useSessionId(key = "interviewSessionId") {
  // Initialise synchronously from localStorage so it's never null after mount
  const [sessionId, setSessionId] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) return stored;
    } catch (_) {}
    return null;
  });

  const initialised = useRef(false);

  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;

    // If we already have a value from the lazy initialiser, nothing to do
    if (sessionId) return;

    const newId =
      (typeof crypto !== "undefined" && crypto.randomUUID?.()) ||
      "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });

    try { localStorage.setItem(key, newId); } catch (_) {}
    setSessionId(newId);
  }, [key, sessionId]);

  return sessionId;
}
