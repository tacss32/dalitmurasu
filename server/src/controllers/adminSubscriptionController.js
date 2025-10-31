const SubscriptionPlan = require("../models/SubscriptionPlan");
const SubscriptionPayment = require("../models/SubscriptionPayment");

const ClientUser = require("../models/ClientUser");

exports.getAllUsers = async (req, res) => {
  try {
    const { search = "", limit = 10, page = 1 } = req.query;

    const query = {};

    // Search by name or email (prefix match)
    if (search) {
      query.$or = [
        { name: { $regex: `^${search}`, $options: "i" } },
        { email: { $regex: `^${search}`, $options: "i" } },
      ];
    }

    const totalUsers = await ClientUser.countDocuments(query);
    const users = await ClientUser.find(query)
      .select("name email phone _id")
      .limit(Number(limit))
      .skip((page - 1) * limit)
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      total: totalUsers,
      page: Number(page),
      limit: Number(limit),
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
exports.manualActivateSubscription = async (req, res) => {
  try {
    const {
      userId,
      planId,
      startDate: customStartDate,
      endDate: customEndDate,
    } = req.body;

    if (!userId || !planId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Plan ID are required for manual activation.",
      });
    }

    // Find the latest active subscription to determine the new plan's start date
    const latestActiveSubscription = await SubscriptionPayment.findOne({
      userId: userId,
      payment_status: "success",
      endDate: { $gt: new Date() }, // Check if expiry date is in the future
    }).sort({ endDate: -1 });

    // 2. Enforce the limit of 2 active subscriptions
    const activeSubscriptionsCount = latestActiveSubscription
      ? await SubscriptionPayment.countDocuments({
          userId: userId,
          payment_status: "success",
          endDate: { $gt: new Date() },
        })
      : 0;

    if (activeSubscriptionsCount >= 2) {
      // Changed limit to 2
      return res.status(400).json({
        success: false,
        limitReached: true,
        message:
          "You already have 2 active subscriptions. You cannot purchase another one at this time.",
      });
    }

    const [user, plan] = await Promise.all([
      ClientUser.findById(userId),
      SubscriptionPlan.findById(planId),
    ]);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Client user not found." });
    }
    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription plan not found." });
    }

    // Calculate dates for stacking:
    let startDate;
    let endDate;

    if (customStartDate) {
      startDate = new Date(customStartDate);
    } else if (latestActiveSubscription) {
      // If an active plan exists, the new plan starts immediately after its expiry
      startDate = new Date(latestActiveSubscription.endDate);
    } else {
      // If no active plan, the new plan starts now
      startDate = new Date();
    }

    // Ensure the calculated startDate is not in the past
    // The current time ensures that if the latestActiveSubscription.endDate is in the past (due to query gap), it starts now
    if (
      startDate.getTime() < new Date().getTime() &&
      !latestActiveSubscription
    ) {
      startDate = new Date();
    } else if (
      latestActiveSubscription &&
      startDate.getTime() < new Date().getTime()
    ) {
      // If we are stacking, ensure we take the latest date that is either *now* or the *end date* of the current latest
      startDate = new Date(
        latestActiveSubscription.endDate > new Date()
          ? latestActiveSubscription.endDate
          : new Date()
      );
    }

    if (customEndDate) {
      endDate = new Date(customEndDate);
    } else {
      // Calculate end date based on plan duration
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + plan.durationInDays);
    }

    const newPayment = await SubscriptionPayment.create({
      userId: user._id,
      subscriptionPlanId: plan._id,
      phone: user.phone || "N/A",
      mail: user.email,
      amount: 0, // Set to 0 for manual/free activation
      payment_status: "success",
      startDate: startDate,
      endDate: endDate,
    });

    // Optional: Send activation email
    // await sendSubscriptionEmail(user.email, user.name, plan.title, 0, endDate);

    res.status(201).json({
      success: true,
      message: `Subscription for user ${
        user.name
      } activated manually. Expires on: ${endDate.toLocaleDateString()}`,
      data: newPayment,
    });
  } catch (error) {
    console.error("Error activating subscription manually:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
/**
 * --- ADMIN: Delete Subscription Payment (Requested) ---
 * Deletes an existing SubscriptionPayment record by its ID. This effectively cancels/removes the record.
 */
exports.deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params; // ✅ FIXED

    const deletedPayment = await SubscriptionPayment.findByIdAndDelete(id);

    if (!deletedPayment) {
      return res.status(404).json({
        success: false,
        message: "Subscription payment record not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: `Subscription record ID ${id} for user ${deletedPayment.userId} deleted successfully.`,
      data: deletedPayment,
    });
  } catch (error) {
    console.error("Error deleting subscription payment:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * --- ADMIN: Get All Subscriptions ---
 */
exports.getFilteredSubscriptionPayments = async (req, res) => {
  try {
    const { payment_status, min_amount, max_amount, start_date, end_date } =
      req.query;
    const filter = {};

    // Filter by Payment Status
    if (payment_status) {
      filter.payment_status = payment_status;
    }

    // Filter by Amount Range
    if (min_amount || max_amount) {
      filter.amount = {};
      if (min_amount) filter.amount.$gte = Number(min_amount);
      if (max_amount) filter.amount.$lte = Number(max_amount);
    }

    // 🗓️ Filter by Date Range (based on createdAt)
    if (start_date || end_date) {
      filter.createdAt = {};
      if (start_date) filter.createdAt.$gte = new Date(start_date);
      if (end_date) {
        // Add 1 day to endDate so it includes the entire day
        const nextDay = new Date(end_date);
        nextDay.setDate(nextDay.getDate() + 1);
        filter.createdAt.$lte = nextDay;
      }
    }

    const subscriptionPayments = await SubscriptionPayment.find(filter)
      .populate("userId", "name email")
      .populate("subscriptionPlanId", "title price")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: subscriptionPayments.length,
      data: subscriptionPayments,
    });
  } catch (error) {
    console.error("Error fetching filtered subscription payments:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * --- ADMIN: Get Total Subscription Revenue ---
 */
exports.getTotalSubscriptionRevenue = async (req, res) => {
  try {
    const result = await SubscriptionPayment.aggregate([
      {
        $match: { payment_status: "success" }, // Only count successful payments
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
        },
      },
    ]);

    const totalRevenue = result.length > 0 ? result[0].totalRevenue : 0;

    res.status(200).json({
      success: true,
      totalRevenue: totalRevenue,
    });
  } catch (error) {
    console.error("Error fetching total subscription revenue:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * --- ADMIN: Get Subscription Stats ---
 */
exports.getSubscriptionStats = async (req, res) => {
  try {
    // 1. Total revenue and count
    const totalStats = await SubscriptionPayment.aggregate([
      {
        $match: { payment_status: "success" },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          totalSubscriptions: { $sum: 1 },
        },
      },
    ]);

    // 2. Count of *currently* active subscriptions
    const activeSubscriptions = await SubscriptionPayment.countDocuments({
      payment_status: "success",
      endDate: { $gt: new Date() },
    });

    // 3. Breakdown by plan
    const planStats = await SubscriptionPayment.aggregate([
      {
        $match: { payment_status: "success" },
      },
      {
        $lookup: {
          from: "subscriptionplans", // Note: use the collection name (usually plural, lowercase)
          localField: "subscriptionPlanId",
          foreignField: "_id",
          as: "plan",
        },
      },
      {
        $unwind: "$plan",
      },
      {
        $group: {
          _id: "$plan.title",
          count: { $sum: 1 },
          revenue: { $sum: "$amount" },
        },
      },
      {
        $project: {
          _id: 0,
          planName: "$_id",
          count: 1,
          revenue: 1,
        },
      },
      {
        $sort: { revenue: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      totalRevenue: totalStats.length > 0 ? totalStats[0].totalRevenue : 0,
      totalSubscriptions:
        totalStats.length > 0 ? totalStats[0].totalSubscriptions : 0,
      activeSubscriptions: activeSubscriptions,
      subscriptionsByPlan: planStats,
    });
  } catch (error) {
    console.error("Error fetching subscription stats:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
