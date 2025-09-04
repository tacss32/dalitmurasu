const express = require("express");
const router = express.Router();
const bookmarkController = require("../controllers/bookmarkController");

/**
 * @description Routes for handling bookmarking functionality.
 */

// Route to add a new bookmark for either a universal or premium post
router.post("/", bookmarkController.addBookmark);

// Route to get all bookmarks for a specific user and post type
router.get("/:userId", bookmarkController.getAllBookmarks);

// Route to remove a bookmark by its ID
router.delete("/:id", bookmarkController.removeBookmark);

module.exports = router;