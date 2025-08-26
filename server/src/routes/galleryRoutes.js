const express = require("express");
const router = express.Router();
const { galleryUpload } = require("../middleware/cloudinaryMulter");

const {
  uploadPhoto,
  getGallery,
  updatePhoto,
  deletePhoto,
  getGalleryDetail,
} = require("../controllers/galleryController");

router.get("/", getGallery);
router.get("/:id", getGalleryDetail);

router.post("/", galleryUpload.single("image"), uploadPhoto);

router.put("/:id", galleryUpload.single("image"), updatePhoto);

router.delete("/:id", deletePhoto);

module.exports = router;
