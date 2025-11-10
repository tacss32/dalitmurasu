const mongoose = require("mongoose");

const cartoonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String }, // Optional, based on your Gallery model
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cartoon", cartoonSchema);
