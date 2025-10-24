const mongoose = require("mongoose");

const PostTitleSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "source",
    },
    title: { type: String, required: true },
    source: {
      type: String,
      required: true,
      enum: ["recent", "universal", "premium"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PostTitle", PostTitleSchema);