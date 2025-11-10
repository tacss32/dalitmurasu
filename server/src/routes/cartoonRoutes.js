const express = require("express");
const router = express.Router();
// Import the new cartoonUpload middleware
const { cartoonUpload } = require("../middleware/cloudinaryMulter");

// Import the new controller functions
const {
  uploadCartoon,
  getCartoons,
  updateCartoon,
  deleteCartoon,
  getCartoonDetail,
} = require("../controllers/cartoonsController");

router.get("/", getCartoons);
router.get("/:id", getCartoonDetail);

// Apply the cartoonUpload middleware for POST and PUT
router.post("/", cartoonUpload.single("image"), uploadCartoon);

router.put("/:id", cartoonUpload.single("image"), updateCartoon);

router.delete("/:id", deleteCartoon);

module.exports = router;
