const express = require("express");
const router = express.Router();
const controller = require("../controllers/combinedPostController");

// List all posts from 3 sources
router.get("/all-posts", controller.getAllPosts);

// Pin a post (body: { postId, source })
router.post("/pin", controller.pinPost);

// Unpin post by ID
router.delete("/unpin/:postId", controller.unpinPost);

// List pinned posts
router.get("/pinned", controller.getPinnedPosts);

module.exports = router;
