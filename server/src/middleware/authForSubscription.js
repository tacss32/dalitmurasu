const jwt = require("jsonwebtoken");
const ClientUser = require("../models/ClientUser");

module.exports = async function authForSubscription(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return res.status(401).json({ success: false, message: "Invalid token payload" });
    }

    const user = await ClientUser.findById(decoded.id).select("name email isSubscribed");

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = user; // full user object can be accessed in controller
    next();
  } catch (err) {
    console.error("Subscription Auth Error:", err.message);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
