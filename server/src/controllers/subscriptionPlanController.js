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
  

    // ⬇️ NEW: Enforce the 2-plan limit for new purchases
    const now = new Date();
    // Make a mutable copy of the user's current subscription plans
    let currentPlans = user.subscriptionPlan ? [...user.subscriptionPlan] : [];

    // --- LOGIC: Manage subscription array limit (max 2) ---
    if (currentPlans.length >= 2) {
      // Sort plans by expiration date to ensure the first element is the oldest
      currentPlans.sort(
        (a, b) =>
          new Date(a.subscriptionExpires) - new Date(b.subscriptionExpires)
      );
      const oldestPlan = currentPlans[0];

      // Check if the oldest subscription has expired
      if (new Date(oldestPlan.subscriptionExpires) < now) {
        // If it's expired, remove it from the front of the array.
        currentPlans.shift();
      } else {
        // If it's not expired, the user cannot add a third plan yet.
        return res.status(403).json({
          success: false,
          message:
            "Subscription limit reached. You already have two active plans.",
          limitReached: true,
        });
      }
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



// User: Verify Payment & Activate Subscription
exports.verifySubscriptionPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
    } = req.body;

    // 1. Verify Razorpay Signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Razorpay signature" });
    }

    // 2. Fetch User and Plan details
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription plan not found" });
    }

    // Assume req.user is a Mongoose document loaded by middleware
    const user = req.user;

    const now = new Date();
    // Make a mutable copy of the user's current subscription plans
    let currentPlans = user.subscriptionPlan ? [...user.subscriptionPlan] : [];

    // --- LOGIC: Manage subscription array limit (max 2) ---
    if (currentPlans.length >= 2) {
      // Sort plans by expiration date to ensure the first element is the oldest
      currentPlans.sort(
        (a, b) =>
          new Date(a.subscriptionExpires) - new Date(b.subscriptionExpires)
      );
      const oldestPlan = currentPlans[0];

      // Check if the oldest subscription has expired
      if (new Date(oldestPlan.subscriptionExpires) < now) {
        // If it's expired, remove it from the front of the array.
        currentPlans.shift();
      } else {
        // If it's not expired, the user cannot add a third plan yet.
        return res.status(403).json({
          success: false,
          message:
            "Subscription limit reached. You already have two active plans.",
          limitReached: true,
        });
      }
    }

    // --- REVISED: Calculate Expiry Date (Stacking Logic) ---
    // Determine the base date for the new subscription.
    let baseDate = now;

    // If there are existing plans, find the one that expires last.
    if (currentPlans.length > 0) {
      const latestPlan = currentPlans[currentPlans.length - 1];
      const latestExpiry = new Date(latestPlan.subscriptionExpires);
      // If the latest plan's expiry is in the future, use it as the base.
      if (latestExpiry > now) {
        baseDate = latestExpiry;
      }
    }

    const expiryDate = new Date(
      baseDate.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000
    );

    // Create the new subscription object to be added
    const newSubscription = {
      plan: plan._id,
      subscribedDate: now,
      subscriptionExpires: expiryDate,
    };

    // Add the new subscription to our managed array
    currentPlans.push(newSubscription);

    // 3. Update User Document using .save()
    // ----------------------------------------------------
    // Assign the modified array back to the Mongoose document
    user.subscriptionPlan = currentPlans;

    // Save the document, triggering pre/post save hooks
    const updatedUser = await user.save();
    // ----------------------------------------------------

    // 4. Send Confirmation Email and Respond
    // Pass the correct expiry date of the newly added subscription
    await sendSubscriptionEmail(
      updatedUser.email,
      updatedUser.name,
      plan.title,
      plan.price,
      newSubscription.subscriptionExpires // Corrected variable
    );

    res.status(200).json({
      success: true,
      message: "Subscription activated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Payment verification failed:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error during payment verification",
    });
  }
};

