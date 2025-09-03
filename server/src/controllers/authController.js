// src/controllers/authController.js
const ClientUser = require("../models/ClientUser");
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passportCtl = require("passport"); // ensure passport is initialized in index.js
const { URLSearchParams } = require("url");
const nodemailer = require("nodemailer"); // Make sure this is present
const crypto = require("crypto"); // Keep if you use it elsewhere

/* -----------------------------------------------------------------------------
 * Config helpers (frontend redirect targets)
 * --------------------------------------------------------------------------- */

// const FRONTEND_BASE_FALLBACK_PROD = "https://dalitmurasu.com";
// const FRONTEND_BASE_FALLBACK_DEV = "http://localhost:5173";

// You can override these in .env:
// FRONTEND_BASE_URL=https://your-frontend-domain.com
// FRONTEND_LOGIN_PATH=/login    (default: /login-client)
// function getFrontendBaseUrl() {
//    const fromEnv = process.env.FRONTEND_BASE_URL;
//    if (fromEnv && typeof fromEnv === "string" && fromEnv.trim() !== "") {
//      return fromEnv.replace(/\/$/, "");
//    }
//    return (process.env.NODE_ENV === "production"
//      ? FRONTEND_BASE_FALLBACK_PROD
//      : FRONTEND_BASE_FALLBACK_DEV
//    ).replace(/\/$/, "");
// }

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

async function sendWelcomeEmail(toEmail, userName) {
  try {
    console.log(`Attempting to send welcome email to: ${toEmail}`);
    await transporter.sendMail({
      from: `"Dalit Murasu" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Welcome to Dalit Murasu!",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #0056b3;">Hello, ${userName}! 👋</h2>
          <p>Thank you for registering with Dalit Murasu. We are thrilled to have you join our community.</p>
          <p>You can now log in and explore all the features we have to offer.</p>
          <p>If you have any questions, feel free to reach out to us.</p>
          <p>Best regards,<br/>The Dalit Murasu Team</p>
        </div>
      `,
    });
    console.log(`Welcome email successfully sent to ${toEmail}`);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    // Log the full error object for more detail
    console.error(error);
  }
}

function getFrontendLoginPath() {
  const fromEnv = process.env.FRONTEND_LOGIN_PATH;
  if (fromEnv && typeof fromEnv === "string" && fromEnv.trim() !== "") {
    return fromEnv.startsWith("/") ? fromEnv : `/${fromEnv}`;
  }
  return "/login-client"; // current default you’ve been using
}

/* -----------------------------------------------------------------------------
 * ADMIN: LOGIN
 * --------------------------------------------------------------------------- */
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ message: "Invalid email" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const adminToken = token;
    res.json({ token: adminToken });
  } catch (err) {
    console.error("adminLogin error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -----------------------------------------------------------------------------
 * ADMIN: REGISTER (initial seeding)
 * --------------------------------------------------------------------------- */
exports.adminRegister = async (req, res) => {
  const { email, password } = req.body;
  try {
    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ email, password: hashedPassword });
    await newAdmin.save();

    res.json({ message: "Admin registered successfully" });
  } catch (err) {
    console.error("adminRegister error:", err);
    res.status(500).json({ message: "Error registering admin" });
  }
};

/* -----------------------------------------------------------------------------
 * ADMIN: VERIFY TOKEN
 * --------------------------------------------------------------------------- */
exports.adminVerifyToken = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token)
    return res.status(401).json({ message: "Invalid token format" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Admin.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ isValid: true, user });
  } catch (err) {
    console.error("adminVerifyToken error:", err);
    if (err.name === "TokenExpiredError")
      return res.status(401).json({ message: "Token expired" });
    if (err.name === "JsonWebTokenError")
      return res.status(401).json({ message: "Invalid token" });
    res
      .status(500)
      .json({ message: "Server error during token verification" });
  }
};

/* -----------------------------------------------------------------------------
 * GOOGLE OAUTH
 * --------------------------------------------------------------------------- */

// Kick off OAuth flow (used in routes)
exports.googleAuth = passportCtl.authenticate("google", {
  scope: ["profile", "email"],
});

// Callback after Google grants auth
exports.googleCallback = async (req, res, next) => {
  try {
    if (!req.user) {
      console.error("googleCallback: req.user missing");
      return res.redirect(buildFrontendRedirectUrl({ error: "no-user" }));
    }

    // Check if this is the first time the user is logging in with Google
    // If `req.user.isNew` is true, it means Passport just created the user in the database.
    if (req.user.isNew) {
      console.log('New Google user detected. Sending welcome email.');
      await sendWelcomeEmail(req.user.email, req.user.name);
    }

    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const redirectUrl = buildFrontendRedirectUrl({
      token,
      uid: req.user._id.toString(),
    });

    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("googleCallback error:", err);
    return next(err);
  }
};

// Build redirect back to frontend login page with query params
function buildFrontendRedirectUrl({ token, uid, error }) {
  const base = getFrontendBaseUrl();
  const loginPath = getFrontendLoginPath(); // e.g., /login-client or /login

  const params = new URLSearchParams();
  if (token) params.set("token", token);
  if (uid) params.set("uid", uid);
  if (error) params.set("error", error);

  return `${base}${loginPath}?${params.toString()}`;
}

/* -----------------------------------------------------------------------------
 * CLIENT: REGISTER (with name, email, phone, gender, password, dob)
 * --------------------------------------------------------------------------- */
exports.clientRegister = async (req, res) => {
  const { name, email, phone, gender, password, dob } = req.body;

  try {
    const existingUser = await ClientUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Calculate age from dob (format expected: YYYY-MM-DD)
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    const newUser = await ClientUser.create({
      name,
      email,
      phone,
      gender,
      password: hashedPassword,
      dob: birthDate,
      age,
    });

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // ✅ Add this line to send the welcome email
    await sendWelcomeEmail(newUser.email, newUser.name);

    res.json({ token, userId: newUser._id });
  } catch (err) {
    console.error("clientRegister error:", err);
    res.status(500).json({ message: "Server error during signup" });
  }
};



/* -----------------------------------------------------------------------------
 * CLIENT: LOGIN (email/password)
 * --------------------------------------------------------------------------- */
exports.clientLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await ClientUser.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // If user came from Google only (no password), reject password login
    if (!user.password) {
      return res
        .status(400)
        .json({ message: "This account was created with Google Sign-In" });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({ token, userId: user._id });
  } catch (err) {
    console.error("clientLogin error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};

/* -----------------------------------------------------------------------------
 * CLIENT: VERIFY TOKEN
 * --------------------------------------------------------------------------- */
exports.clientVerifyToken = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Invalid token format" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await ClientUser.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ isValid: true, user });
  } catch (err) {
    console.error("clientVerifyToken error:", err);
    if (err.name === "TokenExpiredError")
      return res.status(401).json({ message: "Token expired" });
    if (err.name === "JsonWebTokenError")
      return res.status(401).json({ message: "Invalid token" });
    res
      .status(500)
      .json({ message: "Server error during token verification" });
  }
};
