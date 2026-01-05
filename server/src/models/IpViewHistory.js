const mongoose = require("mongoose");

const ipViewHistorySchema = new mongoose.Schema(
  {
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "postType",
    },
    postType: {
      type: String,
      required: true,
      enum: ["PdfUpload", "PremiumPost"],
    },
    views: {
      type: Number,
      default: 0,
    },
    lastViewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index for efficient queries to find unique views per IP per post
ipViewHistorySchema.index({ ipAddress: 1, postId: 1 }, { unique: true });

module.exports = mongoose.model("IpViewHistory", ipViewHistorySchema);
