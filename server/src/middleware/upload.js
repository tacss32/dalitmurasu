const multer = require("multer");
const path = require("path");
const os = require("os");
const fs = require("fs");
// Import the crypto module for generating unique IDs
const crypto = require("crypto");

const combinedPdfUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let uploadPath;

      if (file.fieldname === "pdf") {
        uploadPath = path.join(__dirname, "../uploads/pdfs");
      } else if (file.fieldname === "image") {
        uploadPath = path.join(__dirname, "../uploads/images");
      } else {
        uploadPath = os.tmpdir(); // fallback
      }

      // ✅ Ensure directory exists
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
      // 1. Get the file extension
      const ext = path.extname(file.originalname);

      // 2. Generate a unique ID (like a UUID or MongoDB ObjectId)
      //    We'll use a strong random UUID for a unique filename.
      const uniqueId = crypto.randomBytes(16).toString("hex");

      // 3. Combine the unique ID with the original file extension
      const newFilename = uniqueId + ext;

      cb(null, newFilename);
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
  combinedPdfUpload, // For parsing pdf + image fields
};
