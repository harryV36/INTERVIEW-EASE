// middleware/isLogin.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * isLogin Middleware
 * Checks if user is authenticated and attaches full user object to req.user
 * Similar to authMiddleware but also fetches user data from database
 */
const isLogin = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        success: false,
        msg: "No token provided, authorization denied" 
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ 
        success: false,
        msg: "No token provided, authorization denied" 
      });
    }

    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not set in environment");
      return res.status(500).json({ 
        success: false,
        msg: "Server configuration error" 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from database (excluding password)
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ 
        success: false,
        msg: "User not found, authorization denied" 
      });
    }

    // Attach full user object to request
    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role || "student",
      createdAt: user.createdAt,
    };

    // Also attach the raw user document for advanced use cases
    req.userDoc = user;

    next();
  } catch (err) {
    console.error("isLogin Middleware Error:", err.message);

    // Handle specific JWT errors
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ 
        success: false,
        msg: "Invalid token" 
      });
    }

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ 
        success: false,
        msg: "Token expired, please login again" 
      });
    }

    return res.status(401).json({ 
      success: false,
      msg: "Authentication failed" 
    });
  }
};

export default isLogin;