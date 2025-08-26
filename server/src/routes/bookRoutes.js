const express = require("express");
const multer = require("multer");
const { storage } = require("../config/cloudinary_util");
const {
  createBook,
  getBooks,
  updateBook,
  deleteBook,
  getHomeBooks,
} = require("../controllers/bookController");

const upload = multer({ storage });
const router = express.Router();

router.post("/", upload.single("image"), createBook);
router.get("/", getBooks);
router.get("/home", getHomeBooks);
router.put("/:id", upload.single("image"), updateBook);
router.delete("/:id", deleteBook);

module.exports = router;
