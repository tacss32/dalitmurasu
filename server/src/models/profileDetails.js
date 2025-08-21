const mongoose = require("mongoose");

const profileDetailsSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    provider: { type: String, enum: ["local", "google"], default: "local" },
    isSubscribed: { type: Boolean, default: false },
    subscriptionExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ✅ Fix: Avoid OverwriteModelError in development
module.exports =
  mongoose.models.ProfileDetails ||
  mongoose.model("ProfileDetails", profileDetailsSchema);
