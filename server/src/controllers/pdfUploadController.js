const PdfUpload = require("../models/PdfUpload");
const UserViewHistory = require("../models/UserViewHistory");
const IpViewHistory = require("../models/IpViewHistory");
const jwt = require("jsonwebtoken");
const ClientUser = require("../models/ClientUser");
const SubscriptionPayment = require("../models/SubscriptionPayment");

/**
 * Extract client IP address, handling proxies and load balancers
 */
function getClientIp(req) {
  // Check X-Forwarded-For header (set by proxies/load balancers)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  
  // Fallback to direct connection IP
  return req.ip || req.connection.remoteAddress;
}

// Create PDF
async function createPdfUpload(req, res) {
  try {
    const { title, subtitle, category, date, freeViewLimit, visibility } =
      req.body;
    const imageFile = req.files?.image?.[0];
    const pdfFile = req.files?.pdf?.[0];

 
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
const getPdfByIdWithAccess = async (req, res) => {
  try {
    let userId = req.user?._id;

    // --- 🧩 Fallback: Decode token manually if req.user missing ---
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

    // --- 📄 Fetch PDF ---
    const pdf = await PdfUpload.findById(req.params.id);
    if (!pdf) return res.status(404).json({ message: "PDF not found" });

    let isSubscribed = false;

    // --- ✅ UPDATED SUBSCRIPTION CHECK LOGIC (Matches createSubscriptionOrder) ---
    if (userId) {
      const activeSubscription = await SubscriptionPayment.findOne({
        userId,
        payment_status: "success",
        endDate: { $gt: new Date() }, // active subscription
      });

      if (activeSubscription) {
        isSubscribed = true;
      }
    }

    // --- 🟢 PUBLIC or SUBSCRIBED USER → FULL ACCESS ---
    if (pdf.visibility === "public" || isSubscribed) {
      pdf.views = (pdf.views || 0) + 1;
      await pdf.save();
      return res.json(pdf);
    }

    // --- 🔓 ACCESS LOGIC (Requires Login or Free Limit) ---
    
    // A. REGISTERED USERS (Track by User ID)
    if (userId) {
      // --- 📊 FREE VIEW LOGIC (Logged-in but not subscribed) ---
      let record = await UserViewHistory.findOne({ userId, postId: pdf._id });

      if (!record) {
        record = new UserViewHistory({
          userId,
          postId: pdf._id,
          postType: "PdfUpload",
          views: 0,
        });
      }

      // Check limit BEFORE incrementing for strict enforcement (optional, but cleaner)
      // Current logic: View -> Increment -> Check. 
      // Let's stick to: Increment -> Check, but handle the "already exceeded" case.
      
      const currentViews = record.views;
      const limit = pdf.freeViewLimit || 0;
      
      if (currentViews >= limit) {
         return res.status(403).json({
          message: "Free view limit reached. Subscribe to view more.",
          requiresSubscription: true,
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

      record.views += 1;
      await record.save();

    // B. UNREGISTERED USERS (Track by IP)
    } else {
      const clientIp = getClientIp(req);
      
      let viewRecord = await IpViewHistory.findOne({
        ipAddress: clientIp,
        postId: pdf._id,
      });

      if (!viewRecord) {
        viewRecord = new IpViewHistory({
          ipAddress: clientIp,
          postId: pdf._id,
          postType: "PdfUpload",
          views: 0,
        });
      }

      const currentViews = viewRecord.views;
      const limit = pdf.freeViewLimit || 0;

      if (currentViews >= limit) {
        return res.status(403).json({
          message: "Free view limit reached. Subscribe to view more.",
          requiresSubscription: true,
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

      viewRecord.views += 1;
      viewRecord.lastViewedAt = new Date();
      await viewRecord.save();
    }

    // --- ✅ Success: Increment global view count ---
    pdf.views = (pdf.views || 0) + 1;
    await pdf.save();

    // Add viewsRemaining info to response for frontend awareness
    res.json(pdf);
  } catch (err) {
    console.error("Error fetching PDF with access:", err);
    res.status(500).json({ message: "Server error" });
  }
};
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

    // const pdfUrl = `uploads/pdfs/bot.pdf`;
    // const imageUrl = `uploads/images/bot`;

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
