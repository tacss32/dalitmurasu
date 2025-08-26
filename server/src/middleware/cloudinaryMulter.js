const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinary } = require("../config/cloudinary_util");

// --------------------
// 1. Banner Upload (mobileImage + desktopImage)
// --------------------
const bannerMultiStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const folder = "banners";
    const filename = file.fieldname === "mobileImage" ? "mobile" : "desktop";
    return {
      folder,
      public_id: `${filename}-${Date.now()}`,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
    };
  },
});
const uploadMultiple = multer({ storage: bannerMultiStorage });

// --------------------
// 2. Gallery Images
// --------------------
const galleryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "gallery",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, height: 800, crop: "limit" }],
  },
});
const galleryUpload = multer({ storage: galleryStorage });

// --------------------
// 🔁 Export Upload Middlewares
// --------------------
module.exports = {
  uploadMultiple, // For banners
  galleryUpload, // For gallery
};
