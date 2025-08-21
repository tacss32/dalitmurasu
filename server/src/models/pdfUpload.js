const mongoose = require("mongoose");

const pdfUploadSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: "", trim: true },
    date: { type: Date, default: Date.now },
    category: { en: String, ta: String },
    pdfUrl: String,
    imageUrl: String,

    // New field to match PremiumPost
    visibility: {
      type: String,
      enum: ["public", "subscribers"],
      default: "subscribers",
    },

    views: { type: Number, default: 0 },
    freeViewLimit: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.PdfUpload || mongoose.model("PdfUpload", pdfUploadSchema);
