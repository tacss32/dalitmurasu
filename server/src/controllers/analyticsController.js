const WebsiteVisits = require("../models/WebsiteVisits");
const { startOfDay, subDays, format } = require("date-fns");

// @desc    Track a new visit
// @route   POST /api/analytics/visit
// @access  Public
const trackVisit = async (req, res) => {
  try {
    const today = format(new Date(), "yyyy-MM-dd");

    const visitStats = await WebsiteVisits.findOneAndUpdate(
      { date: today },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, count: visitStats.count });
  } catch (error) {
    console.error("Error tracking visit:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get visitor analytics for the last 30 days
// @route   GET /api/analytics/data
// @access  Private (Admin)
const getAnalytics = async (req, res) => {
  try {
    const endDate = new Date();
    const startDate = subDays(endDate, 30);

    const analytics = await WebsiteVisits.find({
      createdAt: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    // Format data for the graph
    // Ensure all days are represented, even if count is 0?
    // For simplicity, just return what is in DB for now, user can see gaps as no data or we can fill it.
    // Let's just return the data we have.

    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = {
  trackVisit,
  getAnalytics,
};
