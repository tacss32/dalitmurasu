const UniversalPost = require("../models/UniversalPost");
const PostTitle = require("../models/PostTitle");

exports.getAllTitles = async (req, res) => {
  try {
    const universalTitles = await UniversalPost.find(
      {},
      "title createdAt"
    ).lean();

    const taggedUniversal = universalTitles.map((item) => ({
      _id: item._id,
      title: item.title,
      createdAt: item.createdAt,
      source: "universal",
    }));

    const allTitles = [...taggedUniversal].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json(allTitles);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch titles",
      details: err.message,
    });
  }
};

exports.addToPostTitles = async (req, res) => {
  try {
    const { postId, title, source } = req.body;

    if (!postId || !title || !["recent", "universal"].includes(source)) {
      return res.status(400).json({ error: "Invalid input" });
    }

    // ✅ Enforce maximum of 5 titles
    const count = await PostTitle.countDocuments();
    if (count >= 5) {
      return res
        .status(400)
        .json({ error: "You can only select up to 5 titles" });
    }

    const exists = await PostTitle.findOne({ postId, source });
    if (exists) {
      return res
        .status(409)
        .json({ message: "Already in PostTitle collection" });
    }

    const newTitle = new PostTitle({ postId, title, source });
    await newTitle.save();

    res.status(201).json({ message: "Title added to PostTitle", newTitle });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to add title", details: err.message });
  }
};

exports.getSelectedTitles = async (req, res) => {
  try {
    const titles = await PostTitle.find().sort({ createdAt: -1 });
    res.status(200).json(titles);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch selected titles", details: err.message });
  }
};

exports.removeFromPostTitles = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await PostTitle.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "PostTitle entry not found" });
    }

    res.json({ message: "Removed from PostTitle" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to remove entry", details: err.message });
  }
};
