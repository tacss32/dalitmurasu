const jwt = require("jsonwebtoken");
const Order = require("../models/Order");
const Book = require("../models/Book");
const razorpay = require("../config/razorpay_util");
const nodemailer = require("nodemailer");
const ClientUser = require("../models/ClientUser");
const mongoose = require("mongoose");

/* -----------------------------------------------------------------------------
 * Email Transporter
 * --------------------------------------------------------------------------- */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/* -----------------------------------------------------------------------------
 * Email Helper Function
 * --------------------------------------------------------------------------- */
async function sendOrderConfirmationEmail(order, userEmail) {
  console.log(`[Email] Attempting to send order confirmation to: ${userEmail}`);
  try {
    const itemDetails = order.items.map(item => `
      <li><strong>${item.title}</strong> - Quantity: ${item.quantity}, Price: ₹${item.price.toFixed(2)}</li>
    `).join('');

    const formattedTotal = order.totalAmount.toFixed(2);
    const formattedDelivery = order.deliveryFee.toFixed(2);
    const totalWithDelivery = (order.totalAmount + order.deliveryFee).toFixed(2);

    const mailOptions = {
      from: `"Dalit Murasu" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Order Confirmation #${order.orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #0056b3;">Hello, ${order.name}! 👋</h2>
          <p>Thank you for your order with Dalit Murasu. Your order has been successfully placed and is being processed.</p>
          <h3 style="color: #0056b3;">Order Details</h3>
          <p><strong>Order ID:</strong> ${order.orderId}</p>
          <p><strong>Date:</strong> ${new Date(
            order.createdAt
          ).toLocaleDateString("en-GB")}</p>
         
          <h4 style="color: #0056b3;">Items Purchased:</h4>
          <ul style="list-style-type: none; padding: 0;">
            ${itemDetails}
          </ul>
          <p><strong>Subtotal:</strong> ₹${formattedTotal}</p>
          <p><strong>Delivery Fee:</strong> ₹${formattedDelivery}</p>
          <p style="font-size: 1.2em; font-weight: bold;"><strong>Total Amount:</strong> ₹${totalWithDelivery}</p>
          <h4 style="color: #0056b3;">Shipping Address:</h4>
          <p>
            ${order.name}<br>
            ${order.address.replace(/\n/g, "<br>")}<br>
            Phone: ${order.phone}
          </p>
          <p>We'll notify you once your order has been shipped. If you have any questions, please contact our support team.</p>
          <p>94444 52877</p>
          <p>Best regards,<br/>The Dalit Murasu Team</p>
        </div>
      `,
    };

    // Use .then() and .catch() to log success or failure
    await transporter.sendMail(mailOptions)
      .then(info => {
        console.log("[Email] Order confirmation email successfully sent.");
        console.log("[Email] Message ID:", info.messageId);
        console.log("[Email] Response:", info.response);
      })
      .catch(error => {
        console.error("[Email] Error sending order confirmation email:", error);
      });

  } catch (error) {
    console.error("[Email] Unhandled error in sendOrderConfirmationEmail:", error);
  }
}

// ---------------------------
// Razorpay: Create Payment Order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { totalAmount } = req.body;

    if (!totalAmount) {
      return res
        .status(400)
        .json({ success: false, message: "Total amount is required" });
    }

    const amountInPaise = totalAmount * 100;

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: "receipt_order_" + Math.random().toString().slice(2, 10),
    };

    console.log("[Razorpay] Attempting to create order with options:", options);
    const razorpayOrder = await razorpay.orders.create(options);
    console.log("[Razorpay] Order created successfully:", razorpayOrder.id);

    return res.status(200).json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error) {
    console.error("[Razorpay] Order Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Razorpay order creation failed" });
  }
};

