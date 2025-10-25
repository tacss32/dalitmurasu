const Donation = require("../models/Donation");
const razorpay = require("../config/razorpay_util");
const crypto = require("crypto");

const { sendDonationEmail } = require("../middleware/sndMail");

/* ------------------ Create Donation Order ------------------ */
exports.openDonation = async (req, res) => {
  try {
    const { name, phone, mail, pincode, amount } = req.body;
    if (!name || !phone || !mail || !pincode || !amount) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Create Razorpay order
    const options = {
      amount: amount * 100, // convert to paisa
      currency: "INR",
      receipt: `donation_${Date.now()}`,
      payment_capture: 1,
    };
    const order = await razorpay.orders.create(options);

    // Save donation entry (pending)
    const donation = await Donation.create({
      name,
      phone,
      mail,
      pincode,
      amount,
      razorpay_order_id: order.id,
      payment_status: "pending",
    });

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      donationId: donation._id,
    });
  } catch (err) {
    console.error("Error creating donation order:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
    });
  }
};

/* ------------------ Verify Donation Payment ------------------ */
exports.verifyDonation = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // Find the pending donation
    const donation = await Donation.findOne({ razorpay_order_id });
    if (!donation) {
      return res
        .status(404)
        .json({ success: false, message: "Donation not found" });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      donation.payment_status = "failed";
      await donation.save();
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment signature" });
    }

    // Update donation record as successful
    donation.razorpay_payment_id = razorpay_payment_id;
    donation.razorpay_signature = razorpay_signature;
    donation.payment_status = "success";
    await donation.save();

    // Send thank-you email
    sendDonationEmail(donation.mail, donation.name, donation.amount);

    res.status(200).json({
      success: true,
      message: "Donation verified successfully",
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({
      success: false,
      message: "Error verifying donation payment",
    });
  }
};

exports.reconcileDonations = async (req, res) => {
  try {
    // Get all pending donations
    const pendingDonations = await Donation.find({ payment_status: "pending" });

    if (!pendingDonations.length) {
      return res
        .status(200)
        .json({ success: true, message: "No pending donations found" });
    }

    let updatedCount = 0;
    let failedCount = 0;

    for (const donation of pendingDonations) {
      try {
        // Fetch payments linked to the order
        const payments = await razorpay.orders.fetchPayments(
          donation.razorpay_order_id
        );

        if (payments.items && payments.items.length > 0) {
          const payment = payments.items[0];

          // If payment is captured (successful)
          if (payment.status === "captured") {
            donation.payment_status = "success";
            donation.razorpay_payment_id = payment.id;
            await donation.save();

            // Send thank-you email (optional)
            await sendDonationEmail(
              donation.mail,
              donation.name,
              donation.amount
            );

            updatedCount++;
          } else {
            failedCount++;
          }
        }
      } catch (err) {
        console.error(`Error checking donation ${donation._id}:`, err.message);
        failedCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Reconciliation completed. Updated: ${updatedCount}, Still pending/failed: ${failedCount}`,
    });
  } catch (err) {
    console.error("Error reconciling donations:", err);
    res.status(500).json({
      success: false,
      message: "Error reconciling donations",
    });
  }
};

exports.getAllDonations = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const query = {};

    if (status) query.payment_status = status;
    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { mail: new RegExp(search, "i") },
        { phone: new RegExp(search, "i") },
      ];
    }

    const donations = await Donation.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalCount = await Donation.countDocuments(query);

    res.status(200).json({
      success: true,
      totalCount,
      currentPage: Number(page),
      totalPages: Math.ceil(totalCount / limit),
      donations,
    });
  } catch (err) {
    console.error("Error fetching donations:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch donations",
    });
  }
};

exports.getTotalDonations = async (req, res) => {
  try {
    const { from, to } = req.query;

    const filter = { payment_status: "success" };

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const result = await Donation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalAmount = result[0]?.totalAmount || 0;
    const count = result[0]?.count || 0;

    res.status(200).json({
      success: true,
      totalAmount,
      totalDonations: count,
    });
  } catch (err) {
    console.error("Error calculating total donations:", err);
    res.status(500).json({
      success: false,
      message: "Failed to calculate total donations",
    });
  }
};

exports.getDonationStats = async (req, res) => {
  try {
    const { period = "month" } = req.query; // "day" or "month"

    const groupId =
      period === "day"
        ? {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          }
        : { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } };

    const stats = await Donation.aggregate([
      { $match: { payment_status: "success" } },
      {
        $group: {
          _id: groupId,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    res.status(200).json({
      success: true,
      period,
      stats,
    });
  } catch (err) {
    console.error("Error fetching donation stats:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch donation stats",
    });
  }
};
