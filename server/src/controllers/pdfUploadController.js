const PdfUpload = require("../models/PdfUpload");
const UserViewHistory = require("../models/UserViewHistory");
const jwt = require("jsonwebtoken");
const ClientUser = require("../models/ClientUser");

// Create PDF
async function createPdfUpload(req, res) {
  try {
    const { title, subtitle, category, date, freeViewLimit, visibility } =
      req.body;
    const imageFile = req.files?.image?.[0];
    const pdfFile = req.files?.pdf?.[0];

    // ✅ Always save relative URLs (not absolute paths or localhost)
    const pdfUrl = pdfFile ? `uploads/pdfs/${pdfFile.filename}` : "";
    const imageUrl = imageFile ? `uploads/images/${imageFile.filename}` : "";

    const newPdf = new PdfUpload({
      title,
      subtitle,
      category: { en: category?.en || "", ta: category?.ta || "" },
      date: date || Date.now(),
      pdfUrl,
      imageUrl,
      freeViewLimit: freeViewLimit || 0,
      visibility: visibility || "subscribers",
    });

    const savedPdf = await newPdf.save();
    res.status(201).json(savedPdf);
  } catch (err) {
    console.error("PDF Upload Error:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createPdfUpload };

// Get all PDFs
async function getAllPdfs(req, res) {
  try {
    const pdfs = await PdfUpload.find().sort({ createdAt: -1 });
    res.json(pdfs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get PDF (public)
async function getPdfById(req, res) {
  try {
    const pdf = await PdfUpload.findById(req.params.id);
    if (!pdf) return res.status(404).json({ message: "PDF not found" });
    res.json(pdf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get PDF with access + free view logic
async function getPdfByIdWithAccess(req, res) {
  try {
    let userId = req.user?._id;

    // fallback: decode token if req.user missing
    if (!userId) {
      const authHeader = req.headers["authorization"];
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.id;
        } catch {
          userId = null;
        }
      }
    }

    const pdf = await PdfUpload.findById(req.params.id);
    if (!pdf) return res.status(404).json({ message: "PDF not found" });

    let isSubscribed = false;
    if (userId) {
      const user = await ClientUser.findById(userId);
      isSubscribed = user?.isSubscribed || false;
    }

    // Public PDF → increment views
    if (pdf.visibility === "public" || isSubscribed) {
      pdf.views = (pdf.views || 0) + 1;
      await pdf.save();
      return res.json(pdf);
    }

    // Non-subscribed user → free view logic
    if (!userId) {
      return res.status(401).json({ message: "Login required to view PDF" });
    }

    // Check UserViewHistory
    let record = await UserViewHistory.findOne({ userId, postId: pdf._id });
    if (!record) {
      record = new UserViewHistory({
        userId,
        postId: pdf._id,
        postType: "PdfUpload",
        views: 1,
      });
    } else {
      record.views += 1;
    }

    if (record.views > pdf.freeViewLimit) {
      return res.status(403).json({
        message: "Free view limit reached. Subscribe to view more.",
        pdfPreview: {
          _id: pdf._id,
          title: pdf.title,
          subtitle: pdf.subtitle,
          category: pdf.category,
          date: pdf.date,
          imageUrl: pdf.imageUrl,
        },
      });
    }

    await record.save();

    // Increment total PDF views
    pdf.views = (pdf.views || 0) + 1;
    await pdf.save();

    res.json(pdf);
  } catch (err) {
    console.error("Error fetching PDF with access:", err);
    res.status(500).json({ message: "Server error" });
  }
}

// Update PDF
// controllers/pdfUploadController.js

async function updatePdf(req, res) {
  try {
    const { title, subtitle, category, date, freeViewLimit, visibility } =
      req.body;

    const updateData = {
      title,
      subtitle,
      category: { en: category?.en || "", ta: category?.ta || "" },
      date: date || Date.now(),
      freeViewLimit: freeViewLimit || 0,
      visibility: visibility || "subscribers",
    };

    // ✅ Only save relative URLs
    if (req.files?.pdf?.[0]) {
      updateData.pdfUrl = `uploads/pdfs/${req.files.pdf[0].filename}`;
    }
    if (req.files?.image?.[0]) {
      updateData.imageUrl = `uploads/images/${req.files.image[0].filename}`;
    }

    const updatedPdf = await PdfUpload.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedPdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    res.json(updatedPdf);
  } catch (err) {
    console.error("PDF Update Error:", err);
    res.status(500).json({ error: err.message });
  }
}

// Delete PDF
async function deletePdf(req, res) {
  try {
    const deletedPdf = await PdfUpload.findByIdAndDelete(req.params.id);
    if (!deletedPdf) return res.status(404).json({ message: "PDF not found" });
    res.json({ message: "PDF deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createPdfUpload,
  getAllPdfs,
  getPdfById,
  getPdfByIdWithAccess,
  updatePdf,
  deletePdf,
};