// -----------------------------
// Admin: Manually Subscribe User
// -----------------------------
exports.manualSubscribeUser = async (req, res) => {
  try {
    const { userEmail, planId } = req.body;

    if (!userEmail || !planId) {
      return res.status(400).json({
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

    const now = new Date();
    // Make a mutable copy of the user's current subscription plans
    let currentPlans = user.subscriptionPlan ? [...user.subscriptionPlan] : [];

    // --- LOGIC: Manage subscription array limit (max 2) ---
    if (currentPlans.length >= 2) {
      // Sort plans by expiration date to ensure the first element is the oldest
      currentPlans.sort(
        (a, b) =>
          new Date(a.subscriptionExpires) - new Date(b.subscriptionExpires)
      );
      const oldestPlan = currentPlans[0];

      // Check if the oldest subscription has expired
      if (new Date(oldestPlan.subscriptionExpires) < now) {
        // If it's expired, remove it from the front of the array.
        currentPlans.shift();
      } else {
        // If it's not expired, the user cannot add a third plan yet.
        return res.status(403).json({
          success: false,
          message:
            "Subscription limit reached. You already have two active plans.",
          limitReached: true,
        });
      }
    }

    // --- REVISED: Calculate Expiry Date (Stacking Logic) ---
    // Determine the base date for the new subscription.
    // Default to 'now' if there are no existing plans.
    let baseDate = now;

    // If there are existing plans, find the one that expires last.
    if (currentPlans.length > 0) {
      const latestPlan = currentPlans[currentPlans.length - 1];
      const latestExpiry = new Date(latestPlan.subscriptionExpires);
      // If the latest plan's expiry is in the future, use it as the base.
      if (latestExpiry > now) {
        baseDate = latestExpiry;
      }
    }

    const expiryDate = new Date(
      baseDate.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000
    );

    // Create the new subscription object to be added
    const newSubscription = {
      plan: plan._id,
      subscribedDate: now,
      subscriptionExpires: expiryDate,
    };

    // Add the new subscription to our managed array
    currentPlans.push(newSubscription);

    // --- UPDATE LOGIC ---
    // Update the user with the modified array of plans
    const updatedUser = await ClientUser.findByIdAndUpdate(
      user._id,
      { subscriptionPlan: currentPlans },
      { new: true } // This option returns the updated document
    );

    // 4. Send Confirmation Email and Respond
    // Pass the correct expiry date of the newly added subscription
    await sendSubscriptionEmail(
      updatedUser.email,
      updatedUser.name,
      plan.title,
      plan.price,
      newSubscription.subscriptionExpires // Corrected variable
    );

    res.status(200).json({
      success: true,
      message: "Subscription activated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Payment verification failed:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error during payment verification",
    });
  }
};


// -----------------------
// -------Dashboard-------
exports.getSubscriptionDashboard = async (req, res) => {
  try {
    // Step 1: Get all plans with their IDs and titles (this part is correct and remains)
    const allPlans = await SubscriptionPlan.find().select("title");

    // Step 2: Build a map of planId to title for easy lookup
    const planMap = {};
    allPlans.forEach((plan) => {
      planMap[plan._id.toString()] = plan.title;
    });

    // Step 3: Aggregate subscribed user count, properly handling the subscriptionPlan array
    const counts = await ClientUser.aggregate([
      // Stage 1: Deconstruct the subscriptionPlan array into separate documents
      // This is the key change. If a user has 2 plans, this creates 2 documents for them in the pipeline.
      {
        $unwind: "$subscriptionPlan",
      },

      // Stage 2 (Optional but Recommended): Filter for only active subscriptions
      // This ensures your dashboard reflects current, not expired, subscribers.
      {
        $match: {
          "subscriptionPlan.subscriptionExpires": { $gte: new Date() },
        },
      },

      // Stage 3: Group by the actual plan ID inside the array and count them
      {
        $group: {
          _id: "$subscriptionPlan.plan", // Group by the ObjectId of the plan
          count: { $sum: 1 }, // Count the documents in each group
        },
      },
    ]);

    // Step 4: Format the output with plan titles (this part is also correct and remains)
    const summary = counts.map((entry) => ({
      planId: entry._id,
      title: planMap[entry._id.toString()] || "Unknown Plan",
      subscriberCount: entry.count,
    }));

    // Bonus: Include plans that have zero subscribers
    allPlans.forEach((plan) => {
      if (!summary.some((s) => s.planId.toString() === plan._id.toString())) {
        summary.push({
          planId: plan._id,
          title: plan.title,
          subscriberCount: 0,
        });
      }
    });

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

// Admin: Unsubscribe User (Revised to handle single plan removal)
// subscriptionController.js (Modified exports.unsubscribeUser)
exports.unsubscribeUser = async (req, res) => {
    try {
        const { id } = req.params; // User ID
        const { planId } = req.body; // Optional: ID of the plan to remove

        const user = await ClientUser.findById(id);
        if (!user) return res.status(404).json({ success: false, message: "User not found." });

        if (!planId) {
            // Case 2: Remove ALL plans (default unsubscribe behavior)
            await ClientUser.findByIdAndUpdate(id, { subscriptionPlan: [] });
            return res.status(200).json({ success: true, message: "User unsubscribed successfully (all plans removed)." });
        }

        // Case 1: Remove a specific plan from the subscriptionPlan array
        // 1. Find the plan to remove
        const planIndex = user.subscriptionPlan.findIndex(p => p._id.toString() === planId);
        if (planIndex === -1) {
            return res.status(404).json({ success: false, message: "Subscription plan not found on user." });
        }

        const removedPlan = user.subscriptionPlan[planIndex];
        const removedPlanDuration = await SubscriptionPlan.findById(removedPlan.plan);
        const durationInDays = removedPlanDuration ? removedPlanDuration.durationInDays : 0;
        
        // 2. Remove the plan
        user.subscriptionPlan.splice(planIndex, 1);
        
        // --- 🔥 FIX START: Recalculate Stacking for Remaining Plans ---
        
        const now = new Date();
        let baseDate = now;
        
        // 3. Re-stack the remaining plans in their original order
        for (let i = 0; i < user.subscriptionPlan.length; i++) {
            let currentPlan = user.subscriptionPlan[i];
            
            // Get the actual duration of the plan from the DB (using the populated 'plan' field)
            const planDetails = await SubscriptionPlan.findById(currentPlan.plan);
            if (!planDetails) continue; // Skip if plan details are missing

            // Calculate new expiry date based on the current baseDate
            const newExpiryDate = new Date(
                baseDate.getTime() + planDetails.durationInDays * 24 * 60 * 60 * 1000
            );
            
            // Update the plan's expiry date
            user.subscriptionPlan[i].subscriptionExpires = newExpiryDate;
            
            // Set the new baseDate for the next plan to stack on
            baseDate = newExpiryDate;
        }

        // --- 🔥 FIX END ---

        // 4. Save the updated user document
        const updatedUser = await user.save(); // Use save() since we modified the document object

        // Re-run the active-plan logic to see what the user has left
        const updatedActivePlans = updatedUser.subscriptionPlan
            .filter(sub => new Date(sub.subscriptionExpires) > now);

        res.status(200).json({
            success: true,
            message: "Subscription plan removed and remaining plans re-stacked successfully.",
            hasActiveSubscriptions: updatedActivePlans.length > 0,
            user: updatedUser,
        });

    } catch (err) {
        console.error("Unsubscribe user failed:", err);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};

exports.getSubscribedUsers = async (req, res) => {
  try {
    // 1. Initial Query: Find all users with at least one active subscription
    const users = await ClientUser.find({
      "subscriptionPlan.subscriptionExpires": { $gt: new Date() },
    })
      // 2. Populate: Get the title for each plan object
      .populate("subscriptionPlan.plan", "title")
      .select("name email gender age phone subscriptionPlan");

    // 3. Updated Formatting Logic: Collect ALL active plans for each user
    const formatted = users.map((u) => {
      // Filter for active plans
      const activePlans = u.subscriptionPlan
        .filter((sub) => new Date(sub.subscriptionExpires) > new Date())
        .sort(
          (a, b) => new Date(a.subscribedDate) - new Date(b.subscribedDate)
        );

      // Map the active plans to a simplified array of plan objects
      const plans = activePlans.map((plan) => ({
        // *** CRITICAL FIX: Include the unique MongoDB _id for the embedded plan document ***
        _id: plan._id,
        subscriptionStartDate: plan.subscribedDate,
        subscriptionExpiresAt: plan.subscriptionExpires,
        title: plan.plan?.title || "N/A",
      }));

      return {
        _id: u._id,
        name: u.name,
        age: u.age,
        email: u.email,
        gender: u.gender,
        phone: u.phone,
        activeSubscriptions: plans,
      };
    });

    res.status(200).json({ success: true, users: formatted });
  } catch (err) {
    console.error("Error fetching subscribed users:", err);
    res.status(500).json({ success: false, message: "Fetch failed" });
  }
};

exports.getUserSubscriptionStatus = async (req, res) => {
  try {
    const user = await ClientUser.findById(req.user._id)
      .select("subscriptionPlan") // Select only the necessary fields
      // Correctly populate the 'plan' document within the array
      .populate("subscriptionPlan.plan", "title price durationInDays");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const now = new Date();

    // 1. Filter for only active subscriptions from the array
    const activeSubscriptions = user.subscriptionPlan.filter(
      (sub) => new Date(sub.subscriptionExpires) > now
    );

    // 2. If there are no active subscriptions, return the inactive status
    if (activeSubscriptions.length === 0) {
      return res.status(200).json({
        success: true,
        isActive: false,
        subscriptions: [], // Return an empty array
        stackedCount: 0,
      });
    }

    // Sort to find the latest expiry date
    activeSubscriptions.sort(
      (a, b) =>
        new Date(b.subscriptionExpires) - new Date(a.subscriptionExpires)
    );

    // 3. Format active subscriptions for the response
    const formattedSubscriptions = activeSubscriptions.map((sub) => ({
      plan: sub.plan, // The populated plan object with title, price, etc.
      startDate: sub.subscribedDate,
      endDate: sub.subscriptionExpires,
    }));

    // The overall expiry date is the latest one from all active plans
    const overallEndDate = activeSubscriptions[0].subscriptionExpires;

    // 4. Send the successful response with the list of active plans
    res.status(200).json({
      
      isActive: true,
      overallEndDate: overallEndDate,
      // Return the array of all active plans
      subscriptions: formattedSubscriptions,
      // The stacked count is simply the number of active plans
      stackedCount: activeSubscriptions.length,
    });
  } catch (err) {
    console.error("Error fetching user subscription status:", err);
    res.status(500).json({ success: false, message: "Failed to fetch status" });
  }
};

