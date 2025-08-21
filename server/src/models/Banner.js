const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    mobileImage: String,
    desktopImage: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Banner", bannerSchema);
