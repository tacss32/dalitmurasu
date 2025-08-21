const Book = require("../models/Book");

// Create a book
exports.createBook = async (req, res) => {
  try {
    const book = new Book({
      name: req.body.name,
      author: req.body.author,
      actualPrice: req.body.actualPrice,
      sellingPrice: req.body.sellingPrice,
      // coupon: req.body.coupon,
      inStock: req.body.inStock === "true", // if sent as string
      showOnHome: req.body.showOnHome === "true", // show on homepage
      imageUrl: req.file?.path || "", // optional, from multer-cloudinary
      category: req.body.category || "shop",
      description: req.body.description || "",
      deliveryFee: req.body.deliveryFee || 0,
    });

    await book.save();
    res.status(201).json(book);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Get all books
exports.getBooks = async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get only books shown on home
exports.getHomeBooks = async (req, res) => {
  try {
    const homeBooks = await Book.find({ showOnHome: true });
    res.status(200).json(homeBooks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a book
exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;

    const updateData = {
      name: req.body.name,
      author: req.body.author,
      actualPrice: req.body.actualPrice,
      sellingPrice: req.body.sellingPrice,
      // coupon: req.body.coupon,
      inStock: req.body.inStock === "true",
      showOnHome: req.body.showOnHome === "true",
      category: req.body.category || "shop",
      description: req.body.description || "",
      deliveryFee: req.body.deliveryFee || 0,
    };

    if (req.file?.path) {
      updateData.imageUrl = req.file.path;
    }

    const updated = await Book.findByIdAndUpdate(id, updateData, { new: true });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Delete a book
exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    await Book.findByIdAndDelete(id);
    res.json({ message: "Book deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
