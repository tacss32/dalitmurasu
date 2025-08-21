const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String }, 
  imageUrl: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Gallery", gallerySchema);
