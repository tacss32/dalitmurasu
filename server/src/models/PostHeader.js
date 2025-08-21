const mongoose = require("mongoose");

const PostHeaderSchema = new mongoose.Schema(
  {
    banner: { type: String, required: true },
    category: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PostHeader", PostHeaderSchema);
