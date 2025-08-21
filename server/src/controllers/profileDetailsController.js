const ClientUser = require("../models/clientUser");
const bcrypt = require("bcryptjs");

// GET user profile
exports.getClientProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await ClientUser.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error("getClientProfile error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// UPDATE user profile
exports.updateClientProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone, gender, dob, password } = req.body;

    const updateFields = {};

    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (gender) updateFields.gender = gender;
    if (dob) updateFields.dob = new Date(dob); // Convert to Date object

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      updateFields.password = hashed;
    }

    const updatedUser = await ClientUser.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: updatedUser });
  } catch (err) {
    console.error("updateClientProfile error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};