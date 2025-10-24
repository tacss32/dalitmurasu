const router = require("express").Router();
const controller = require("../controllers/subscriptionPlanController");
const authClient= require("../middleware/authClient");
const subscriptionPlanController = require("../controllers/subscriptionPlanController");
const adminAuth = require("../middleware/adminAuth")
// Public
router.get("/", controller.getPlans);

// Admin
router.post("/admin", adminAuth,controller.createPlan);
router.put("/admin/:id",adminAuth, controller.updatePlan);
router.delete("/admin/:id",adminAuth, controller.deletePlan);

// Protected by login (ClientUser must be logged in)
router.post("/create-order", authClient, controller.createSubscriptionOrder);
router.post(
  "/verify-payment",
  authClient,
  controller.verifySubscriptionPayment
);

// List subscribed users
router.get("/subscribed-users", subscriptionPlanController.getSubscribedUsers);

// User: Get their subscription status
router.get("/user-status", authClient, controller.getUserSubscriptionStatus);

// subscribe users manually
router.post("/subscribe-user",adminAuth, subscriptionPlanController.manualSubscribeUser);

// Admin: Unsubscribe a user
router.put("/unsubscribe-user/:id",adminAuth, subscriptionPlanController.unsubscribeUser);

// Dashboard: Get count of users per subscription plan
router.get(
  "/subscription-dashboard",adminAuth,
  subscriptionPlanController.getSubscriptionDashboard
);

module.exports = router;
