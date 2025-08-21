require("dotenv").config();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const ClientUser = require("../models/clientUser");

// Determine base URL
const isProduction = process.env.NODE_ENV === "production";

const BACKEND_BASE_URL = (
  process.env.BACKEND_BASE_URL || 
  (isProduction ? "https://dalitmurasu.com" : "http://localhost:3030")
).replace(/\/$/, "");

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
        let user = await ClientUser.findOne({ googleId: profile.id });

        if (!user) {
          user = await ClientUser.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            provider: "google",
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await ClientUser.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});
