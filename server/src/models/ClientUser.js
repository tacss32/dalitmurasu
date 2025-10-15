const mongoose = require("mongoose");

const clientUserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, sparse: true },
  gender: {
    type: String,
    enum: ["male", "female"],
  },
  password: String,
  googleId: { type: String, unique: true, sparse: true },
  provider: { type: String, default: "local" },

  dob: { type: Date },
  age: { type: Number },

  passwordResetCode: { type: String },
  passwordResetExpires: { type: Date },
  passwordResetVerified: Boolean,

  // New: Reference to actual SubscriptionPlan
  subscriptionPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubscriptionPlan", // model name
  },

  // Optional: kept for legacy support/migration
  title: { type: String },
  subscriptionStartDate: { type: Date },
  isSubscribed: { type: Boolean, default: false },

  subscriptionExpiresAt: { type: Date },
  stackedSubscriptionCount: {
    type: Number,
    default: 0,
    min: 0,
  },

  role: { type: String, enum: ["user", "admin"], default: "user" },
});

module.exports =
  mongoose.models.ClientUser || mongoose.model("ClientUser", clientUserSchema);
