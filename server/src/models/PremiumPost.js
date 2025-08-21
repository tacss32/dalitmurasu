const mongoose = require("mongoose");

const PremiumPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: String,
    content: { type: String, required: true },
    author: { type: String, default: "Admin" },
    category: { type: String, required: true },
    images: [String],
    isHome: Boolean,
    isRecent: Boolean,
    visibility: { type: String, enum: ["public", "subscribers"], default: "subscribers" },
    views: { type: Number, default: 0 },
    freeViewLimit: { type: Number, default: 0 },
    date: { type: Date }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("PremiumPost", PremiumPostSchema);
