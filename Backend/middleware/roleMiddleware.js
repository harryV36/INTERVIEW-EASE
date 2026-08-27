// middleware/roleMiddleware.js

/**
 * isOrganization Middleware
 * Checks if authenticated user has organization role
 * Must be used AFTER isLogin middleware
 */
export const isOrganization = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        msg: "Authentication required",
      });
    }

    if (req.user.role !== "organization") {
      return res.status(403).json({
        success: false,
        msg: "Access denied. Organization role required",
      });
    }

    next();
  } catch (err) {
    console.error("isOrganization Middleware Error:", err.message);
    return res.status(500).json({
      success: false,
      msg: "Authorization check failed",
    });
  }
};

/**
 * isAdmin Middleware
 * Checks if authenticated user has admin role
 * Must be used AFTER isLogin middleware
 */
export const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        msg: "Authentication required",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        msg: "Access denied. Admin role required",
      });
    }

    next();
  } catch (err) {
    console.error("isAdmin Middleware Error:", err.message);
    return res.status(500).json({
      success: false,
      msg: "Authorization check failed",
    });
  }
};

/**
 * isStudent Middleware
 * Checks if authenticated user has student role
 * Must be used AFTER isLogin middleware
 */
export const isStudent = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        msg: "Authentication required",
      });
    }

    if (req.user.role !== "student") {
      return res.status(403).json({
        success: false,
        msg: "Access denied. Student role required",
      });
    }

    next();
  } catch (err) {
    console.error("isStudent Middleware Error:", err.message);
    return res.status(500).json({
      success: false,
      msg: "Authorization check failed",
    });
  }
};

/**
 * hasRole Middleware Factory
 * Creates a middleware that checks for specific role(s)
 * Must be used AFTER isLogin middleware
 * 
 * @param {string|string[]} roles - Single role or array of allowed roles
 * @returns {Function} Middleware function
 */
export const hasRole = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          msg: "Authentication required",
        });
      }

      // Convert single role to array for consistency
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          msg: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
        });
      }

      next();
    } catch (err) {
      console.error("hasRole Middleware Error:", err.message);
      return res.status(500).json({
        success: false,
        msg: "Authorization check failed",
      });
    }
  };
};

/**
 * isOrgOrAdmin Middleware
 * Allows access to both organization and admin users
 * Must be used AFTER isLogin middleware
 */
export const isOrgOrAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        msg: "Authentication required",
      });
    }

    if (req.user.role !== "organization" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        msg: "Access denied. Organization or Admin role required",
      });
    }

    next();
  } catch (err) {
    console.error("isOrgOrAdmin Middleware Error:", err.message);
    return res.status(500).json({
      success: false,
      msg: "Authorization check failed",
    });
  }
};