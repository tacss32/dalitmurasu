const mongoose = require("mongoose");

const pinnedPostSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, required: true },
  source: { type: String, enum: ["PremiumPost", "UniversalPost", "PdfUpload"], required: true },
}, { timestamps: true });

module.exports = mongoose.model("PinnedPost", pinnedPostSchema);
