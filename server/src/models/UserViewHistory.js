const mongoose = require("mongoose");

const userViewHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "ClientUser" }, // Not required anymore
    ipAddress: { type: String }, // New field for unregistered users
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "PremiumPost", required: true },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Ensure unique tracking per user OR ip per post
userViewHistorySchema.index({ userId: 1, postId: 1 }, { unique: true, partialFilterExpression: { userId: { $exists: true } } });
userViewHistorySchema.index({ ipAddress: 1, postId: 1 }, { unique: true, partialFilterExpression: { ipAddress: { $exists: true } } });

module.exports = mongoose.model("UserViewHistory", userViewHistorySchema);
