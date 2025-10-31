

// GET user profile
exports.getClientProfile = async (req, res) => {
  // req.user is the Mongoose document attached by the authentication middleware.
  const user = req.user;

  // 1. Convert the Mongoose document to a plain JavaScript object using .toObject().
  const userObject = user.toObject();

  // 2. Explicitly remove sensitive fields before sending the response.
  delete userObject.password;
  delete userObject.googleId;
  delete userObject.passwordResetCode;
  delete userObject.passwordResetExpires;
  delete userObject.passwordResetVerified;
  // You might also want to remove provider/role if they are not needed on the client.
  delete userObject.subscriptionPlan;

  // 3. Optional: Selectively include only the required fields for the client profile
  // For better control, you could construct a new object, but using delete is quicker.

  const profileData = {
    _id: userObject._id,
    name: userObject.name,
    email: userObject.email,
    phone: userObject.phone,
    gender: userObject.gender,
    dob: userObject.dob,
    
    
    // Add other fields needed by the client here
  };

  res.status(200).json({ success: true, data: profileData });
};

// -----------------------------------------------------------------------------

// UPDATE user profile
exports.updateClientProfile = async (req, res) => {
  try {
    // 1. Get the user document, which is attached by the authentication middleware.
    // NOTE: 'req.user' is a Mongoose document object.
    const user = req.user;

    // 2. Destructure all potential update fields
    // NOTE: Passwords have been intentionally removed from the original body destructuring,
    // as updating them is typically done in a separate, more secure process.
    const { name, phone, gender, dob } = req.body;

    let hasChanges = false;

    // 3. Directly assign new values to the user object fields if they are present
    if (name !== undefined && user.name !== name) {
      user.name = name;
      hasChanges = true;
    }

    if (phone !== undefined && user.phone !== phone) {
      user.phone = phone;
      hasChanges = true;
    }

    if (gender !== undefined && user.gender !== gender) {
      user.gender = gender;
      hasChanges = true;
    }

    if (dob !== undefined) {
      // Convert DOB string to a Date object only if it's different or the field didn't exist
      const newDob = dob ? new Date(dob) : null;
      // Basic check: user.dob might be a Date object, newDob is Date or null.
      // This check is simplified but generally prevents unnecessary saves if value is the same.
      if (
        (user.dob && newDob && user.dob.getTime() !== newDob.getTime()) ||
        (!user.dob && newDob) ||
        (user.dob && !newDob)
      ) {
        user.dob = newDob;
        hasChanges = true;
      }
    }

    // 4. Check if there are any fields to update
    if (!hasChanges) {
      // NOTE: We return the original user document as no save operation was performed.
      const userToReturn = user.toObject();
      delete userToReturn.password; // Manually remove password from the object before sending

      return res.status(200).json({
        success: true,
        message: "No changes detected or fields provided.",
        data: userToReturn,
      });
    }

    // 5. Save the updated user document
    // This runs Mongoose validators and pre-save hooks.
    const updatedUser = await user.save();

    // The user object saved might still contain the password field internally,
    // so we convert it to a plain JavaScript object and delete the password field
    // before sending the response, similar to the original .select("-password").
    const userToReturn = updatedUser.toObject();
    delete userToReturn.password;

    res.status(200).json({ success: true, data: userToReturn });
  } catch (err) {
    console.error("updateClientProfile error:", err);
    // Mongoose validation errors or other general server errors
    if (err.name === 'ValidationError') {
        // More descriptive error for validation failures
        return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: "Server Error" });
  }
};