const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function auth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid token user" });
    }
    req.user = user; // lean object, not doc
    next();
  } catch (err) {
    console.error("auth middleware error", err);
    return res.status(401).json({ success: false, message: "Token invalid" });
  }
};