const mongoose = require("mongoose");

const websiteVisitsSchema = new mongoose.Schema(
  {
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true,
      unique: true,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WebsiteVisits", websiteVisitsSchema);
