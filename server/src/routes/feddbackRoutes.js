const router = require("express").Router();
const controller = require("../controllers/feedbackController");
// const adminAuth = require("../middleware/adminAuth"); // Not needed for simple feedback

// Public feedback route
router.post("/submit", controller.submitFeedback);

// All admin routes are removed as there is no database storage for feedback.

module.exports = router;
