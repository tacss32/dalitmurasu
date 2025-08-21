const mongoose = require("mongoose");

const newsletterImageSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.NewsletterImage ||
  mongoose.model("NewsletterImage", newsletterImageSchema);
