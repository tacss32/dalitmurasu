const PremiumPost = require("../models/PremiumPost");
const cloudinary = require("cloudinary").v2;
const fs = require("fs/promises");
const UserViewHistory = require("../models/UserViewHistory");
 
// --- helper: strip HTML (basic) ---
const stripHtml = (str = "") => str.replace(/<[^>]*>/g, "");
 
// --- helper: first N words preview ---
const getFirstWords = (str = "", count = 150) => {
  const clean = stripHtml(str).trim();
  if (!clean) return "";
  const words = clean.split(/\s+/);
  const truncated = words.length > count;
  const preview = words.slice(0, count).join(" ");
  return {
    preview: truncated ? preview + "..." : preview,
    truncated,
    totalWords: words.length,
  };
};
 
// Upload to cloudinary
const uploadToCloudinary = async (localPath) => {
  const result = await cloudinary.uploader.upload(localPath, {
    folder: "premium_posts/images",
    resource_type: "image",
  });
  await fs.unlink(localPath);
  return result.secure_url;
};
 
// CREATE
exports.createPremiumPost = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      content,
      author,
      category,
      visibility,
      isHome,
      isRecent,
      freeViewLimit,
      date,
    } = req.body;
 
    const imageFiles = req.files?.images || [];
    const imageUrls = await Promise.all(imageFiles.map((f) => uploadToCloudinary(f.path)));
 
    const post = new PremiumPost({
      title,
      subtitle,
      content,
      author,
      category,
      visibility,
      isHome,
      isRecent,
      freeViewLimit,
      date,
      images: imageUrls,
    });
 
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: "Failed to create post", details: err.message });
  }
};
 
