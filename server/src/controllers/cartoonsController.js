const Cartoon = require("../models/Cartoons"); // Changed from Gallery
const cloudinary = require("cloudinary").v2;

const deleteFromCloudinary = async (imageUrl) => {
  if (imageUrl && imageUrl.includes("res.cloudinary.com")) {
    const parts = imageUrl.split("/");
    const publicIdWithExtension = parts[parts.length - 1];
    const publicId = publicIdWithExtension.split(".")[0];
    // Changed Cloudinary folder from 'dalit-murasu-gallery' to 'dalit-murasu-cartoons'
    const fullPublicId = `dalit-murasu-cartoons/${publicId}`;

    try {
      const result = await cloudinary.uploader.destroy(fullPublicId);
      console.log(
        `Cloudinary image ${fullPublicId} deleted successfully:`,
        result
      );
    } catch (error) {
      console.error(
        `Failed to delete Cloudinary image ${fullPublicId}:`,
        error
      );
    }
  }
};

// 1. Upload Cartoon
const uploadCartoon = async (req, res) => {
  try {
    const { title, content } = req.body;
    const imageUrl = req.file ? req.file.path : null;

    if (!imageUrl) {
      return res
        .status(400)
        .json({ error: "Image file is required for upload." });
    }

    const newCartoon = new Cartoon({ title, content, imageUrl }); // Use Cartoon model
    await newCartoon.save();

    res
      .status(201)
      .json({ message: "Cartoon uploaded successfully", cartoon: newCartoon });
  } catch (err) {
    console.error("Error in uploadCartoon:", err);
    res.status(500).json({ error: err.message || "Failed to upload cartoon." });
  }
};

// 2. Get Cartoons
const getCartoons = async (req, res) => {
  try {
    const cartoons = await Cartoon.find().sort({ createdAt: -1 }); // Use Cartoon model
    res.status(200).json(cartoons);
  } catch (err) {
    console.error("Error in getCartoons:", err);
    res.status(500).json({ error: err.message || "Failed to fetch cartoons." });
  }
};

const getCartoonDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const cartoon = await Cartoon.findById(id); // Use Cartoon model
    res.status(200).json(cartoon);
  } catch (err) {
    console.error("Error in getCartoonDetail:", err);
    res.status(500).json({ error: err.message || "Failed to fetch cartoon." });
  }
};

// 3. Update Cartoon
const updateCartoon = async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const newFileUploaded = req.file ? req.file.path : null;

  try {
    const existingCartoon = await Cartoon.findById(id); // Use Cartoon model
    if (!existingCartoon) {
      return res.status(404).json({ error: "Cartoon not found." });
    }

    // If new image uploaded, delete old image
    if (newFileUploaded && existingCartoon.imageUrl) {
      await deleteFromCloudinary(existingCartoon.imageUrl);
    }

    if (title) existingCartoon.title = title;
    if (content) existingCartoon.content = content;
    if (newFileUploaded) existingCartoon.imageUrl = newFileUploaded;

    await existingCartoon.save();

    res
      .status(200)
      .json({
        message: "Cartoon updated successfully",
        cartoon: existingCartoon,
      });
  } catch (err) {
    console.error("Error in updateCartoon:", err);
    res.status(500).json({ error: err.message || "Failed to update cartoon." });
  }
};

// 4. Delete Cartoon
const deleteCartoon = async (req, res) => {
  const { id } = req.params;

  try {
    const cartoon = await Cartoon.findById(id); // Use Cartoon model
    if (!cartoon) {
      return res.status(404).json({ error: "Cartoon not found." });
    }

    if (cartoon.imageUrl) {
      await deleteFromCloudinary(cartoon.imageUrl);
    }

    await Cartoon.findByIdAndDelete(id); // Use Cartoon model

    res.status(200).json({ message: "Cartoon deleted successfully." });
  } catch (err) {
    console.error("Error in deleteCartoon:", err);
    res.status(500).json({ error: err.message || "Failed to delete cartoon." });
  }
};

module.exports = {
  uploadCartoon,
  getCartoons,
  getCartoonDetail,
  updateCartoon,
  deleteCartoon,
};
