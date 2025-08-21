const express = require("express");
const multer = require("multer");
const path = require("path");
const os = require("os");
const router = express.Router();
const universalPostController = require("../controllers/universalPostController");

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const upload = multer({ storage });

// ---------------------- POST ----------------------

// Create new post (with optional image uploads)
router.post(
  "/",
  upload.fields([{ name: "images", maxCount: 5 }]),
  universalPostController.createPost
);

// ---------------------- GET ----------------------

// All posts
router.get("/", universalPostController.getAllPosts);

// Home posts
router.get("/home", universalPostController.getHomePosts);

// Recent posts
router.get("/recent", universalPostController.getRecentPosts);

// Pinned posts ✅
router.get("/pinned", universalPostController.getPinnedPosts);

// Posts by category theme
router.get("/category/:theme", universalPostController.getPostsByCategory);

// Get post with category details
router.get("/with-category/:id", universalPostController.getUniversalPostWithCategoryById);

// Get post by ID
router.get("/:id", universalPostController.getUniversalPostById);

router.get("/four/:id", universalPostController.getPostAndNextFour);

// ---------------------- PUT ----------------------

// Update post (with optional new images)
router.put(
  "/:id",
  upload.fields([{ name: "images", maxCount: 5 }]),
  universalPostController.updatePost
);

// Unpin post ✅
router.put("/:id/unpin", universalPostController.unpinPost);

// ---------------------- DELETE ----------------------

// Delete post
router.delete("/:id", universalPostController.deletePost);

module.exports = router;
