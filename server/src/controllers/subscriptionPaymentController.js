const SubscriptionPayment = require("../models/SubscriptionPayment");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const razorpay = require("../config/razorpay_util");
const crypto = require("crypto");

const { sendSubscriptionEmail } = require("../middleware/sndMail");

//  * --- STEP 1: Create a new Subscription Order ---

exports.createSubscriptionOrder = async (req, res) => {
  try {
    const { planId } = req.body;
    const user = req.user;

    // 1️⃣ Validate user and plan
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription plan not found." });
    }

    // 2️⃣ Find latest active subscription for stacking logic
    const latestActiveSubscription = await SubscriptionPayment.findOne({
      userId: user._id,
      payment_status: "success",
      endDate: { $gt: new Date() },
    }).sort({ endDate: -1 });

    const activeSubscriptionsCount = latestActiveSubscription
      ? await SubscriptionPayment.countDocuments({
          userId: user._id,
          payment_status: "success",
          endDate: { $gt: new Date() },
        })
      : 0;

    // 3️⃣ Limit active subscriptions to 2
    if (activeSubscriptionsCount >= 2) {
      return res.status(400).json({
        success: false,
        limitReached: true,
        message:
          "You already have 2 active subscriptions. You cannot purchase another one at this time.",
      });
    }

    // 4️⃣ Calculate start date
    const startDate = latestActiveSubscription
      ? latestActiveSubscription.endDate
      : new Date();

    // 5️⃣ Create Razorpay order
    const options = {
      amount: plan.price * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // 6️⃣ Create pending payment record
    await SubscriptionPayment.create({
      userId: user._id,
      subscriptionPlanId: planId,
      phone: user.phone || undefined,
      mail: user.email,
      amount: plan.price,
      razorpay_order_id: order.id,
      payment_status: "pending",
      startDate: startDate,
    });

    // 7️⃣ Send response to client
    res.status(200).json({
      success: true,
      message: "Order created successfully",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      name: "Dalitmurasu",
      prefill: {
        name: user.name,
        email: user.email,
        contact: user.phone,
      },
    });
  } catch (error) {
    console.error(
      "❌ Error creating subscription order:",
      error.message,
      error.stack
    );
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message, // Optional for debugging — remove in production
    });
  }
};

/**
 * --- STEP 2: Verify Payment and Activate Subscription ---
 
 */
exports.verifySubscriptionPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    const user = req.user;

    // NOTE: You need to ensure the 'crypto' module is imported for signature verification:
    // const crypto = require("crypto");

    // 1. Find the pending payment
    // The payment record ALREADY contains the calculated stacking startDate from createSubscriptionOrder
    const payment = await SubscriptionPayment.findOne({
      razorpay_order_id: razorpay_order_id,
    });

    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment record not found." });
    }

    // 2. Verify Razorpay signature (CRITICAL)
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (isSignatureValid) {
      // 3. Find the plan to get duration
      const plan = await SubscriptionPlan.findById(payment.subscriptionPlanId);
      if (!plan) {
        return res
          .status(404)
          .json({ success: false, message: "Subscription plan not found." });
      }

      // --- CORE CHANGE FOR STACKING LOGIC ---

      // 4. Retrieve the pre-calculated start date from the PENDING payment record.
      // This date was set in createSubscriptionOrder to enable stacking.
      const startDate = payment.startDate;

      // Calculate the end date based on the stored startDate and plan duration
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + plan.durationInDays);

      // 5. Update the payment record to 'success'
      payment.payment_status = "success";
      payment.razorpay_payment_id = razorpay_payment_id;
      payment.razorpay_signature = razorpay_signature;
      // We keep payment.startDate as the already calculated stacking start date
      payment.endDate = endDate;

      await payment.save();

      // Optional: Send activation email
      await sendSubscriptionEmail(
        payment.mail,
        user.name,
        plan.title,
        plan.price,
        endDate
      );

      res.status(200).json({
        success: true,
        message: "Payment verified successfully. Subscription activated.",
        paymentId: payment._id,
      });
    } else {
      // 6. Handle failed payment
      payment.payment_status = "failed";
      // Clear payment IDs/signature to avoid retries with bad data
      payment.razorpay_payment_id = razorpay_payment_id;
      payment.razorpay_signature = razorpay_signature;
      await payment.save();

      res
        .status(400)
        .json({ success: false, message: "Payment verification failed." });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


exports.checkActiveSubscription = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming user is from auth middleware

    // 1. Find ALL active subscriptions
    const activeSubscriptions = await SubscriptionPayment.find({
      userId: userId,
      payment_status: "success",
      endDate: { $gt: new Date() }, // Check if expiry date is in the future
    })
      .sort({ endDate: -1 }) // Sort to get the one that expires latest
      .populate("subscriptionPlanId", "title");

    if (activeSubscriptions.length > 0) {
      // Find the LATEST expiry date among all active plans
      const latestSubscription = activeSubscriptions[0];

      // User has one or more active plans
      res.status(200).json({
        success: true,
        isActive: true,
        count: activeSubscriptions.length, // Include count for client-side limit check
        message: "User has an active subscription.",
        subscription: {
          planName: latestSubscription.subscriptionPlanId
            ? latestSubscription.subscriptionPlanId.title
            : "Unknown Plan",
          expiresAt: latestSubscription.endDate, // The latest expiry date
        },
      });
    } else {
      // User has no active plan
      res.status(200).json({
        success: true,
        isActive: false,
        count: 0,
        message: "User does not have an active subscription.",
      });
    }
  } catch (error) {
    console.error("Error checking active subscription:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};