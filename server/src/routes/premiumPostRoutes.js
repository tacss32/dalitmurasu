 const express = require("express");
const router = express.Router();
const multer = require("multer");
const os = require("os");
const path = require("path");
 
const premiumPostController = require("../controllers/premiumPostController");
const { verifyToken } = require("../middleware/verifyToken");
const { optionalAuth } = require("../middleware/optionalAuth");
const adminAuth = require("../middleware/adminAuth"); // NEW admin middleware
 
// ---------------------
// Multer storage setup
// ---------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});
 
const upload = multer({ storage });
 
// ---------------------
// Routes
// ---------------------
 
// CREATE (Admin only)
router.post(
  "/",
  adminAuth,
  upload.fields([{ name: "images", maxCount: 5 }]),
  premiumPostController.createPremiumPost
);
 
// READ all full posts (Public / optional auth)
router.get("/", premiumPostController.getAllPremiumPosts);
 
// READ previews (Public)
router.get("/previews/list", premiumPostController.getPremiumPostPreviews);
 
// LIST posts conditionally based on auth (for dashboard/user view)
router.get("/list", optionalAuth, premiumPostController.listPremiumPostsConditional);
 
// READ full single post (requires subscription or valid token)
router.get("/:id", verifyToken, premiumPostController.getPremiumPostById);
 
// NEW: READ full single post for ADMIN editing (Admin only, bypasses user-tier checks)
// This new route will be used by the admin frontend to get full content for editing.
router.get("/admin/:id", adminAuth, premiumPostController.getPremiumPostForAdminEdit);
 
// UPDATE (Admin only)
router.put(
  "/:id",
  adminAuth,
  upload.fields([{ name: "images", maxCount: 5 }]),
  premiumPostController.updatePremiumPost
);
 
// DELETE (Admin only)
router.delete("/:id", adminAuth, premiumPostController.deletePremiumPost);
 
module.exports = router;