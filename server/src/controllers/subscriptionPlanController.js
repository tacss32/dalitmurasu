const SubscriptionPlan = require("../models/SubscriptionPlan");
const ClientUser = require("../models/ClientUser");
const razorpay = require("../config/razorpay");
const crypto = require("crypto");

// -----------------------------
// Admin: Create Plan
exports.createPlan = async (req, res) => {
  try {
    const { title, description, price, durationInDays } = req.body;

    const plan = new SubscriptionPlan({
      title,
      description,
      price,
      durationInDays,
    });
    await plan.save();

    res.status(201).json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------
// Public: Get All Plans
exports.getPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find();
    res.status(200).json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------
// Admin: Update Plan
exports.updatePlan = async (req, res) => {
  try {
    const { title, description, price, durationInDays } = req.body;

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      { title, description, price, durationInDays },
      { new: true }
    );

    if (!plan) return res.status(404).json({ error: "Plan not found" });

    res.status(200).json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------
// Admin: Delete Plan
exports.deletePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);

    if (!plan) return res.status(404).json({ error: "Plan not found" });

    res.status(200).json({ message: "Plan deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------
// User: Create Razorpay Order
exports.createSubscriptionOrder = async (req, res) => {
  try {
    const { planId } = req.body;
    const user = req.user;

    if (!user || !user._id) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    if (!planId) {
      return res
        .status(400)
        .json({ success: false, message: "Plan ID is required" });
    }

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription plan not found" });
    }

    const options = {
      amount: plan.price * 100,
      currency: "INR",
      receipt: `sub_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planTitle: plan.title,
      userId: user._id,
    });
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to create Razorpay order" });
  }
};

// -----------------------------
// User: Verify Payment & Activate Subscription
exports.verifySubscriptionPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      planId,
    } = req.body;

    // 1. Validate Razorpay Signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Razorpay signature" });
    }

    // 2. Activate user subscription
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription plan not found" });
    }

    const now = new Date();
    const expiryDate = new Date(
      now.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000
    );

    const user = await ClientUser.findByIdAndUpdate(
      userId,
      {
        isSubscribed: true,
        subscriptionExpiresAt: expiryDate,
        subscriptionPlan: plan._id,
        title: plan.title,
      },
      { new: true }
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Subscription activated successfully",
      user,
    });
  } catch (err) {
    console.error("Payment verification failed:", err);
    res
      .status(500)
      .json({ success: false, message: "Payment verification failed" });
  }
};

// -----------------------------
// Admin: Manually Subscribe User
exports.manualSubscribeUser = async (req, res) => {
  try {
    const { username, title } = req.body;

    // Validate input
    if (!username || !title) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Username and Plan Title are required",
        });
    }

    // Fetch plan by title
    const plan = await SubscriptionPlan.findOne({ title });
    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription plan not found" });
    }

    // Fetch user by username
    const user = await ClientUser.findOne({ name: username });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Calculate expiry date from today
    const now = new Date();
    const expiryDate = new Date(
      now.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000
    );

    // Update user
    user.isSubscribed = true;
    user.subscriptionPlan = plan._id;
    user.subscriptionExpiresAt = expiryDate;
    user.title = plan.title;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User subscribed successfully",
      user,
    });
  } catch (err) {
    console.error("Manual subscription failed:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// -----------------------------
// Admin: Get Subscribed Users
exports.getSubscribedUsers = async (req, res) => {
  try {
    const users = await ClientUser.find({
      isSubscribed: true,
      subscriptionPlan: { $ne: null },
    })
      .populate("subscriptionPlan", "title")
      .select(
        "name email gender age phone subscriptionExpiresAt subscriptionPlan updatedAt"
      );

    const formatted = users.map((u) => ({
      _id: u._id,
      name: u.name,
      age: u.age,
      email: u.email,
      gender: u.gender,
      phone: u.phone,
      subscriptionStartDate: u.updatedAt,
      subscriptionExpiresAt: u.subscriptionExpiresAt,
      title: u.subscriptionPlan?.title || null,
    }));

    res.status(200).json({ success: true, users: formatted });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, message: "Fetch failed" });
  }
};

// -----------------------
// -------Dashboard-------
exports.getSubscriptionDashboard = async (req, res) => {
  try {
    // Step 1: Get all plans with their IDs and titles
    const plans = await SubscriptionPlan.find().select("title");

    // Step 2: Build a map of planId to title for reference
    const planMap = {};
    plans.forEach((plan) => {
      planMap[plan._id.toString()] = plan.title;
    });

    // Step 3: Aggregate subscribed user count grouped by subscriptionPlan
    const counts = await ClientUser.aggregate([
      {
        $match: {
          isSubscribed: true,
          subscriptionPlan: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$subscriptionPlan",
          count: { $sum: 1 },
        },
      },
    ]);

    // Step 4: Format the output with plan titles
    const summary = counts.map((entry) => ({
      planId: entry._id,
      title: planMap[entry._id.toString()] || "Unknown Plan",
      subscriberCount: entry.count,
    }));

    res.status(200).json({
      success: true,
      summary,
    });
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
    });
  }
};
