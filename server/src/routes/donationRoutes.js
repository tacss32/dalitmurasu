const router = require("express").Router();
const controller = require("../controllers/donationController");
const adminAuth = require("../middleware/adminAuth");

// Public donation routes
router.post("/create-order", controller.openDonation);
router.post("/verify-payment", controller.verifyDonation);

// Admin routes
router.get("/all", adminAuth, controller.getAllDonations);
router.get("/total", adminAuth, controller.getTotalDonations);
router.get("/stats", adminAuth, controller.getDonationStats);

module.exports = router;
