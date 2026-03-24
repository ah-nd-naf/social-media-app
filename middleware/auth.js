const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  // Support both "Bearer <token>" and raw token
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user info to request
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
}

module.exports = authMiddleware;
