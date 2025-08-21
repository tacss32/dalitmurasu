const express = require("express");
const router = express.Router();
const bannerController = require("../controllers/bannerController");
const { uploadMultiple } = require("../middleware/upload");

router.post("/", uploadMultiple.fields([
  { name: "mobileImage", maxCount: 1 },
  { name: "desktopImage", maxCount: 1 },
]), bannerController.createBanner);

router.put("/:id", uploadMultiple.fields([
  { name: "mobileImage", maxCount: 1 },
  { name: "desktopImage", maxCount: 1 },
]), bannerController.updateBanner);

router.get("/", bannerController.getBanners);
router.delete("/:id", bannerController.deleteBanner);

module.exports = router;
