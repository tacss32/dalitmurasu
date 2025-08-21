const jwt = require("jsonwebtoken");
const ClientUser = require("../models/ClientUser");

exports.verifyToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await ClientUser.findById(decoded.id);
    if (!user) return res.status(401).json({ error: "Invalid user" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Forbidden: Invalid token" });
  }
};
