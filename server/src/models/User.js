// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const GENDERS = ["male", "female", "other"];
const ROLES = ["user", "admin"];
const PROVIDERS = ["local", "google", "facebook", "apple", "other"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Stored hashed. Pre-save hook below hashes plain values unless already bcrypt.
    password: { type: String }, // required only for provider==='local'

    provider: {
      type: String,
      enum: PROVIDERS,
      default: "local",
    },

    // Subscription flags
    isSubscribed: { type: Boolean, default: false },
    subscriptionExpiresAt: { type: Date },

    role: {
      type: String,
      enum: ROLES,
      default: "user",
    },

    // --- Profile fields ---
    mobile: { type: String, trim: true, default: "" }, // validate format in controller
    dob: { type: Date },
    gender: { type: String, enum: GENDERS, default: "other" },
  },
  { timestamps: true }
);

/**
 * Compare a candidate password (plain) to the stored hash.
 * Returns boolean.
 */
userSchema.methods.comparePassword = async function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

/**
 * Hash password before save *if* modified and not already bcrypt-formatted.
 * This allows importing pre-hashed values (strings starting with \"$2\").
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const pwd = this.password;
  if (!pwd) return next();

  // If already looks like bcrypt, skip rehousing
  if (pwd.startsWith("$2a$") || pwd.startsWith("$2b$") || pwd.startsWith("$2y$")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(pwd, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("User", userSchema);
