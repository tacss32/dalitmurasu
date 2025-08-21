const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "ClientUser", required: false },
    orderId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },

    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, required: true },
        title: String,
        quantity: Number,
        price: Number,
      },
    ],

    totalAmount: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    paymentMode: { type: String, enum: ["cod", "online"], required: true },
    paymentStatus: { type: String, enum: ["pending", "paid"], default: "pending" },

    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
