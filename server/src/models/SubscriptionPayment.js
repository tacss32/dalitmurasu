const mongoose = require("mongoose");

const subscriptionPaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientUser",
      required: true,
    },
    subscriptionPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },

    phone: { type: String },
    mail: { type: String, required: true },

    amount: { type: Number, required: true }, // in INR (Rupees)
    razorpay_order_id: { type: String },
    razorpay_payment_id: { type: String },
    razorpay_signature: { type: String },
    payment_status: {
      type: String,
      enum: ["pending", "success", "failed", "canceled"],
      default: "pending",
    },

    startDate: { type: Date },
    endDate: { type: Date },
  
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "SubscriptionPayment",
  subscriptionPaymentSchema
);
