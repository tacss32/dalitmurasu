const mongoose = require("mongoose");
// const { default: subscriptions } = require("razorpay/dist/types/subscriptions");

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
  subscriptionPlan: [
    {
      plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubscriptionPlan", // Reference to the SubscriptionPlan model
      },
      subscribedDate: { type: Date },
      subscriptionExpires: { type: Date },
    },
  ],

  // Optional: kept for legacy support/migration


  role: { type: String, enum: ["user", "admin"], default: "user" },
});

module.exports =
  mongoose.models.ClientUser || mongoose.model("ClientUser", clientUserSchema);
