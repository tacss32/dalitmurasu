const multer = require("multer");
const path = require("path");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinary } = require("../config/cloudinary");
const os = require("os");


// -----------------------------------
// Cloudinary config (from .env)
// -----------------------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Local disk storage for PDFs
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/pdfs"));
  },
 filename: (req, file, cb) => {
    const uniqueName = Date.now() + "_" + file.originalname;
    cb(null, uniqueName);
  },
});
const uploadPdf = multer({ storage: pdfStorage });


// Cloudinary image storage
const makeCloudinaryStorage = (folder) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ width: 800, height: 600, crop: "limit" }],
    },
  });

  // Uploaders
const uploadPdfOnly = multer({ storage: pdfStorage });
const uploadPdfImageOnly = multer({ storage: makeCloudinaryStorage("pdf_uploads/images") });


// Universal post image uploader (Cloudinary)
const uploadPostImages = multer({ storage: makeCloudinaryStorage("universal_posts/images") });

// Gallery image uploader (larger size)
const galleryUpload = multer({ storage: makeCloudinaryStorage("gallery", 1200, 800) });

// Multiple image upload (e.g., banners)
const uploadMultiple = multer({ storage: makeCloudinaryStorage("banners") });

const combinedPdfUpload = multer({

  storage: multer.diskStorage({

    destination: (req, file, cb) => {

      if (file.fieldname === "pdf") {

        cb(null, path.join(__dirname, "../uploads/pdfs"));

      } else if (file.fieldname === "image") {

        cb(null, path.join(__dirname, "../uploads/images"));

      } else {

        cb(null, os.tmpdir()); // fallback for any unexpected field

      }

    },

    filename: (req, file, cb) => {

      const uniqueName = Date.now() + "_" + file.originalname;

      cb(null, uniqueName);

    },

  }),

}).fields([

  { name: "pdf", maxCount: 1 },

  { name: "image", maxCount: 1 },

]);

 



// -----------------------------------
// Exports
// -----------------------------------
module.exports = {
  uploadPdf,
  pdfStorage,
  uploadPdfOnly,         // For single PDF file
  uploadPdfImageOnly,    // For single image
  uploadPostImages,      // For universal post images
  galleryUpload,         // For gallery images
  uploadMultiple,        // For banners or multiple images
  combinedPdfUpload,     // For parsing pdf + image fields
};
