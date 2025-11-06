const SubscriptionPlan = require("../models/SubscriptionPlan");
const SubscriptionPayment = require("../models/SubscriptionPayment");

const ClientUser = require("../models/ClientUser");
const { sendSubscriptionEmail } = require("../middleware/sndMail"); 
exports.getAllUsers = async (req, res) => {
  try {
    const { search = ""} = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: `^${search}`, $options: "i" } },
        { email: { $regex: `^${search}`, $options: "i" } },
      ];
    }

    const totalUsers = await ClientUser.countDocuments(query);

    // Fetch users
    const users = await ClientUser.find(query)
      .select("name email phone _id")
       
      .sort({ name: 1 });

    // Fetch each user's active subscription
    const userDetails = await Promise.all(
      users.map(async (user) => {
        const activeSub = await SubscriptionPayment.findOne({
          userId: user._id,
          payment_status: "success",
          endDate: { $gt: new Date() }, // Active subscription
        })
          .populate("subscriptionPlanId", "title durationInDays price")
          .lean();

        return {
          ...user.toObject(),
          subscription: activeSub
            ? {
                isActive: true,
                planTitle: activeSub.subscriptionPlanId.title,
                endDate: activeSub.endDate,
              }
            : { isActive: false },
        };
      })
    );

    res.status(200).json({
      success: true,
      total: totalUsers,
     
      users: userDetails,
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
      amount,
    } = req.body;

    if (!userId || !planId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Plan ID are required for manual activation.",
      });
    } // Find the latest active subscription to determine the new plan's start date

    const latestActiveSubscription = await SubscriptionPayment.findOne({
      userId: userId,
      payment_status: "success",
      endDate: { $gt: new Date() }, // Check if expiry date is in the future
    }).sort({ endDate: -1 }); // 2. Enforce the limit of 2 active subscriptions

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
    } // Calculate dates for stacking:

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
    } // Ensure the calculated startDate is not in the past // The current time ensures that if the latestActiveSubscription.endDate is in the past (due to query gap), it starts now

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

    // Determine the amount paid for the email
    const paidAmount =
      amount !== undefined && !isNaN(Number(amount))
        ? Number(amount)
        : plan.price;

    const newPayment = await SubscriptionPayment.create({
      userId: user._id,
      subscriptionPlanId: plan._id,
      phone: user.phone || "N/A",
      mail: user.email,
      amount: paidAmount,
      payment_status: "success",
      startDate: startDate,
      endDate: endDate,
    }); // Send activation email

    await sendSubscriptionEmail(
      user.email,
      user.name,
      plan.title,
      paidAmount, // Use the actual paid amount
      endDate
    );

    res.status(201).json({
      success: true,
      message: `Subscription for user ${
        user.name
      } activated manually. Expires on: ${endDate.toLocaleDateString("en-GB")}`,
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

exports.cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params; // Get the payment ID from the URL parameter

    // 1. Find the payment record and update its status
    const canceledPayment = await SubscriptionPayment.findByIdAndUpdate(
      id,
      { payment_status: "canceled" }, // Set the new status
      { new: true, runValidators: true } // Return the updated document
    );

    if (!canceledPayment) {
      return res.status(404).json({
        success: false,
        message: "Subscription payment record not found.",
      });
    }

    // 2. Optionally, you might want to update the user's overall subscription status here
    // (e.g., if you track a 'latestPlanStatus' on the ClientUser model).

    res.status(200).json({
      success: true,
      message: `Subscription record ID ${id} status updated to CANCELED. Record preserved.`,
      data: canceledPayment,
    });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * --- ADMIN: Get All Subscriptions ---
 */
/**
 * --- ADMIN: Get Filtered Subscriptions (Updated with Search & Status) ---
 * Allows filtering by payment status, amount range, date range, 
 * and searching by the related ClientUser's name or email.
 */
exports.getFilteredSubscriptionPayments = async (req, res) => {
    try {
        const { payment_status, min_amount, max_amount, start_date, end_date, search } = req.query;
        
        // Initial match object for direct SubscriptionPayment fields (like amount, createdAt)
        const matchFilter = {};
        const clientUserCollectionName = "clientusers"; // ⚠️ IMPORTANT: Verify your actual ClientUser collection name in MongoDB

        // 1. Filter by Payment Status (Direct field)
        if (payment_status) {
            matchFilter.payment_status = payment_status;
        }

        // 2. Filter by Amount Range (Direct field)
        if (min_amount || max_amount) {
            matchFilter.amount = {};
            if (min_amount) matchFilter.amount.$gte = Number(min_amount);
            if (max_amount) matchFilter.amount.$lte = Number(max_amount);
        }

        // 3. Filter by Date Range (based on createdAt) (Direct field)
        if (start_date || end_date) {
            matchFilter.createdAt = {};
            if (start_date) matchFilter.createdAt.$gte = new Date(start_date);
            if (end_date) {
                // Add 1 day to endDate so it includes the entire day
                const nextDay = new Date(end_date);
                nextDay.setDate(nextDay.getDate() + 1);
                matchFilter.createdAt.$lte = nextDay;
            }
        }
        
        // 4. Build the Aggregation Pipeline
        const pipeline = [
            // STEP 1: Add user details using $lookup (join)
            {
                $lookup: {
                    from: clientUserCollectionName, 
                    localField: "userId",
                    foreignField: "_id",
                    as: "userId", // Overwrites the ObjectId field with the populated user array
                }
            },
            // Since userId is an array now, unwind it to filter/project easily
            {
                $unwind: {
                    path: "$userId",
                    preserveNullAndEmptyArrays: true // Keep payments even if user data is missing
                }
            },
            // STEP 2: Add plan details (similar to populate, but necessary for aggregation)
            {
                $lookup: {
                    from: "subscriptionplans", // ⚠️ IMPORTANT: Verify your SubscriptionPlan collection name
                    localField: "subscriptionPlanId",
                    foreignField: "_id",
                    as: "subscriptionPlanId",
                }
            },
            {
                $unwind: {
                    path: "$subscriptionPlanId",
                    preserveNullAndEmptyArrays: true
                }
            },
            // STEP 3: Apply direct filters (status, date, amount)
            {
                $match: matchFilter 
            }
        ];
        
        // 5. Add Search filter (if provided)
        if (search) {
            // Add a new $match stage for searching on user fields
            pipeline.push({
                $match: {
                    $or: [
                        { "userId.name": { $regex: search, $options: "i" } },
                        { "userId.email": { $regex: search, $options: "i" } },
                    ]
                }
            });
        }
        
        // 6. Sort by creation date
        pipeline.push({ $sort: { createdAt: -1 } });
        
        // 7. Execute the pipeline
        const subscriptionPayments = await SubscriptionPayment.aggregate(pipeline);

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
