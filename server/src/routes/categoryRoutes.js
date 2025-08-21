const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");

// Create a new category
router.post("/", categoryController.createCategory);

// Get categories with optional filtering via query params
// Supports: ?available=true, ?banner=true, ?header=true
router.get("/", categoryController.getCategories);

// Update a specific category
router.put("/:id", categoryController.updateCategory);

// Delete a specific category
router.delete("/:id", categoryController.deleteCategory);

// Reorder categories (expects an array of {_id, order})
router.post("/reorder", categoryController.reorderCategories);

module.exports = router;
