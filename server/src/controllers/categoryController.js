const Category = require("../models/Category");

// Create a new category (English + Tamil support)
exports.createCategory = async (req, res) => {
  try {
    const { name, isEditable, isAvailable, isInBanner, setHeader } = req.body;

    if (!name?.en || !name?.ta) {
      return res.status(400).json({
        message: "English name and Tamil name are required.",
      });
    }

    const nameEn = name.en.trim();
    const nameTa = name.ta.trim();

    if (!nameEn || !nameTa) {
      return res.status(400).json({
        message: "English name and Tamil name cannot be empty.",
      });
    }

    // Check for duplicates
    const existing = await Category.findOne({
      $or: [{ "name.en": nameEn }, { "name.ta": nameTa }],
    });

    if (existing) {
      return res.status(409).json({
        message: "A category with this name already exists.",
      });
    }

    // Determine order (append at the end)
    const count = await Category.countDocuments();

    const newCategory = new Category({
      name: { en: nameEn, ta: nameTa },
      order: count,
      isEditable: isEditable ?? false,
      isAvailable: isAvailable ?? false,
      isInBanner: isInBanner ?? false,
      setHeader: setHeader ?? false,
    });

    const saved = await newCategory.save();

    res.status(201).json({
      message: "Category created successfully.",
      category: saved,
    });
  } catch (err) {
    console.error("Category creation failed:", err);
    res.status(500).json({
      message: "Failed to create category",
      error: err.message,
    });
  }
};

// Get categories dynamically based on query params
exports.getCategories = async (req, res) => {
  try {
    const { available, banner, header } = req.query;

    const filter = {};
    if (available === "true") filter.isAvailable = true;
    if (banner === "true") filter.isInBanner = true;
    if (header === "true") filter.setHeader = true;

    const categories = await Category.find(filter).sort({ order: 1 });

    res.status(200).json(categories);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch categories",
      error: err.message,
    });
  }
};

// Update a category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isEditable, isAvailable, isInBanner, setHeader } = req.body;

    if (!name?.en || !name?.ta) {
      return res
        .status(400)
        .json({ message: "Both name.en and name.ta are required" });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        $set: {
          name: {
            en: name.en.trim(),
            ta: name.ta.trim(),
          },
          isEditable: isEditable ?? false,
          isAvailable: isAvailable ?? false,
          isInBanner: isInBanner ?? false,
          setHeader: setHeader ?? false,
        },
      },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({
      message: "Category updated successfully.",
      category: updatedCategory,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to update category",
      error: err.message,
    });
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Category.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully." });
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete category",
      error: err.message,
    });
  }
};

// Reorder categories
exports.reorderCategories = async (req, res) => {
  try {
    const { reordered } = req.body;

    if (!Array.isArray(reordered)) {
      return res.status(400).json({ message: "Invalid data format." });
    }

    for (const item of reordered) {
      await Category.findByIdAndUpdate(item._id, { order: item.order });
    }

    res.status(200).json({ message: "Category order updated successfully." });
  } catch (err) {
    console.error("Error reordering categories:", err);
    res.status(500).json({
      message: "Failed to reorder categories",
      error: err.message,
    });
  }
};
