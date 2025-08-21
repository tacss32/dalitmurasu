const PremiumPost = require("../models/PremiumPost");
const UniversalPost = require("../models/UniversalPost");
const PdfUpload = require("../models/PdfUpload");
const PinnedPost = require("../models/PinnedPost"); // New collection to track pinned posts

// ------------------------
// List All Posts
// ------------------------
exports.getAllPosts = async (req, res) => {
  try {
    const [premium, universal, pdfs] = await Promise.all([
      PremiumPost.find().lean(),
      UniversalPost.find().lean(),
      PdfUpload.find().lean(),
    ]);

    const allPosts = [
      ...premium.map(p => ({ ...p, source: "PremiumPost" })),
      ...universal.map(p => ({ ...p, source: "UniversalPost" })),
      ...pdfs.map(p => ({ ...p, source: "PdfUpload" })),
    ];

    res.json(allPosts);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ message: "Server error while fetching posts" });
  }
};

// ------------------------
// Pin a Post (limit 3 total)
// ------------------------
exports.pinPost = async (req, res) => {
  const { postId, source } = req.body;

  try {
    const pinnedCount = await PinnedPost.countDocuments();
    if (pinnedCount >= 3) {
      return res.status(400).json({ message: "Maximum of 3 pinned posts allowed" });
    }

    const exists = await PinnedPost.findOne({ postId });
    if (exists) {
      return res.status(400).json({ message: "Post already pinned" });
    }

    const pinned = await PinnedPost.create({ postId, source });
    res.status(201).json({ message: "Post pinned", pinned });
  } catch (err) {
    console.error("Error pinning post:", err);
    res.status(500).json({ message: "Server error while pinning post" });
  }
};

// ------------------------
// Unpin a Post
// ------------------------
exports.unpinPost = async (req, res) => {
  const { postId } = req.params;

  try {
    const result = await PinnedPost.findOneAndDelete({ postId });
    if (!result) {
      return res.status(404).json({ message: "Pinned post not found" });
    }

    res.json({ message: "Post unpinned successfully" });
  } catch (err) {
    console.error("Error unpinning post:", err);
    res.status(500).json({ message: "Server error while unpinning post" });
  }
};

// ------------------------
// List Pinned Posts
// ------------------------
exports.getPinnedPosts = async (req, res) => {
  try {
    const pinned = await PinnedPost.find().lean();
    const posts = [];

    for (const pin of pinned) {
      let post;
      if (pin.source === "PremiumPost") {
        post = await PremiumPost.findById(pin.postId).lean();
      } else if (pin.source === "UniversalPost") {
        post = await UniversalPost.findById(pin.postId).lean();
      } else if (pin.source === "PdfUpload") {
        post = await PdfUpload.findById(pin.postId).lean();
      }

      if (post) {
        posts.push({ ...post, source: pin.source });
      }
    }

    res.json(posts);
  } catch (err) {
    console.error("Error fetching pinned posts:", err);
    res.status(500).json({ message: "Server error while getting pinned posts" });
  }
};
