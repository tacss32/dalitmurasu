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

const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const analytics = await WebsiteVisits.find(query).sort({ date: 1 });

    const totalVisits = analytics.reduce((sum, record) => sum + record.count, 0);

    res.status(200).json({ success: true, totalVisits, data: analytics });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = {
  trackVisit,
  getAnalytics,
};
