const PostHeader = require("../models/PostHeader");
const cloudinary = require("cloudinary").v2;
const fs = require("fs/promises");

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload image/pdf to Cloudinary and remove local
const uploadToCloudinary = async (
  localPath,
  folder,
  resourceType = "image"
) => {
  const result = await cloudinary.uploader.upload(localPath, {
    folder,
    resource_type: resourceType,
  });
  await fs.unlink(localPath);
  return result.secure_url;
};

exports.getSelectedHeader = async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) {
      return res.status(400).json({ error: "Category is required" });
    }

    // Normalize the input
    const normalize = (str) => str.toLowerCase().replace(/[\s\-\/]+/g, "");

    // Fetch all banners and find matching normalized category
    const allHeaders = await PostHeader.find().sort({ createdAt: -1 });

    const matchedBanner = allHeaders.find(
      (header) => normalize(header.category) === normalize(category)
    );

    if (!matchedBanner) {
      return res
        .status(404)
        .json({ error: `No banner found for category: ${category}` });
    }

    res.status(200).json(matchedBanner);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch banner",
      details: err.message,
    });
  }
};

exports.addToPostHeader = async (req, res) => {
  try {
    const desktopFile = req.files?.["desktop-image"]?.[0];
    const mobileFile = req.files?.["mobile-image"]?.[0];
    const category = req.body.category;

    if (!desktopFile && !mobileFile) {
      return res.status(400).json({ error: "At least one banner image (desktop or mobile) is required" });
    }

    if (!category) {
      return res.status(400).json({ error: "Category is required" });
    }

    let desktopImage = "";
    if (desktopFile) {
      desktopImage = await uploadToCloudinary(desktopFile.path, "banners");
    }

    let mobileImage = "";
    if (mobileFile) {
      mobileImage = await uploadToCloudinary(mobileFile.path, "banners");
    }

    const newHeader = new PostHeader({
      desktopImage,
      mobileImage,
      category,
    });

    await newHeader.save();

    res.status(201).json({ message: "Banner added successfully", newHeader });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to add banner", details: err.message });
  }
};
