const jwt = require("jsonwebtoken");
const Order = require("../models/Order");
const Book = require("../models/Book");
const razorpay = require("../config/razorpay");

// ---------------------------
// Razorpay: Create Payment Order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { totalAmount } = req.body;

    if (!totalAmount) {
      return res.status(400).json({ success: false, message: "Total amount is required" });
    }

    const amountInPaise = totalAmount * 100;

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: "receipt_order_" + Math.random().toString().slice(2, 10),
    };

    const razorpayOrder = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({ success: false, message: "Razorpay order creation failed" });
  }
};


// ---------------------------
// Create Order in DB
exports.createOrder = async (req, res) => {
  try {
    const {
  name,
  phone,
  addressLine1,
  addressLine2,
  city,
  state,
  pincode,
  country,
  items,
  totalAmount,
  paymentMode,
  razorpayOrderId,
  paymentId,
  signature
} = req.body;

if (!items || !Array.isArray(items) || items.length === 0) {
  return res.status(400).json({ success: false, message: "Items are required" });
}

// Calculate totalDeliveryFee from books
let totalDeliveryFee = 0;
for (const item of items) {
  const book = await Book.findById(item.productId);
  if (!book) {
    return res.status(400).json({ success: false, message: `Book not found: ${item.productId}` });
  }
  totalDeliveryFee += (book.deliveryFee || 0) * (item.quantity || 1);
}


// Create formatted address
const fullAddress = `${addressLine1 || ""}${addressLine2 ? ", " + addressLine2 : ""}
${city}
${state}
${pincode}
${country}`.trim();

// Generate custom order ID
const orderId = "DM_" + Date.now(); // or use UUID/random string

    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    let userId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid token user" });
      }
    }

    const mode = paymentMode?.toLowerCase();
    if (!['cod', 'online'].includes(mode)) {
      return res.status(400).json({ success: false, message: "Invalid payment mode (use 'cod' or 'online')" });
    }

    const paymentStatus = mode === "cod" ? "pending" : "paid";

const order = new Order({
  orderId,
  userId,
  name,
  phone,
  address: fullAddress,
  items,
  totalAmount,
  deliveryFee: totalDeliveryFee,
  paymentMode: mode,
  razorpayOrderId: razorpayOrderId || null,
  paymentId: paymentId || null,
  signature: signature || null,
  paymentStatus,
});


    const saved = await order.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error("Create Order Error:", err);
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
};

// ---------------------------
// Get All Orders (Admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

// ---------------------------
// Get Single Order by ID
const mongoose = require("mongoose");

exports.getOrderById = async (req, res) => {
  const { id } = req.params;

  // Check for valid Mongo ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid order ID format" });
  }

  try {
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
};

// ---------------------------
// Update Order Status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, deliveryFee } = req.body;

    const updateFields = {};
    if (status) updateFields.status = status;
    if (deliveryFee !== undefined) updateFields.deliveryFee = deliveryFee;

    const order = await Order.findByIdAndUpdate(req.params.id, updateFields, { new: true });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    console.error("Update Order Error:", err);
    res.status(500).json({ success: false, message: "Failed to update order" });
  }
};

// ---------------------------
// Get All Payments with Payment Mode
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Order.find({}, {
      paymentMode: 1,
      paymentStatus: 1,
      razorpayOrderId: 1,
      paymentId: 1,
      signature: 1,
      totalAmount: 1,
      createdAt: 1
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: payments });
  } catch (err) {
    console.error("Fetch Payments Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch payments" });
  }
};

// ---------------------------
// Get Single Payment Details by Order ID
exports.getPaymentDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id, {
      paymentMode: 1,
      razorpayOrderId: 1,
      paymentId: 1,
      signature: 1,
      paymentStatus: 1,
      totalAmount: 1,
      createdAt: 1
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    console.error("Fetch Payment Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch payment" });
  }
};

// ---------------------------
// Update Payment Info (Admin or System)
exports.updatePaymentDetails = async (req, res) => {
  try {
    const { paymentId, signature, paymentStatus } = req.body;

    const updateFields = {};
    if (paymentId) updateFields.paymentId = paymentId;
    if (signature) updateFields.signature = signature;
    if (paymentStatus) updateFields.paymentStatus = paymentStatus;

    const order = await Order.findByIdAndUpdate(req.params.id, updateFields, { new: true });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    console.error("Update Payment Error:", err);
    res.status(500).json({ success: false, message: "Failed to update payment" });
  }
};

// Notification for new Orders
exports.getNewOrdersForAdmin = async (req, res) => {
  try {
    const { since } = req.query;

    const query = since
      ? { createdAt: { $gt: new Date(since) } }
      : {};

    const newOrders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: newOrders,
      message: "Fetched new orders successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch new orders",
    });
  }
};

// ---------------------------
// Dashboard Stats (Admin)
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      codCount,
      onlineCount,
      pendingCount,
      deliveredCount,
      cancelledCount,
      paidCount
    ] = await Promise.all([
      Order.countDocuments({ paymentMode: "cod" }),
      Order.countDocuments({ paymentMode: "online" }),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "delivered" }),
      Order.countDocuments({ status: "cancelled" }),
      Order.countDocuments({ paymentStatus: "paid" }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCODOrders: codCount,
        totalOnlineOrders: onlineCount,
        pendingOrders: pendingCount,
        deliveredOrders: deliveredCount,
        cancelledOrders: cancelledCount,
        totalPaidOrders: paidCount,
      }
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard stats" });
  }
};
