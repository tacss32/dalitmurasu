const NewsletterImage = require("../models/newsLetterImage");

exports.uploadNewsletterImage = async (req, res) => {
  try {
    const imageUrl = req.file?.path;
    if (!imageUrl) return res.status(400).json({ error: "Image required" });

    // Delete old one if exists
    const existing = await NewsletterImage.findOne();
    if (existing) await NewsletterImage.findByIdAndDelete(existing._id);

    const doc = new NewsletterImage({ imageUrl });
    await doc.save();

    res.status(201).json({ message: "Newsletter image updated", imageUrl });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to upload image" });
  }
};

exports.getNewsletterImage = async (req, res) => {
  try {
    const imageDoc = await NewsletterImage.findOne().sort({ createdAt: -1 });
    res.json({ imageUrl: imageDoc?.imageUrl || null });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch newsletter image" });
  }
};
