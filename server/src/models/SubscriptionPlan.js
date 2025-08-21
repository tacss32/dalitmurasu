const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // e.g., Monthly, Yearly
    description: String,
    price: { type: Number, required: true },
    durationInDays: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);