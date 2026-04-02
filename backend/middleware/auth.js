const { verifyToken } = require("../utils/jwt");

/**
 * Middleware — verifies the Bearer token from the Authorization header.
 * Attaches the decoded user to `req.user` on success.
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    req.user = decoded; // { id, email, role, iat, exp }
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token." });
  }
};

/**
 * Middleware factory — restricts access to the listed roles.
 * Must be used AFTER `authenticate`.
 *
 * Usage: authorize("admin")
 *        authorize("admin", "officer")
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden. Insufficient permissions." });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
