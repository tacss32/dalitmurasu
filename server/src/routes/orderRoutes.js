const express = require("express");
const router = express.Router();
const orderCtrl = require("../controllers/orderController");

// ---------------------------
// Public/User Routes
// ---------------------------
router.post("/razorpay/create-order", orderCtrl.createRazorpayOrder); // Razorpay Order creation
router.post("/", orderCtrl.createOrder);                               // Place an Order

// ---------------------------
// Dashboard (place before /:id)
// ---------------------------
router.get("/dashboard", orderCtrl.getDashboardStats);               // Summary for Admin Panel

// ---------------------------
// Razorpay Payment Routes
// ---------------------------
router.get("/payments/list", orderCtrl.getAllPayments);               // All payment summaries
router.get("/payment/:id", orderCtrl.getPaymentDetails);              // Get payment by Order ID
router.put("/payment/:id", orderCtrl.updatePaymentDetails);          // Update payment status/info

// ---------------------------
// Notifications
// ---------------------------
router.get("/notifications", orderCtrl.getNewOrdersForAdmin);        // Recent orders for admin notification

// ---------------------------
// Admin Routes
// ---------------------------
router.get("/", orderCtrl.getAllOrders);                               // List all orders
router.put("/:id", orderCtrl.updateOrderStatus);                       // Update order status or delivery fee

// ---------------------------
// Dynamic must go last
// ---------------------------
router.get("/:id", orderCtrl.getOrderById);                            // Get Order by ID

module.exports = router;
