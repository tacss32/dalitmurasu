const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * @description Mongoose schema for a unified bookmark.
 * This model represents a user's bookmark of any type of post.
 */
const bookmarkSchema = new Schema({
  // The user who bookmarked the post.
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User", // Assumes a User model
    required: true,
  },
  // The post that was bookmarked.
  postId: {
    type: Schema.Types.ObjectId,
    refPath: "postType", // Reference a different collection based on the `postType` field
    required: true,
  },
  // The type of post ('universal' or 'premium').
  postType: {
    type: String,
    required: true,
    enum: ["UniversalPost", "PremiumPost"], // Use the actual Mongoose model names
  },
  // Automatically records the creation date of the bookmark.
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Bookmark", bookmarkSchema);