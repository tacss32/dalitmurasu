// src/routes/authRoutes.js
const express = require("express");
const passport = require("passport");
const {
  adminLogin,
  adminRegister,
  adminVerifyToken,
  clientLogin,
  clientVerifyToken,
  clientRegister,
  googleAuth,
  googleCallback,
} = require("../controllers/authController");

const router = express.Router();

/* ------------------------------------------------------------------
 * ADMIN AUTH
 * ---------------------------------------------------------------- */
router.post("/admin/login", adminLogin);
router.post("/admin/register", adminRegister);
router.post("/admin/verify-token", adminVerifyToken);

/* ------------------------------------------------------------------
 * CLIENT AUTH (email/password)
 * ---------------------------------------------------------------- */
router.post("/client/login", clientLogin);
router.post("/client/register", clientRegister);
router.post("/client/verify-token", clientVerifyToken);

/* ------------------------------------------------------------------
 * GOOGLE OAUTH (Client)
 *
 * Primary entry:        GET /api/auth/google
 * Callback (Google ->): GET /api/auth/google/callback
 *
 * Aliases are included for older frontends that still call:
 *   /api/auth/client/google
 *   /api/auth/client-auth/google
 * Remove aliases when all clients are updated.
 * ---------------------------------------------------------------- */

// --- Initiate OAuth (primary) ---
router.get("/google", googleAuth);

// --- Legacy aliases (optional; safe to keep) ---
router.get("/client/google", googleAuth);
router.get("/client-auth/google", googleAuth);

// --- Callback (primary) ---
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/api/auth/google/failure",
  }),
  googleCallback
);

// --- Legacy callback aliases ---
router.get(
  "/client/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/api/auth/google/failure",
  }),
  googleCallback
);
router.get(
  "/client-auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/api/auth/google/failure",
  }),
  googleCallback
);

// --- Failure handler (simple JSON) ---
router.get("/google/failure", (req, res) => {
  res.status(400).json({ message: "Google sign-in failed" });
});

module.exports = router;
