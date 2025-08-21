const mongoose = require("mongoose");

const userViewHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "ClientUser", required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "PremiumPost", required: true },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userViewHistorySchema.index({ userId: 1, postId: 1 }, { unique: true });

module.exports = mongoose.model("UserViewHistory", userViewHistorySchema);
