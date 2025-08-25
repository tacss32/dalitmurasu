const UniversalPost = require("../models/UniversalPost");

exports.getChronologicalView = async (req, res) => {
  try {
    const result = await UniversalPost.aggregate([
      {
        $addFields: {
          categoryName: "$category",
          year: { $year: "$date" },
          month: { $month: "$date" },
        },
      },
      {
        $match: {
          categoryName: { $in: ["Editorial", "தலையங்கம்"] },
        },
      },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: {
            year: "$year",
            month: "$month",
            category: "$categoryName",
          },
          posts: {
            $push: {
              _id: "$_id",
              title: "$title",
              subtitle: "$subtitle",
              content: "$content",
              images: "$images",
              // ✅ force ISO string
              date: {
                $dateToString: {
                  format: "%Y-%m-%dT%H:%M:%S.%LZ",
                  date: "$date",
                },
              },
              author: "$author",
              category: "$category",
            },
          },
        },
      },
      {
        $group: {
          _id: {
            year: "$_id.year",
            month: "$_id.month",
          },
          categories: {
            $push: {
              category: "$_id.category",
              posts: "$posts",
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id.year",
          months: {
            $push: {
              month: "$_id.month",
              categories: "$categories",
            },
          },
        },
      },
      { $sort: { _id: -1 } },
      {
        $project: {
          _id: 0,
          year: "$_id",
          data: {
            months: "$months",
          },
        },
      },
    ]);

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("❌ Aggregation error:", err);
    res.status(500).json({
      error: "Failed to generate chronological view",
      message: err.message,
    });
  }
};
