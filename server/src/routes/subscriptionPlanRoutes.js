const router = require("express").Router();
const controller = require("../controllers/subscriptionPlanController");
const authForSubscription = require("../middleware/authForSubscription");
const subscriptionPlanController = require("../controllers/subscriptionPlanController")


// Public
router.get("/", controller.getPlans);

// Admin
router.post("/admin", controller.createPlan);
router.put("/admin/:id", controller.updatePlan);
router.delete("/admin/:id", controller.deletePlan);

// Protected by login (ClientUser must be logged in)
router.post("/create-order", authForSubscription, controller.createSubscriptionOrder);
router.post("/verify-payment", authForSubscription, controller.verifySubscriptionPayment);

// List subscribed users
router.get("/subscribed-users", subscriptionPlanController.getSubscribedUsers); 

// User: Get their subscription status
router.get("/user-status", authForSubscription, controller.getUserSubscriptionStatus);


// subscribe users manually
router.post("/subscribe-user", subscriptionPlanController.manualSubscribeUser);

// Admin: Unsubscribe a user
router.put("/unsubscribe-user/:id", subscriptionPlanController.unsubscribeUser);


// Dashboard: Get count of users per subscription plan
router.get("/subscription-dashboard", subscriptionPlanController.getSubscriptionDashboard);


module.exports = router;
