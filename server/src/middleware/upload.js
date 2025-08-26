const multer = require("multer");
const path = require("path");
const os = require("os");
const fs = require("fs");

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
  combinedPdfUpload, // For parsing pdf + image fields
};
