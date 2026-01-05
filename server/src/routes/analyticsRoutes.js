const express = require("express");
const router = express.Router();
const { trackVisit, getAnalytics } = require("../controllers/analyticsController");
const adminAuth = require("../middleware/adminAuth");

router.post("/visit", trackVisit);
router.get("/data", adminAuth, getAnalytics);

module.exports = router;
