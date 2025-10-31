const express = require("express");
const router = express.Router();
const clientAuth = require("../middleware/authClient");
const { combinedPdfUpload } = require("../middleware/upload");
const pdfUploadController = require("../controllers/pdfUploadController");

// Create new PDF
router.post("/", combinedPdfUpload, pdfUploadController.createPdfUpload);

// Get all PDFs
router.get("/", pdfUploadController.getAllPdfs);

// Access-controlled PDF (free view + views increment)
router.get(
  "/access/:id",
  (req, res, next) => {
    clientAuth(req, res, (err) => {
      if (err) req.user = null;
      next();
    });
  },
  pdfUploadController.getPdfByIdWithAccess
);

// Public PDF
router.get("/:id", pdfUploadController.getPdfById);

// Update PDF
router.put("/:id", combinedPdfUpload, pdfUploadController.updatePdf);

// Delete PDF
router.delete("/:id", pdfUploadController.deletePdf);

module.exports = router;
