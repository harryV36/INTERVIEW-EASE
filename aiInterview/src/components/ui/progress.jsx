import React from "react";

export function Progress({ value, className = "", ...props }) {
  return (
    <div className={`h-2 w-full bg-gray-200 rounded-full overflow-hidden ${className}`} {...props}>
      <div
        className="h-full bg-blue-500 transition-all duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}