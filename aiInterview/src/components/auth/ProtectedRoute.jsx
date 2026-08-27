// import React from "react";
// import { Navigate } from "react-router-dom";

// // Usage: <ProtectedRoute requiredRole="organization" element={<OrgDashboard />} />
// const ProtectedRoute = ({ requiredRole, element }) => {
//   const stored = localStorage.getItem("user");
//   if (!stored) return <Navigate to="/home/login" replace />;

//   const user = JSON.parse(stored);
//   if (requiredRole && user.role !== requiredRole) {
//     // If user is a normal student, send to profile dashboard
//     return <Navigate to="/profile" replace />;
//   }

//   return element;
// };

// export default ProtectedRoute;


// src/components/auth/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ element, requiredRole }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Check if user is authenticated
  if (!token) {
    return <Navigate to="/home/login" replace />;
  }

  // Check if specific role is required
  if (requiredRole) {
    // If user doesn't have the required role, redirect appropriately
    if (user.role !== requiredRole) {
      // Redirect based on actual role
      if (user.role === "organization") {
        return <Navigate to="/org/dashboard" replace />;
      } else if (user.role === "student" || user.role === "admin") {
        return <Navigate to="/profile" replace />;
      } else {
        return <Navigate to="/home/login" replace />;
      }
    }
  }

  // User is authenticated and has correct role (or no role required)
  return element;
};

export default ProtectedRoute;