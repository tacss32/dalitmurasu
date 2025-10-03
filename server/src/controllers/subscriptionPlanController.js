
const SubscriptionPlan = require("../models/SubscriptionPlan");
const ClientUser = require("../models/ClientUser");
const razorpay = require("../config/razorpay_util");
const crypto = require("crypto");
const nodemailer = require("nodemailer"); // Import nodemailer

/* -----------------------------------------------------------------------------
 * Email Transporter (copied from authController.js for consistency)
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
async function sendSubscriptionEmail(toEmail, userName, planTitle, planPrice, expiryDate) {
  try {
    console.log(`Attempting to send subscription email to: ${toEmail}`);
    const formattedPrice = (planPrice / 100).toFixed(2); // Convert paisa back to rupees for display
    const formattedExpiryDate = new Date(expiryDate).toLocaleDateString();

    await transporter.sendMail({
      from: `"Dalit Murasu" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Subscription Confirmation - Dalit Murasu",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #0056b3;">Hello, ${userName}! 👋</h2>
          <p>Thank you for subscribing to Dalit Murasu.</p>
          <p>Your subscription details are as follows:</p>
          <ul>
            <li><strong>Plan:</strong> ${planTitle}</li>
            <li><strong>Price Paid:</strong> ₹${formattedPrice}</li>
            <li><strong>Status:</strong> Active</li>
            <li><strong>Expires On:</strong> ${formattedExpiryDate}</li>
          </ul>
          <p>You can now enjoy full access to our content. Thank you for your support!</p>
          <p>Best regards,<br/>The Dalit Murasu Team</p>
        </div>
      `,
    });
    console.log(`Subscription email successfully sent to ${toEmail}`);
  } catch (error) {
    console.error("Error sending subscription email:", error);
  }
}

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

    // ✅ NEW: Send subscription confirmation email
    await sendSubscriptionEmail(
      user.email,
      user.name,
      plan.title,
      plan.price,
      user.subscriptionExpiresAt
    );

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
// Admin: Manually Subscribe User
exports.manualSubscribeUser = async (req, res) => {
  try {
    const { userEmail, title } = req.body;

    // Validate input
    if (!userEmail || !title) {
      return res.status(400).json({
        success: false,
        message: "User email and Plan Title are required",
      });
    }

    // Fetch plan by title
    const plan = await SubscriptionPlan.findOne({ title });
    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription plan not found" });
    }

    // Fetch user by email
    const user = await ClientUser.findOne({ email: userEmail });
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
    
    // ✅ NEW: Send confirmation email for manual subscription
    await sendSubscriptionEmail(
      user.email,
      user.name,
      plan.title,
      plan.price,
      user.subscriptionExpiresAt
    );


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

// Admin: Unsubscribe User
exports.unsubscribeUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the user and update their subscription status
    const user = await ClientUser.findByIdAndUpdate(
      id,
      {
        isSubscribed: false,
        subscriptionPlan: null,
        subscriptionExpiresAt: null,
        title: null,
      },
      { new: true } // Return the updated document
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    res.status(200).json({
      success: true,
      message: "User unsubscribed successfully.",
      user,
    });
  } catch (err) {
    console.error("Unsubscribe user failed:", err);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// -----------------------------
// User: Get Current User Subscription Status
exports.getUserSubscriptionStatus = async (req, res) => {
  try {
    const user = await ClientUser.findById(req.user._id)
      .populate("subscriptionPlan", "title price durationInDays");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // === START OF EXPIRY CHECK FIX ===
    const now = new Date();
    const isExpired = user.isSubscribed && user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) < now;

    if (isExpired) {
      console.log(`Status check detected expired subscription for user ${user.email}. Auto-unsubscribing.`);
      // Proactively update the user's status in the DB
      const updatedUser = await ClientUser.findByIdAndUpdate(
        user._id,
        {
          isSubscribed: false,
          subscriptionPlan: null,
          subscriptionExpiresAt: null,
          title: null,
        },
        { new: true }
      );
      // After updating, treat as unsubscribed and return null
      return res.status(200).json({ success: true, subscription: null });
    }
    // === END OF EXPIRY CHECK FIX ===


    if (!user.isSubscribed || !user.subscriptionPlan) {
      return res.status(200).json({ success: true, subscription: null });
    }

    res.status(200).json({
      success: true,
      subscription: {
        _id: user._id,
        planId: user.subscriptionPlan, // populated object with title etc
        startDate: user.updatedAt,
        endDate: user.subscriptionExpiresAt,
        isActive: user.isSubscribed,
      },
    });
  } catch (err) {
    console.error("Error fetching user subscription status:", err);
    res.status(500).json({ success: false, message: "Failed to fetch status" });
  }
};
