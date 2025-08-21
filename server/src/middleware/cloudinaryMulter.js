const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinary } = require("../config/cloudinary");

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
// 2. Universal Post Images (headerImage, middleImage)
// --------------------
const postStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "universal_posts/images",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 800, height: 600, crop: "limit" }],
  },
});
const uploadPostImages = multer({ storage: postStorage });

// --------------------
// 3. Gallery Images
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
// 4. PDF File Upload (Cloudinary)
// --------------------
const pdfStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: "pdf_uploads",
      resource_type: "raw",
      type: "upload",       // Make sure it's public
      access_mode: "public", // <---- Force public delivery
      format: "pdf",
      public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`,
    };
  },
});



const uploadPdf = multer({ 
  storage: pdfStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed!"), false);
  },
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

// --------------------
// 🔁 Export Upload Middlewares
// --------------------
module.exports = {
  uploadMultiple,     // For banners
  uploadPostImages,   // For universal post images
  galleryUpload,      // For gallery
  uploadPdf,          // For direct PDF uploads to Cloudinary
};
