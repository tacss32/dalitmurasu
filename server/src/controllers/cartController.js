const Cart = require("../models/Cart");

// Add item to cart
exports.addToCart = async (req, res) => {
  const { userId, bookId, quantity } = req.body;
  try {
    let existing = await Cart.findOne({ userId, bookId });

    if (existing) {
      existing.quantity += Number(quantity);
      await existing.save();
      res.json({ message: "Cart updated", cartItem: existing });
    } else {
      const newItem = await Cart.create({ userId, bookId, quantity });
      res.status(201).json({ message: "Added to cart", cartItem: newItem });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get user's cart
exports.getCart = async (req, res) => {
  const { userId } = req.params;
  try {
    const items = await Cart.find({ userId }).populate("bookId");
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update quantity
exports.updateCartItem = async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  try {
    const updated = await Cart.findByIdAndUpdate(id, { quantity }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Remove one item
exports.removeFromCart = async (req, res) => {
  const { id } = req.params;
  try {
    await Cart.findByIdAndDelete(id);
    res.json({ message: "Item removed from cart" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Clear entire cart
exports.clearCart = async (req, res) => {
  const { userId } = req.params;
  try {
    await Cart.deleteMany({ userId });
    res.json({ message: "Cart cleared" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCart = async (req, res) => {
  const { userId } = req.params;
  const items = await Cart.find({ userId }).populate("bookId");
  res.json(items);
};