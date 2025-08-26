require("dotenv").config();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const ClientUser = require("../models/ClientUser");

// Detect environment
const isProduction = process.env.NODE_ENV === "production";

// Recommended: Use .env var BACKEND_BASE_URL
const BACKEND_BASE_URL = "https://dalitmurasu.com" // remove trailing slash

const callbackURL = `${BACKEND_BASE_URL}/api/auth/google/callback`;
console.log("[Google OAuth] Using callbackURL:", callbackURL);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName || "Unnamed User";

        if (!email) return done(new Error("Google profile missing email."));

        let user = await ClientUser.findOne({ email });
        if (!user) {
          user = await ClientUser.create({
            googleId: profile.id,
            email,
            name,
            provider: "google",
          });
        } else if (!user.googleId) {
          user.googleId = profile.id;
          user.provider = "google";
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        console.error("Google auth error:", err);
        return done(err);
      }
    }
  )
);

// Session handling
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await ClientUser.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
