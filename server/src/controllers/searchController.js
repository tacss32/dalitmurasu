const UniversalPost = require("../models/UniversalPost");

exports.searchUniversalPosts = async (req, res) => {
  try {
    const { keyword, category, from, to, filterByPostDate, filterByViewDate } = req.query;

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

    // Date range for Post Creation
    if (from || to) {
      const shouldFilterPostDate = filterByPostDate === "true" || (!filterByPostDate && !filterByViewDate);
      if (shouldFilterPostDate) {
        query.createdAt = {};
        if (from) query.createdAt.$gte = new Date(from);
        if (to) {
          // Calculate end of day for 'to' date
          const toDate = new Date(to);
          toDate.setHours(23, 59, 59, 999);
          query.createdAt.$lte = toDate;
        }
      }
    }

    const results = await UniversalPost.find(query).sort({ createdAt: -1 });

    let finalResults = results;

    // Date range for View Counts
    if ((from || to) && filterByViewDate === "true") {
      const fromDate = from ? new Date(from).getTime() : 0;
      let toDate = new Date().getTime();
      if (to) {
        const tDate = new Date(to);
        tDate.setHours(23, 59, 59, 999);
        toDate = tDate.getTime();
      }

      finalResults = results.map(post => {
        const postObj = post.toObject ? post.toObject() : post;
        
        let filteredViews = 0;
        if (postObj.dailyViews && Array.isArray(postObj.dailyViews)) {
          filteredViews = postObj.dailyViews.reduce((sum, dv) => {
            const dvDate = new Date(dv.date).getTime();
            if (dvDate >= fromDate && dvDate <= toDate) {
              return sum + dv.count;
            }
            return sum;
          }, 0);
        }

        return { ...postObj, filteredViews };
      });
    }

    res.json({ universalPosts: finalResults });
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ error: "Search failed" });
  }
};
