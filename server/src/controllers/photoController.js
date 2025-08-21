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

exports.uploadPhoto = async (req, res) => {
  try {
    const file = req.files?.["image"]?.[0];

    if (!file) {
      return res.status(400).json({ error: "Banner image is required" });
    }

    const cloudinaryUrl = await uploadToCloudinary(file.path, "banners");

    res
      .status(201)
      .json({ message: "photo uploaded successfully", url: cloudinaryUrl });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to add banner", details: err.message });
  }
};
