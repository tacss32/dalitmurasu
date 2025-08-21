const User = require("../models/User");
const bcrypt = require("bcryptjs");

// --- helpers --------------------------------------------------------------
const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;
  const { _id, name, email, mobile, dob, gender, provider, isSubscribed, role, createdAt, updatedAt } = userDoc;
  return { _id, name, email, mobile, dob, gender, provider, isSubscribed, role, createdAt, updatedAt };
};

// --- GET /api/profile/:id -------------------------------------------------
exports.getProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // Users may only read their own profile unless admin
    if (req.user.role !== "admin" && req.user._id.toString() !== id.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, data: sanitizeUser(user) });
  } catch (err) {
    console.error("getProfile error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// --- PUT /api/profile/:id -------------------------------------------------
// Update name, email, mobile, dob, gender
exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== "admin" && req.user._id.toString() !== id.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const { name, email, mobile, dob, gender } = req.body;

    // Basic validation
    const updates = {};
    if (typeof name === "string" && name.trim()) updates.name = name.trim();
    if (typeof email === "string" && email.trim()) updates.email = email.trim().toLowerCase();
    if (typeof mobile === "string") updates.mobile = mobile.trim();
    if (dob) {
      const parsed = new Date(dob);
      if (!isNaN(parsed.getTime())) updates.dob = parsed;
    }
    if (gender && ["male", "female", "other"].includes(gender)) updates.gender = gender;

    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, message: "Profile updated", data: sanitizeUser(user) });
  } catch (err) {
    console.error("updateProfile error", err);
    // duplicate email?
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Email already in use" });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// --- PATCH /api/profile/:id/password --------------------------------------
exports.changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (req.user.role !== "admin" && req.user._id.toString() !== id.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 chars" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // If provider !== local, allow admin/3rd-party reset without current password
    if (user.provider === "local" && req.user.role !== "admin") {
      const ok = await bcrypt.compare(currentPassword || "", user.password);
      if (!ok) {
        return res.status(400).json({ success: false, message: "Current password incorrect" });
      }
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.json({ success: true, message: "Password updated" });
  } catch (err) {
    console.error("changePassword error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};