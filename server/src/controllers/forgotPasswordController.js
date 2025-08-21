const ClientUser = require("../models/ClientUser");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

// 🔧 Step 1: Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// ✅ Step 1: Send Reset Code
exports.sendResetCode = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const user = await ClientUser.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // valid 15 mins

    user.passwordResetCode = resetCode;
    user.passwordResetExpires = expiresAt;
    user.passwordResetVerified = false; // new field
    await user.save();

    await transporter.sendMail({
      from: `"Dalit Murasu" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Password Reset Code",
      text: `Your password reset code is ${resetCode}. It is valid for 15 minutes.`,
      html: `<p>Your password reset code is <strong>${resetCode}</strong>. It is valid for 15 minutes.</p>`,
    });

    res.status(200).json({ message: "Reset code sent to your email" });
  } catch (error) {
    console.error("sendResetCode error:", error);
    res.status(500).json({ message: "Failed to send reset code" });
  }
};

// ✅ Step 2: Verify Reset Code (OTP only)
exports.verifyResetCode = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code)
    return res.status(400).json({ message: "Email and code are required" });

  try {
    const user = await ClientUser.findOne({ email });

    if (
      !user ||
      user.passwordResetCode !== code ||
      !user.passwordResetExpires ||
      user.passwordResetExpires < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    user.passwordResetVerified = true;
    await user.save();

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error("verifyResetCode error:", err);
    res.status(500).json({ message: "OTP verification failed" });
  }
};

// ✅ Step 3: Reset Password
exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res
      .status(400)
      .json({ message: "Email and new password are required" });
  }

  try {
    const user = await ClientUser.findOne({ email });

    if (!user || !user.passwordResetVerified) {
      return res
        .status(400)
        .json({
          message: "OTP verification required before resetting password",
        });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Cleanup
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("resetPassword error:", err);
    res.status(500).json({ message: "Password reset failed" });
  }
};
