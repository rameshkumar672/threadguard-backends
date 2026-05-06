const jwt = require("jsonwebtoken");

const jwtAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "threatguard_secret_key");
    req.user = { id: decoded.userId, email: decoded.email };
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

module.exports = jwtAuth;
