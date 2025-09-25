// routes/order.js
const express = require("express");
const router = express.Router();
const orderCtrl = require("../controllers/orderController");

// ---------------------------
// Public/User Routes
// ---------------------------
router.post("/razorpay/create-order", orderCtrl.createRazorpayOrder);
router.post("/", orderCtrl.createOrder);
router.get("/myorders", orderCtrl.getUserOrders); // <-- CORRECTLY PLACED BEFORE :id

// ---------------------------
// More specific routes must come before the dynamic :id route
// ---------------------------
router.get("/dashboard", orderCtrl.getDashboardStats);
router.get("/payments/list", orderCtrl.getAllPayments);
router.get("/notifications", orderCtrl.getNewOrdersForAdmin);

// ---------------------------
// Admin Routes
// ---------------------------
router.get("/", orderCtrl.getAllOrders);
router.put("/:id", orderCtrl.updateOrderStatus);
router.put("/cancel/:id", orderCtrl.cancelUserOrder);

// ---------------------------
// Dynamic must go last for the same method
// ---------------------------
router.get("/:id", orderCtrl.getOrderById); // <--- This must be the last GET route
router.get("/payment/:id", orderCtrl.getPaymentDetails);
router.put("/payment/:id", orderCtrl.updatePaymentDetails);

module.exports = router;