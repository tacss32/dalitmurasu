const Bookmark = require("../models/Bookmark");
const UniversalPost = require("../models/UniversalPost"); // Assuming you have these models
const PremiumPost = require("../models/PremiumPost");
// Controller to add a new bookmark
exports.addBookmark = async (req, res) => {
  const { userId, postId, postType } = req.body; // postType is essential here
  try {
    // Check if the post is already bookmarked by the user for the given postType
    let existingBookmark = await Bookmark.findOne({ userId, postId, postType });
    if (existingBookmark) {
      return res.status(409).json({ message: `${postType} post is already bookmarked.` });
    }

    // Create a new bookmark
    const newBookmark = await Bookmark.create({ userId, postId, postType });
    res.status(201).json({ message: "Bookmark added", bookmark: newBookmark });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Controller to get all bookmarks for a user, filtered by post type
exports.getAllBookmarks = async (req, res) => {
  const { userId } = req.params;
  try {
    const bookmarks = await Bookmark.find({ userId }).lean(); // Use .lean() for performance
    
    // Create an array of promises for population
    const populatedBookmarks = await Promise.all(
      bookmarks.map(async (bookmark) => {
        let post;
        // Dynamically populate based on postType
        if (bookmark.postType === "UniversalPost") {
          post = await UniversalPost.findById(bookmark.postId).select("title content subtitle images date createdAt author category");
        } else if (bookmark.postType === "PremiumPost") {
          post = await PremiumPost.findById(bookmark.postId).select("title content subtitle images date createdAt author category");
        }
        
        // Return the bookmark with the populated post
        return {
          ...bookmark,
          postId: post, // Replace the postId with the actual post object
        };
      })
    );
    
    // Filter out bookmarks where the post was not found (e.g., deleted posts)
    const validBookmarks = populatedBookmarks.filter(b => b.postId !== null);
    
    res.json(validBookmarks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Controller to remove a bookmark by ID
exports.removeBookmark = async (req, res) => {
  const { id } = req.params;
  try {
    const removedBookmark = await Bookmark.findByIdAndDelete(id);
    if (!removedBookmark) {
      return res.status(404).json({ message: "Bookmark not found." });
    }
    res.json({ message: "Bookmark removed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};