// ---------------------------
// Create Order in DB
exports.createOrder = async (req, res) => {
  console.log("[Order] Received new order creation request.");
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
      signature,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log("[Order] Validation failed: Items are required.");
      return res
        .status(400)
        .json({ success: false, message: "Items are required" });
    }

    let totalDeliveryFee = 0;
    for (const item of items) {
      const book = await Book.findById(item.productId);
      if (!book) {
        console.log(`[Order] Validation failed: Book not found for ID ${item.productId}`);
        return res
          .status(400)
          .json({
            success: false,
            message: `Book not found: ${item.productId}`,
          });
      }
      totalDeliveryFee += (book.deliveryFee || 0) * (item.quantity || 1);
    }

    const fullAddress = `${addressLine1 || ""}${
      addressLine2 ? ", " + addressLine2 : ""
    }
${city}
${state}
${pincode}
${country}`.trim();

    const orderId = "DM_" + Date.now();

    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;
    let userId = null;
    let userEmail = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Corrected line: Use decoded.id to get the user ID
        userId = decoded.id;
        console.log(`[Auth] Token decoded, userId: ${userId}`);

        const user = await ClientUser.findById(userId).select('email');
        if (user) {
          userEmail = user.email;
          console.log(`[Auth] Found user email: ${userEmail}`);
        } else {
          console.log(`[Auth] No user found for userId: ${userId}`);
        }
      } catch (err) {
        console.error("[Auth] Token verification failed:", err.message);
        return res
          .status(401)
          .json({ success: false, message: "Invalid token user" });
      }
    } else {
      console.log("[Auth] No authentication token provided. Order will be created without a userId.");
    }

    const mode = paymentMode?.toLowerCase();
    if (!["cod", "online"].includes(mode)) {
      console.log("[Order] Validation failed: Invalid payment mode.");
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid payment mode (use 'cod' or 'online')",
        });
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

    console.log("[Order] Saving order to database...");
    const saved = await order.save();
    console.log("[Order] Order saved with ID:", saved._id);
    
    if (userEmail) {
      sendOrderConfirmationEmail(saved, userEmail)
        .catch(console.error);
    }

    console.log("[Order] Sending successful response to client.");
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error("[Order] Create Order Error:", err);
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
// const mongoose = require("mongoose");

exports.getOrderById = async (req, res) => {
  const { id } = req.params;

  // Check for valid Mongo ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid order ID format" });
  }

  try {
    const order = await Order.findById(id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
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

    const order = await Order.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
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
    const payments = await Order.find(
      {},
      {
        paymentMode: 1,
        paymentStatus: 1,
        razorpayOrderId: 1,
        paymentId: 1,
        signature: 1,
        totalAmount: 1,
        createdAt: 1,
      }
    ).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: payments });
  } catch (err) {
    console.error("Fetch Payments Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch payments" });
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
      createdAt: 1,
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    console.error("Fetch Payment Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch payment" });
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

    const order = await Order.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    console.error("Update Payment Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to update payment" });
  }
};

// Notification for new Orders
exports.getNewOrdersForAdmin = async (req, res) => {
  try {
    const { since } = req.query;

    const query = since ? { createdAt: { $gt: new Date(since) } } : {};

    const newOrders = await Order.find(query).sort({ createdAt: -1 }).limit(10);

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
      paidCount,
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
      },
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch dashboard stats" });
  }
};


// Get Orders for a specific user
exports.getUserOrders = async (req, res) => {
    try {
        const authHeader = req.headers.authorization || req.headers.Authorization;
        const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

        if (!token) {
            return res.status(401).json({ success: false, message: "Authentication token is required." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const orders = await Order.find({ userId: userId }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: orders });
    } catch (err) {
        console.error("[Order] Fetch User Orders Error:", err);
        if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
            // Correctly handle JWT-specific errors with a 401 Unauthorized status
            return res.status(401).json({ success: false, message: "Invalid or expired authentication token." });
        }
        res.status(500).json({ success: false, message: "Failed to fetch user orders." });
    }
};

// Cancel an Order
exports.cancelUserOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication token is required." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Find the order and verify it belongs to the authenticated user
    const order = await Order.findOne({ _id: id, userId: userId });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or you do not have permission to cancel it." });
    }

    // Check if the order can be cancelled
    if (order.status !== "pending") {
      return res.status(400).json({ success: false, message: `Cannot cancel order with status: ${order.status}.` });
    }

    order.status = "cancelled";
    await order.save();

    res.status(200).json({ success: true, message: "Order successfully cancelled.", data: order });
  } catch (err) {
    console.error("[Order] Cancel Order Error:", err);
    res.status(500).json({ success: false, message: "Failed to cancel order." });
  }
};