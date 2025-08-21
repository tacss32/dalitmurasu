const Banner = require("../models/Banner");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const tryDeleteLocalFile = (path) => {
  try {
    fs.unlinkSync(path);
  } catch (e) {
    console.warn("Temp file already deleted or not found:", path);
  }
};

exports.createBanner = async (req, res) => {
  try {
    let mobileImage = "";
    let desktopImage = "";

    if (req.files?.mobileImage?.[0]) {
      const result = await cloudinary.uploader.upload(
        req.files.mobileImage[0].path,
        { folder: "banners" }
      );
      mobileImage = result.secure_url;
      tryDeleteLocalFile(req.files.mobileImage[0].path);
    }

    if (req.files?.desktopImage?.[0]) {
      const result = await cloudinary.uploader.upload(
        req.files.desktopImage[0].path,
        { folder: "banners" }
      );
      desktopImage = result.secure_url;
      tryDeleteLocalFile(req.files.desktopImage[0].path);
    }

    const newBanner = new Banner({
      mobileImage,
      desktopImage,
    });
    await newBanner.save();

    res.status(201).json(newBanner);
  } catch (err) {
    console.error("❌ Banner creation error:", err);
    res.status(500).json({ error: "Failed to create banner" });
  }
};

// GET All Banners
exports.getBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.json(banners);
  } catch (err) {
    console.error("❌ Fetch banners error:", err);
    res.status(500).json({ error: "Failed to fetch banners" });
  }
};

// DELETE Banner
exports.deleteBanner = async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ message: "✅ Banner deleted" });
  } catch (err) {
    console.error("❌ Delete banner error:", err);
    res.status(500).json({ error: "Failed to delete banner" });
  }
};

// UPDATE Banner
exports.updateBanner = async (req, res) => {
  try {
    const { author, url, duration } = req.body;
    const updateData = { author, url, duration };

    if (req.files?.mobileImage?.[0]) {
      const result = await cloudinary.uploader.upload(
        req.files.mobileImage[0].path,
        { folder: "banners" }
      );
      updateData.mobileImage = result.secure_url;
      tryDeleteLocalFile(req.files.mobileImage[0].path);
    }

    if (req.files?.desktopImage?.[0]) {
      const result = await cloudinary.uploader.upload(
        req.files.desktopImage[0].path,
        { folder: "banners" }
      );
      updateData.desktopImage = result.secure_url;
      tryDeleteLocalFile(req.files.desktopImage[0].path);
    }

    const updated = await Banner.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    console.error("❌ Update banner error:", err);
    res.status(500).json({ error: "Failed to update banner" });
  }
};
