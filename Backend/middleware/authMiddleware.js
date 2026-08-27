// middleware/authMiddleware.js
import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    // Header can be `authorization` or `Authorization`
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ msg: "No token, authorization denied" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ msg: "No token, authorization denied" });
    }

    // VERY IMPORTANT: JWT_SECRET must be defined
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not set in environment");
      return res.status(500).json({ msg: "Server configuration error" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded should contain { id, email } from your generateToken helper
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    next();
  } catch (err) {
    console.error("Auth Error:", err.message);
    return res.status(401).json({ msg: "Token is not valid" });
  }
};

export default authMiddleware;
