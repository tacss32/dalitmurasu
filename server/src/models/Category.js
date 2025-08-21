const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    name: {
      en: String,
      ta: String,
    },
    order: {
      type: Number,
    },
    isEditable: Boolean,
    isInBanner: Boolean,
    isAvailable: Boolean,
    setHeader: Boolean,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", CategorySchema);
