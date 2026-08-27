import React, { useEffect, useState } from "react";
import "./ViolationAlert.css";

const ViolationAlert = ({ violations, totalViolations }) => {
  const [displayViolations, setDisplayViolations] = useState([]);
  const [showFullScreen, setShowFullScreen] = useState(false);

  useEffect(() => {
    if (violations && violations.length > 0) {
      setDisplayViolations(violations);
      if (
        violations.some(
          (v) => v.severity === "critical" || v.severity === "high"
        )
      ) {
        setShowFullScreen(true);
        // Auto-hide after 3 seconds for non-critical
        const timer = setTimeout(() => {
          if (
            !violations.some((v) => v.severity === "critical")
          ) {
            setShowFullScreen(false);
          }
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [violations]);

  if (!showFullScreen && displayViolations.length === 0) {
    return null;
  }

  const getViolationColor = (severity) => {
    switch (severity) {
      case "critical":
        return "#dc2626"; // Red
      case "high":
        return "#f97316"; // Orange
      case "medium":
        return "#eab308"; // Yellow
      case "low":
        return "#3b82f6"; // Blue
      default:
        return "#6b7280"; // Gray
    }
  };

  const getViolationIcon = (type) => {
    switch (type) {
      case "no_face":
        return "🚨";
      case "unknown_face":
        return "⚠️";
      case "multiple_faces":
        return "❌";
      default:
        return "ℹ️";
    }
  };

  const getViolationMessage = (type) => {
    switch (type) {
      case "no_face":
        return "Face Not Detected";
      case "unknown_face":
        return "Unknown Face Detected";
      case "multiple_faces":
        return "Multiple Faces Detected";
      default:
        return "Violation";
    }
  };

  if (showFullScreen) {
    return (
      <div className="violation-fullscreen">
        <div className="violation-fullscreen-content">
          <div className="violation-fullscreen-header">
            <h1>⚠️ INTERVIEW VIOLATION</h1>
          </div>

          <div className="violation-fullscreen-body">
            {displayViolations.map((violation, idx) => (
              <div
                key={idx}
                className="violation-item"
                style={{
                  borderLeftColor: getViolationColor(violation.severity),
                }}
              >
                <div className="violation-icon">
                  {getViolationIcon(violation.type)}
                </div>
                <div className="violation-content">
                  <h2>{getViolationMessage(violation.type)}</h2>
                  <p className="violation-severity">
                    Severity: <strong>{violation.severity.toUpperCase()}</strong>
                  </p>
                  <p className="violation-message">{violation.message}</p>
                  <p className="violation-time">
                    {new Date(violation.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="violation-fullscreen-footer">
            <p className="violation-count">
              Total Violations: <strong>{totalViolations}</strong>
            </p>
            <p className="violation-note">
              Violations will be recorded in your interview score
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Compact notification mode
  return (
    <div className="violation-notification">
      {displayViolations.slice(0, 3).map((violation, idx) => (
        <div
          key={idx}
          className="violation-toast"
          style={{
            backgroundColor: getViolationColor(violation.severity),
          }}
        >
          <span className="violation-toast-icon">
            {getViolationIcon(violation.type)}
          </span>
          <span className="violation-toast-text">
            {getViolationMessage(violation.type)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ViolationAlert;