// GET all (full posts)
exports.getAllPremiumPosts = async (req, res) => {
  try {
    const posts = await PremiumPost.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
 
// *** NEW: GET previews (public, truncated content) ***
exports.getPremiumPostPreviews = async (req, res) => {
  try {
    const wordCount = Math.max(
      1,
      Math.min(200, parseInt(req.query.words, 10) || 150)
    );
 
    const posts = await PremiumPost.find().sort({ createdAt: -1 }).lean();
 
    const previews = posts.map((p) => {
      const { preview, truncated, totalWords } = getFirstWords(p.content, wordCount);
      return {
        _id: p._id,
        title: p.title,
        subtitle: p.subtitle,
        category: p.category,
        author: p.author,
        images: p.images,
        date: p.date,
        isHome: p.isHome,
        isRecent: p.isRecent,
        visibility: p.visibility,
        requiresSubscription: p.visibility === "subscribers",
        freeViewLimit: p.freeViewLimit,
        views: p.views,
        contentPreview: preview,
        truncated,
        totalWords,
        previewWordCount: wordCount,
      };
    });
 
    res.json(previews);
  } catch (err) {
    res.status(500).json({ error: "Failed to load previews", details: err.message });
  }
};
 
// GET single with access check
// GET single with access check
exports.getPremiumPostById = async (req, res) => {
  try {
    const post = await PremiumPost.findById(req.params.id).lean();

    if (!post) return res.status(404).json({ error: "Post not found" }); // The user object, which includes the subscriptionPlan array

    const user = req.user; // --- 1. SUBSCRIPTION STATUS CALCULATION (NEW LOGIC) ---

    let isSubscribed = false;
    const now = new Date();

    if (user && user.subscriptionPlan?.length) {
      // Check if ANY plan's expiry date is in the future (active)
      isSubscribed = user.subscriptionPlan.some(
        (plan) =>
          plan.subscriptionExpires && new Date(plan.subscriptionExpires) > now
      );
    } // --- END SUBSCRIPTION LOGIC --- // If post is marked for subscribers
    if (post.visibility === "subscribers") {
      // 1. Subscribed users: full access
      if (isSubscribed) {
        await PremiumPost.findByIdAndUpdate(post._id, { $inc: { views: 1 } });
        return res.json(post);
      }
      const previewWordCount = Math.max(
        1,
        Math.min(200, parseInt(req.query.words, 10) || 150)
      ); // Assume getFirstWords is available in this scope
      const { preview: contentPreview, truncated } = getFirstWords(
        post.content,
        previewWordCount
      ); // --- NEW LOGIC START --- // 2. If NOT logged in: Bypass free view limit and go straight to paywall (403).

      if (!user) {
        return res.status(403).json({
          error: "", // General paywall message
          requiresSubscription: true,
          articleData: {
            _id: post._id,
            title: post.title,
            subtitle: post.subtitle,
            category: post.category,
            author: post.author, // ⬅️ FIXED: Changed p.author to post.author
            images: post.images, // ⬅️ FIXED: Changed p.images to post.images
            date: post.date, // ⬅️ FIXED: Changed p.date to post.date
            isHome: post.isHome, // ⬅️ FIXED: Changed p.isHome to post.isHome
            isRecent: post.isRecent, // ⬅️ FIXED: Changed p.isRecent to post.isRecent
            visibility: post.visibility, // ⬅️ FIXED: Changed p.visibility to post.visibility
            freeViewLimit: post.freeViewLimit, // ⬅️ FIXED: Changed p.freeViewLimit to post.freeViewLimit
            views: post.views, // ⬅️ FIXED: Changed p.views to post.views
            contentPreview,
            truncated: true, // Force truncated to true for preview state
          },
        });
      } // --- NEW LOGIC END ---

      // 3. Logged in, not subscribed: apply free view logic
      let record = await UserViewHistory.findOne({
        userId: user._id,
        postId: post._id,
      });

      if (!record) {
        // First free view: grant full access and log it
        await UserViewHistory.create({
          userId: user._id,
          postId: post._id,
          views: 1,
        });

        await PremiumPost.findByIdAndUpdate(post._id, { $inc: { views: 1 } });
        return res.json(post);
      }

      if (record.views < post.freeViewLimit) {
        // Within free view limit: grant full access and increment count
        record.views += 1;
        await record.save();

        await PremiumPost.findByIdAndUpdate(post._id, { $inc: { views: 1 } });
        return res.json(post);
      }

      // 4. Free view limit exceeded (Logged in but unsubscribed and limit hit)
      return res.status(403).json({
        error:
          "",
        requiresSubscription: true,
        articleData: {
          _id: post._id,
          title: post.title,
          subtitle: post.subtitle,
          category: post.category,
          author: post.author,
          images: post.images,
          date: post.date,
          isHome: post.isHome,
          isRecent: post.isRecent,
          visibility: post.visibility,
          freeViewLimit: post.freeViewLimit,
          views: post.views,
          contentPreview,
          truncated,
        },
      });
    }

    // If post is public
    await PremiumPost.findByIdAndUpdate(post._id, { $inc: { views: 1 } });
    return res.json(post);
  } catch (err) {
    console.error("Error fetching premium post by ID:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch post", details: err.message });
  }
};
 
// NEW: GET single post for ADMIN editing (no access checks, returns full content)
exports.getPremiumPostForAdminEdit = async (req, res) => {
  try {
    const post = await PremiumPost.findById(req.params.id).lean(); // Use .lean() for faster reads if no Mongoose doc methods needed
    if (!post) {
      return res.status(404).json({ error: "Post not found for admin edit" });
    }
    // No content or visibility restrictions for admin
    res.json(post);
  } catch (err) {
    console.error("Error fetching premium post for admin edit:", err);
    res.status(500).json({ error: "Failed to fetch post for admin edit", details: err.message });
  }
};
 
 
 
 
 
// UPDATE (Edit Premium Post)
exports.updatePremiumPost = async (req, res) => {
  try {
    const { id } = req.params;

    // Destructure all fields, including the JSON string of existing image URLs
    const { existingImages, ...updates } = req.body;
    
    // 1. Start with the existing image URLs (the ones the user kept)
    let finalImageUrls = [];
    if (existingImages) {
      try {
        // The frontend sends this as a JSON string, so we must parse it
        finalImageUrls = JSON.parse(existingImages);
      } catch (e) {
        console.error("Failed to parse existingImages:", e);
        // Proceed with an empty array if parsing fails
      }
    }

    // 2. Handle new images if uploaded
    if (req.files?.images && req.files.images.length > 0) {
      const newImageUrls = await Promise.all(
        req.files.images.map((f) => uploadToCloudinary(f.path))
      );
      // 3. Merge the new image URLs with the existing (kept) ones
      finalImageUrls = [...finalImageUrls, ...newImageUrls];
    }
 
    // 4. Add the combined image array to the updates object
    updates.images = finalImageUrls;

    // The update will now contain all other body fields + the correct images array
    const updatedPost = await PremiumPost.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(updatedPost);
  } catch (err) {
    console.error("Error updating premium post:", err);
    res.status(500).json({ error: "Failed to update post", details: err.message });
  }
};
 
// DELETE (Remove Premium Post)
exports.deletePremiumPost = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPost = await PremiumPost.findByIdAndDelete(id);
 
    if (!deletedPost) {
      return res.status(404).json({ error: "Post not found" });
    }
 
    res.json({ message: "Post deleted successfully", postId: id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete post", details: err.message });
  }
};
 
// -----------------------------------------------------------------------------
// CONDITIONAL LIST: full content for subscribed users, preview for others
// GET /api/premium-posts/list?words=15
// -----------------------------------------------------------------------------
exports.listPremiumPostsConditional = async (req, res) => {
 
  try {
 
    const wordCount = Math.max(1, Math.min(200, parseInt(req.query.words, 10) || 150));
 
    const posts = await PremiumPost.find().sort({ createdAt: -1 }).lean();
 
    const user = req.user;
 
    const isSubscribed = user?.isSubscribed === true;
 
    const result = posts.map((p) => {
 
      const isPremium = p.visibility === "subscribers";
 
      const base = {
 
        _id: p._id,
 
        title: p.title,
 
        subtitle: p.subtitle,
 
        category: p.category,
 
        author: p.author,
 
        images: p.images,
 
        date: p.date,
 
        isHome: p.isHome,
 
        isRecent: p.isRecent,
 
        visibility: p.visibility,
 
        freeViewLimit: p.freeViewLimit,
 
        views: p.views,
 
        requiresSubscription: isPremium,
 
      };
 
      if (isPremium && !isSubscribed) {
 
        const { preview, truncated, totalWords } = getFirstWords(p.content, wordCount);
 
        return {
 
          ...base,
 
          contentPreview: preview,
 
          truncated,
 
          totalWords,
 
          previewWordCount: wordCount,
 
        };
 
      }
 
      return {
 
        ...base,
 
        content: p.content,
 
        truncated: false,
 
        totalWords: stripHtml(p.content || "").trim().split(/\s+/).filter(Boolean).length,
 
      };
 
    });
 
    res.json(result);
 
  } catch (err) {
 
    res.status(500).json({ error: "Failed to load premium post list", details: err.message });
 
  }
 
};
// GET all home posts (conditional content)
exports.getHomePostsConditional = async (req, res) => {
  try {
    const wordCount = Math.max(
      1,
      Math.min(200, parseInt(req.query.words, 10) || 150)
    );

    const posts = await PremiumPost.find({ isHome: true })
      .sort({ createdAt: -1 })
      .lean();

    const user = req.user;
    const isSubscribed = user?.isSubscribed === true;

    const result = posts.map((p) => {
      const isPremium = p.visibility === "subscribers";
      const base = {
        _id: p._id,
        title: p.title,
        subtitle: p.subtitle,
        category: p.category,
        author: p.author,
        images: p.images,
        date: p.date,
        isHome: p.isHome,
        isRecent: p.isRecent,
        visibility: p.visibility,
        freeViewLimit: p.freeViewLimit,
        views: p.views,
        requiresSubscription: isPremium,
      };

      if (isPremium && !isSubscribed) {
        const { preview, truncated, totalWords } = getFirstWords(
          p.content,
          wordCount
        );
        return {
          ...base,
          contentPreview: preview,
          truncated,
          totalWords,
          previewWordCount: wordCount,
        };
      }

      return {
        ...base,
        content: p.content,
        truncated: false,
        totalWords: stripHtml(p.content || "")
          .trim()
          .split(/\s+/)
          .filter(Boolean).length,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: "Failed to load home posts",
      details: err.message,
    });
  }
};

// GET all recent posts (conditional content)
exports.getRecentPostsConditional = async (req, res) => {
  try {
    const wordCount = Math.max(
      1,
      Math.min(200, parseInt(req.query.words, 10) || 150)
    );

    const posts = await PremiumPost.find({ isRecent: true })
      .sort({ createdAt: -1 })
      .lean();

    const user = req.user;
    const isSubscribed = user?.isSubscribed === true;

    const result = posts.map((p) => {
      const isPremium = p.visibility === "subscribers";
      const base = {
        _id: p._id,
        title: p.title,
        subtitle: p.subtitle,
        category: p.category,
        author: p.author,
        images: p.images,
        date: p.date,
        isHome: p.isHome,
        isRecent: p.isRecent,
        visibility: p.visibility,
        freeViewLimit: p.freeViewLimit,
        views: p.views,
        requiresSubscription: isPremium,
      };

      if (isPremium && !isSubscribed) {
        const { preview, truncated, totalWords } = getFirstWords(
          p.content,
          wordCount
        );
        return {
          ...base,
          contentPreview: preview,
          truncated,
          totalWords,
          previewWordCount: wordCount,
        };
      }

      return {
        ...base,
        content: p.content,
        truncated: false,
        totalWords: stripHtml(p.content || "")
          .trim()
          .split(/\s+/)
          .filter(Boolean).length,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: "Failed to load recent posts",
      details: err.message,
    });
  }
};