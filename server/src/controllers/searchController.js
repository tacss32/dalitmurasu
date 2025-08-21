const UniversalPost = require("../models/UniversalPost");

exports.searchUniversalPosts = async (req, res) => {
  try {
    const { keyword, category, from, to } = req.query;

    const query = {};

    // Keyword Search
    if (keyword) {
      // Strip quotes for matching “ ” vs "
      const safeKeyword = keyword.replace(/[“”‘’"']/g, "");
      const regex = new RegExp(safeKeyword, "i");

      query.$or = [
        { title: { $regex: regex } },
        { subtitle: { $regex: regex } },
        { content: { $regex: regex } },
        { author: { $regex: regex } },
      ];
    }

    // Category
    if (category) {
      query.category = category;
    }

    // Date range
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const results = await UniversalPost.find(query).sort({ createdAt: -1 });

    res.json({ universalPosts: results });
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ error: "Search failed" });
  }
};
