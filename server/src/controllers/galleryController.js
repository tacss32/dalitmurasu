const Gallery = require("../models/Gallery");
const cloudinary = require("cloudinary").v2;

const deleteFromCloudinary = async (imageUrl) => {
  if (imageUrl && imageUrl.includes("res.cloudinary.com")) {
    const parts = imageUrl.split("/");
    const publicIdWithExtension = parts[parts.length - 1];
    const publicId = publicIdWithExtension.split(".")[0];
    const fullPublicId = `dalit-murasu-gallery/${publicId}`;

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

// 1. Upload Photo
const uploadPhoto = async (req, res) => {
  try {
    const { title, content } = req.body;
    const imageUrl = req.file ? req.file.path : null;

    if (!imageUrl) {
      return res
        .status(400)
        .json({ error: "Image file is required for upload." });
    }

    const newPhoto = new Gallery({ title, content, imageUrl });
    await newPhoto.save();

    res
      .status(201)
      .json({ message: "Image uploaded successfully", photo: newPhoto });
  } catch (err) {
    console.error("Error in uploadPhoto:", err);
    res.status(500).json({ error: err.message || "Failed to upload image." });
  }
};

// 2. Get Gallery
const getGallery = async (req, res) => {
  try {
    const photos = await Gallery.find().sort({ createdAt: -1 });
    res.status(200).json(photos);
  } catch (err) {
    console.error("Error in getGallery:", err);
    res.status(500).json({ error: err.message || "Failed to fetch gallery." });
  }
};
const getGalleryDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const photos = await Gallery.findById(id);
    res.status(200).json(photos);
  } catch (err) {
    console.error("Error in getGallery:", err);
    res.status(500).json({ error: err.message || "Failed to fetch gallery." });
  }
};

// 3. Update Photo
const updatePhoto = async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const newFileUploaded = req.file ? req.file.path : null;

  try {
    const existingPhoto = await Gallery.findById(id);
    if (!existingPhoto) {
      return res.status(404).json({ error: "Image not found." });
    }

    // If new image uploaded, delete old image
    if (newFileUploaded && existingPhoto.imageUrl) {
      await deleteFromCloudinary(existingPhoto.imageUrl);
    }

    if (title) existingPhoto.title = title;
    if (content) existingPhoto.content = content;
    if (newFileUploaded) existingPhoto.imageUrl = newFileUploaded;

    await existingPhoto.save();

    res
      .status(200)
      .json({ message: "Image updated successfully", photo: existingPhoto });
  } catch (err) {
    console.error("Error in updatePhoto:", err);
    res.status(500).json({ error: err.message || "Failed to update image." });
  }
};

// 4. Delete Photo
const deletePhoto = async (req, res) => {
  const { id } = req.params;

  try {
    const photo = await Gallery.findById(id);
    if (!photo) {
      return res.status(404).json({ error: "Image not found." });
    }

    if (photo.imageUrl) {
      await deleteFromCloudinary(photo.imageUrl);
    }

    await Gallery.findByIdAndDelete(id);

    res.status(200).json({ message: "Image deleted successfully." });
  } catch (err) {
    console.error("Error in deletePhoto:", err);
    res.status(500).json({ error: err.message || "Failed to delete image." });
  }
};

module.exports = {
  uploadPhoto,
  getGallery,
  getGalleryDetail,
  updatePhoto,
  deletePhoto,
};
