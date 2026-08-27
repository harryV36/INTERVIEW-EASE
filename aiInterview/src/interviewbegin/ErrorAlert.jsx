// src/interviewbegin/ErrorAlert.jsx
import React from "react";
import { X } from "lucide-react";

const ErrorAlert = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center">
      <span className="text-red-300 font-semibold">⚠️ {message}</span>
      <button onClick={onClose} className="ml-auto">
        <X size={16} />
      </button>
    </div>
  );
};

export default ErrorAlert;
