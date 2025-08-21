const express = require("express");
const {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");

const router = express.Router();

router.post("/add", addToCart); // Add item
router.get("/:userId", getCart);
router.put("/update/:id", updateCartItem); // Update item quantity
router.delete("/remove/:id", removeFromCart); // Delete one item
router.delete("/clear/:userId", clearCart); // Clear all items

module.exports = router;
