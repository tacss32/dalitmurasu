const UniversalPost = require("../models/UniversalPost");
const Category = require("../models/Category");
const cloudinary = require("cloudinary").v2;
const fs = require("fs/promises");
 
// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
 
// Upload image/pdf to Cloudinary and remove local
const uploadToCloudinary = async (
  localPath,
  folder,
  resourceType = "image"
) => {
  const result = await cloudinary.uploader.upload(localPath, {
    folder,
    resource_type: resourceType,
  });
  await fs.unlink(localPath); // remove temp file
  return result.secure_url;
};
 
// Create Post
const createPost = async (req, res) => {
  try {
    const { title, subtitle, content, author, category, isHome, isRecent, date, isPinned } =
      req.body;
 
    if (!title || !content || !category) {
      return res
        .status(400)
        .json({ error: "title, content, and category are required" });
    }
 
    if (isPinned) {
      const pinnedCount = await UniversalPost.countDocuments({ isPinned: true });
      if (pinnedCount >= 3) {
        return res.status(400).json({ error: "Maximum of 3 pinned posts allowed" });
      }
    }
 
    const imageFiles = req.files?.images || [];
 
    const imageUrls = await Promise.all(
      imageFiles.map((file) =>
        uploadToCloudinary(file.path, "universal_posts/images")
      )
    );
 
    const newPost = new UniversalPost({
      title,
      subtitle,
      content,
      author,
      category,
      images: imageUrls,
      isHome,
      isRecent,
      isPinned,
      date: date || new Date()
    });
 
    const saved = await newPost.save();
    res.status(201).json(saved);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to create post", details: err.message });
  }
};
 
// Get All Posts
const getAllPosts = async (req, res) => {
  try {
    const posts = await UniversalPost.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch posts", details: err.message });
  }
};
 
// Get Home Posts
const getHomePosts = async (req, res) => {
  try {
    const posts = await UniversalPost.find({ isHome: true }).sort({
      createdAt: -1,
    });
    res.status(200).json(posts);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch home posts", details: err.message });
  }
};
 
// Get Recent Posts
const getRecentPosts = async (req, res) => {
  try {
    const posts = await UniversalPost.find({ isRecent: true }).sort({
      createdAt: -1,
    });
    res.status(200).json(posts);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch recent posts", details: err.message });
  }
};
 
// GET By Category Theme
const getPostsByCategory = async (req, res) => {
  try {
    const { theme } = req.params;
    const categories = await Category.find();
    const normalize = (str) => str.toLowerCase().replace(/[\s\-\/]+/g, "");
    const category = categories.find(
      (cat) => normalize(cat.name.en) === normalize(theme)
    );
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    const posts = await UniversalPost.find({ category: category.name.en }).sort(
      { createdAt: -1 }
    );
    res.status(200).json(posts);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch category posts", details: err.message });
  }
};
 
const getUniversalPostById = async (req, res) => {
  try {
    const post = await UniversalPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch post" });
  }
};
 
// Get Post with Category Details by ID
const getUniversalPostWithCategoryById = async (req, res) => {
  try {
    const post = await UniversalPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
 
    const category = await Category.findById(post.category);
 
    // Compose full response
    const fullPost = {
      ...post.toObject(),
      categoryName: category?.name || { en: "Unknown", ta: "தெரியவில்லை" },
      categoryTheme: category?.theme || "Unknown",
    };
 
    res.status(200).json(fullPost);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch post", details: error.message });
  }
};
 
// Delete Post
const deletePost = async (req, res) => {
  try {
    await UniversalPost.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Post deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to delete post", details: err.message });
  }
};
 

