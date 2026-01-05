

// server/src/middleware/authClient.js

const jwt = require("jsonwebtoken");
const ClientUser = require("../models/ClientUser");

module.exports = async function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
    // ⚠️ FIX: REMOVE .lean() to get a Mongoose Document
    const user = await ClientUser.findById(decoded.id); 
    
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid token user" });
    }
    req.user = user; // This is now a Mongoose document
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};
