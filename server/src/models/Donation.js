const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    mail: { type: String, required: true },
    pincode: { type: String, required: true },
    amount: { type: Number, required: true }, // in INR (Rupees)
    razorpay_order_id: { type: String },
    razorpay_payment_id: { type: String },
    razorpay_signature: { type: String },
    payment_status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);
