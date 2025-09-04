const Bookmark = require("../models/Bookmark"); // Assuming a single Bookmark model

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
    // Find all bookmarks for the userId without filtering by postType
    const bookmarks = await Bookmark.find({ userId })
      .populate({
        path: "postId",
        select: "title content" // Customize fields to populate
      });

    res.json(bookmarks);
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