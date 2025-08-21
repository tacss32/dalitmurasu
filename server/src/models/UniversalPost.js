const mongoose = require("mongoose");

const UniversalPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: String,
    content: { type: String, required: true },
    author: { type: String, default: "Admin" },
    category: { type: String, required: true },
    images: [String],
    isHome: Boolean,
    isRecent: Boolean,
    isPinned: { type: Boolean, default: false },
    date: {
      type: Date,
     default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UniversalPost", UniversalPostSchema);
