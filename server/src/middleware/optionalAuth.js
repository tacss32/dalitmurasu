// middleware/optionalAuth.js
const jwt = require("jsonwebtoken");
const ClientUser = require("../models/ClientUser");

/**
 * Attach req.user if a valid bearer token is present.
 * Does NOT error when no/invalid token; proceeds as guest.
 */
module.exports.optionalAuth = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return next();

  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // You may want .lean(); using full doc here in case downstream needs methods
    const user = await ClientUser.findById(decoded.id);
    if (user) req.user = user;
  } catch (err) {
    // swallow errors; treat as guest
  }
  next();
};
