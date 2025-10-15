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
async function sendSubscriptionEmail(
  toEmail,
  userName,
  planTitle,
  planPrice,
  expiryDate
) {
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
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription plan not found" });
    }

    // ⬇️ MODIFIED: Fetch full user to check stacked limit
    const fullUser = await ClientUser.findById(user._id);

    // ⬇️ NEW: Enforce the 2-plan limit for new purchases
    if (fullUser && fullUser.stackedSubscriptionCount >= 2) {
      return res.status(403).json({
        success: false,
        message:
          "Subscription limit reached. You can have a maximum of 2 stacked plans.",
        limitReached: true, // Special flag for client-side logic
      });
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

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Razorpay signature" });
    }

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription plan not found" });
    }
    const user = await ClientUser.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // ⬇️ NEW: Enforce limit as a final check
    if (user.stackedSubscriptionCount >= 2) {
      return res.status(403).json({
        success: false,
        message:
          "Subscription limit reached. Payment confirmed but subscription not activated. Contact support.",
        limitReached: true,
      });
    }

    const now = new Date();
    const baseDate =
      user.isSubscribed &&
      user.subscriptionExpiresAt &&
      new Date(user.subscriptionExpiresAt) > now
        ? new Date(user.subscriptionExpiresAt)
        : now;

    const expiryDate = new Date(
      baseDate.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000
    );

    // --- ⬇️ MODIFIED UPDATE LOGIC: Increment count ⬇️ ---
    const updateData = {
      isSubscribed: true,
      subscriptionExpiresAt: expiryDate,
      subscriptionPlan: plan._id,
      title: plan.title,
      $inc: { stackedSubscriptionCount: 1 }, // Atomically increment the count
    };

    if (!user.isSubscribed || new Date(user.subscriptionExpiresAt) < now) {
      updateData.subscriptionStartDate = now;
    }

    const updatedUser = await ClientUser.findByIdAndUpdate(userId, updateData, {
      new: true,
    });
    // --- ⬆️ END: MODIFIED UPDATE LOGIC ⬆️ ---

    await sendSubscriptionEmail(
      updatedUser.email,
      updatedUser.name,
      plan.title,
      plan.price,
      updatedUser.subscriptionExpiresAt
    );

    res.status(200).json({
      success: true,
      message: "Subscription activated successfully",
      user: updatedUser,
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
// -----------------------------
exports.manualSubscribeUser = async (req, res) => {
  try {
    const { userEmail, planId } = req.body;

    if (!userEmail || !planId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "User email and Plan ID are required",
        });
    }

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription plan not found" });
    }
    let user = await ClientUser.findOne({ email: userEmail });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // ⬇️ NEW: Enforce the 2-plan limit for manual subscription
    if (user.stackedSubscriptionCount >= 2) {
      return res.status(403).json({
        success: false,
        message:
          "Subscription limit reached. User already has 2 active/stacked plans.",
      });
    }

    const now = new Date();
    const baseDate =
      user.isSubscribed &&
      user.subscriptionExpiresAt &&
      new Date(user.subscriptionExpiresAt) > now
        ? new Date(user.subscriptionExpiresAt)
        : now;

    const expiryDate = new Date(
      baseDate.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000
    );

    // --- ⬇️ MODIFIED UPDATE LOGIC: Increment count ⬇️ ---
    const updateData = {
      isSubscribed: true,
      subscriptionExpiresAt: expiryDate,
      subscriptionPlan: plan._id,
      title: plan.title,
      $inc: { stackedSubscriptionCount: 1 }, // Atomically increment the count
    };

    if (!user.isSubscribed || new Date(user.subscriptionExpiresAt) < now) {
      updateData.subscriptionStartDate = now;
    }

    user = await ClientUser.findByIdAndUpdate(user._id, updateData, {
      new: true,
    });
    // --- ⬆️ END: MODIFIED UPDATE LOGIC ⬆️ ---

    await sendSubscriptionEmail(
      user.email,
      user.name,
      plan.title,
      plan.price,
      user.subscriptionExpiresAt
    );

    res.status(200).json({
      success: true,
      message: `User subscribed successfully. New expiry: ${expiryDate.toLocaleDateString()}`,
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
    const user = await ClientUser.findByIdAndUpdate(
      id,
      {
        isSubscribed: false,
        subscriptionPlan: null,
        subscriptionExpiresAt: null,
        title: null,
        // ⬇️ NEW: Reset the stacked count to 0 upon manual unsubscribe
        stackedSubscriptionCount: 0,
      },
      { new: true }
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
    // ⬇️ MODIFIED: Select 'stackedSubscriptionCount'
    const user = await ClientUser.findById(req.user._id)
      .select(
        "isSubscribed subscriptionExpiresAt subscriptionPlan title subscriptionStartDate stackedSubscriptionCount"
      )
      .populate("subscriptionPlan", "title price durationInDays");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const now = new Date();
    const isExpired =
      user.isSubscribed &&
      user.subscriptionExpiresAt &&
      new Date(user.subscriptionExpiresAt) < now;

    if (isExpired) {
      // ⬇️ NEW: Decrement stackedSubscriptionCount and reset other fields
      const updatedUser = await ClientUser.findByIdAndUpdate(
        user._id,
        {
          isSubscribed: false,
          subscriptionPlan: null,
          subscriptionExpiresAt: null,
          title: null,
          // Decrement the count, ensuring it doesn't go below 0
          $inc: { stackedSubscriptionCount: -1 },
        },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        subscription: null,
        // ⬇️ MODIFIED RESPONSE: Return the new count
        stackedCount: updatedUser.stackedSubscriptionCount,
      });
    }

    // ⬇️ MODIFIED: Include stackedSubscriptionCount in the response
    if (!user.isSubscribed || !user.subscriptionPlan) {
      return res.status(200).json({
        success: true,
        subscription: null,
        stackedCount: user.stackedSubscriptionCount || 0,
      });
    }

    res.status(200).json({
      success: true,
      subscription: {
        _id: user.subscriptionPlan._id, // Send plan ID for comparison
        planId: user.subscriptionPlan,
        startDate: user.subscriptionStartDate,
        endDate: user.subscriptionExpiresAt,
        isActive: user.isSubscribed,
      },
      // ⬇️ NEW: Return the current count
      stackedCount: user.stackedSubscriptionCount || 0,
    });
  } catch (err) {
    console.error("Error fetching user subscription status:", err);
    res.status(500).json({ success: false, message: "Failed to fetch status" });
  }
};