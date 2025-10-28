
const router = require("express").Router();
const controller = require("../controllers/donationController");
const adminAuth = require("../middleware/adminAuth");

// Public donation routes
router.post("/record-donation", controller.recordDonation); // Changed from /create-order and combines payment step
// router.post("/verify-payment", controller.verifyDonation); // REMOVED: Razorpay verification is gone

// Admin routes
// router.post("/reconcile", adminAuth, controller.reconcileDonations); // REMOVED: Razorpay reconciliation is gone

router.get("/all", adminAuth, controller.getAllDonations);
router.get("/total", adminAuth, controller.getTotalDonations);
router.get("/stats", adminAuth, controller.getDonationStats);

module.exports = router;