// Update Post
const updatePost = async (req, res) => {
  try {
    const { title, subtitle, content, author, category, isHome, isRecent, isPinned, date, existingImages } = // ✅ Destructure existingImages
      req.body;

    if (!title || !content || !category) {
      return res
        .status(400)
        .json({ error: "title, content, and categoryId are required" });
    }

     if (isPinned) {
      const existingPost = await UniversalPost.findById(req.params.id);
      if (!existingPost.isPinned) {
        const pinnedCount = await UniversalPost.countDocuments({ isPinned: true });
        if (pinnedCount >= 3) {
          return res.status(400).json({ error: "Maximum of 3 pinned posts allowed" });
        }
      }
    }
    
    // 1. Parse existing images (sent as a JSON string)
    let finalImageUrls = [];
    if (existingImages) {
        try {
            finalImageUrls = JSON.parse(existingImages); // This is the array of URLs we kept
        } catch (e) {
            console.error("Failed to parse existingImages:", e);
            // Handle error or proceed with an empty array if parsing fails
        }
    }


    const updateFields = {
      title,
      subtitle,
      content,
      author,
      category,
      isHome,
      isRecent,
      isPinned,
      date: date || new Date()
    };

    const imageFiles = req.files?.images || [];

    if (imageFiles.length > 0) {
      const newImageUrls = await Promise.all(
        imageFiles.map((file) =>
          uploadToCloudinary(file.path, "universal_posts/images")
        )
      );
      
      // 2. Merge existing images (that were NOT removed) with new uploads
      finalImageUrls = [...finalImageUrls, ...newImageUrls];
    } 
    
    // 3. Update the document with the final list of images
    updateFields.images = finalImageUrls;

    const updated = await UniversalPost.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to update post", details: err.message });
  }
};
 
const getPinnedPosts = async (req, res) => {
  try {
    const pinnedPosts = await UniversalPost.find({ isPinned: true }).sort({ createdAt: -1 });
    res.status(200).json(pinnedPosts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch pinned posts", details: err.message });
  }
};
 
const unpinPost = async (req, res) => {
  try {
    const post = await UniversalPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
 
    post.isPinned = false;
    await post.save();
    res.status(200).json({ message: "Post unpinned successfully", post });
  } catch (err) {
    res.status(500).json({ error: "Failed to unpin post", details: err.message });
  }
};
 
const getPostAndNextFour = async (req, res) => {
  try {
    // 1. Find the current post by its ID to establish a starting point.
    const currentPost = await UniversalPost.findById(req.params.id);
 
    // If the post is not found, return a 404 error.
    if (!currentPost) {
      return res.status(404).json({ error: "Post not found" });
    }
 
    // 2. Fetch the next four posts chronologically based on the creation date.
    // The query looks for documents where `createdAt` is greater than the current post's date.
    let nextPosts = await UniversalPost.find({
      createdAt: { $gt: currentPost.createdAt },
    })
      .sort({ createdAt: 1 }) // Sort by creation date in ascending order.
      .limit(3); // Limit the results to 4 posts.
 
    // 3. Check if we reached the end of the collection.
    // If the number of posts found is less than 4, we need to loop back.
    if (nextPosts.length < 3) {
      const postsNeeded = 3 - nextPosts.length;
 
      // 4. Fetch the required number of posts from the beginning of the collection.
      const postsFromStart = await UniversalPost.find()
        .sort({ createdAt: 1 })
        .limit(postsNeeded);
 
      // 5. Concatenate the posts from the end of the list with the posts from the start.
      nextPosts = [...nextPosts, ...postsFromStart];
    }
 
    // 6. Return the current post along with the next four posts.
    // We can also include the current post in the response for a complete set.
    res.json({
      currentPost: currentPost,
      nextPosts: nextPosts,
    });
  } catch (error) {
    // If any error occurs, send a 500 Internal Server Error response.
    console.error(error); // Log the error for debugging purposes.
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};
 
 
 
// ✅ Proper export for all route handlers
module.exports = {
  createPost,
  getAllPosts,
  getHomePosts,
  getRecentPosts,
  getPostsByCategory,
  getUniversalPostById,
  getUniversalPostWithCategoryById,
  deletePost,
  updatePost,
  getPinnedPosts,
  unpinPost,
  getPostAndNextFour
};