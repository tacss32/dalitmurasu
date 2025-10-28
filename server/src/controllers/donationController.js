
const Donation = require("../models/Donation");


// const { sendDonationEmail } = require("../middleware/sndMail"); // REMOVED: Email sending is often tied to payment confirmation


exports.recordDonation = async (req, res) => {
  try {
    const { name, phone, mail, pincode, amount } = req.body;
    if (!name || !phone || !mail || !pincode || !amount) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Save donation entry with status as 'success' (assuming payment details
    // like bank account details were provided on the frontend for manual transfer)
    // You can change 'success' to 'pending' if you want admin to verify manually.
    const donation = await Donation.create({
      name,
      phone,
      mail,
      pincode,
      amount,
      // Removed Razorpay fields
      payment_status: "success", // Simplified to mark as successful record
    });

    // NOTE: Removed 'sendDonationEmail' as payment confirmation is no longer automatic.
    // If this is for manual payment, you might send an email with bank details.

    res.status(200).json({
      success: true,
      message: "Donation details recorded successfully. Thank you!",
      donationId: donation._id,
      amount: donation.amount,
    });
  } catch (err) {
    console.error("Error recording donation:", err);
    res.status(500).json({
      success: false,
      message: "Failed to record donation details",
    });
  }
};

/* ------------------ Admin Routes (Unchanged, but ensure 'Donation' model doesn't require Razorpay fields) ------------------ */

// Removed exports.reconcileDonations - It was specific to Razorpay.

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