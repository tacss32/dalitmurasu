const mongoose = require("mongoose");

const PostHeaderSchema = new mongoose.Schema(
  {
    desktopImage: String,
    mobileImage: String,
    category: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PostHeader", PostHeaderSchema);
