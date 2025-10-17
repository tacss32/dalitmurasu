const ClientUser = require("../models/ClientUser");
const bcrypt = require("bcryptjs");

// GET user profile
exports.getClientProfile = async (req, res) => {
  // The new authentication middleware already fetched the user and attached it to req.user.
  // The select("-password") is already handled by the ClientUser.findById(decoded.userId).lean()
  // in the middleware if the schema is defined to omit it by default, or if we ensure the middleware
  // is selecting the necessary fields. Assuming the middleware provides a valid user object.

  // We can directly use the user object from the request.
  const user = req.user;
  if (!user) {
    // This case should theoretically be caught by the middleware's user check,
    // but remains as a safeguard.
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Ensure password is not present in the response object, especially if the
  // middleware attached the full user document. If the middleware used .lean(),
  // we might need to be explicit or rely on the model definition.
  // For safety and consistency, we can create a copy and delete the password field.
  const userResponse = { ...user };
  delete userResponse.password; // Clean the password field if it was attached

  res.status(200).json({ success: true, data: userResponse });
};

// -----------------------------------------------------------------------------

// UPDATE user profile
exports.updateClientProfile = async (req, res) => {
  try {
    // Use req.user._id which is the standard Mongoose ID for the user object
    // fetched and attached by the new authentication middleware.
    const userId = req.user._id;

    // Destructure all potential update fields, including the passwords
    const { name, email, phone, gender, dob, password, currentPassword } =
      req.body;

    // Object to hold fields that will be updated in the database
    const updateFields = {};

    // Prepare fields for update payload if they are present in the request
    if (name !== undefined) updateFields.name = name;
    if (email !== undefined) updateFields.email = email;
    if (phone !== undefined) updateFields.phone = phone;
    if (gender !== undefined) updateFields.gender = gender;
    if (dob !== undefined) updateFields.dob = dob ? new Date(dob) : null; // Handle optional DOB

    // --- PASSWORD CHANGE LOGIC ---
    if (password) {
      // A new password is provided, current password MUST be provided and correct
      if (!currentPassword) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Current password is required to set a new password",
          });
      }

      // 1. Get the user's document, specifically including the stored hashed password for comparison
      // We must fetch it again here because the user object on req.user might be a lean object
      // *without* the password selected by the authentication middleware for security.
      const userWithPassword = await ClientUser.findById(userId).select(
        "password"
      );

      if (!userWithPassword) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // 2. Compare the provided currentPassword with the stored hashed password
      const isMatch = await bcrypt.compare(
        currentPassword,
        userWithPassword.password
      );

      if (!isMatch) {
        // Passwords do not match: Stop the update immediately
        return res
          .status(400)
          .json({ success: false, message: "Current password is incorrect" }); // <-- This is the key rejection
      }

      // 3. Current password is correct, now hash the NEW password for storage
      const hashed = await bcrypt.hash(password, 10);
      updateFields.password = hashed;
    }
    // --- END PASSWORD CHANGE LOGIC ---

    // Check if there are any fields to update (excluding the case where only password fields were sent)
    if (Object.keys(updateFields).length === 0) {
      return res
        .status(200)
        .json({
          success: true,
          message: "No changes detected or fields provided.",
        });
    }

    // 4. Update the user document
    const updatedUser = await ClientUser.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true } // new: return the updated document, runValidators: apply schema validation
    ).select("-password"); // Exclude password from the response

    if (!updatedUser) {
      return res
        .status(404)
        .json({
          success: false,
          message: "User not found after update attempt",
        });
    }

    res.status(200).json({ success: true, data: updatedUser });
  } catch (err) {
    console.error("updateClientProfile error:", err);
    // Mongoose validation errors or other general server errors
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
