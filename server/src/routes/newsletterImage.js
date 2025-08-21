const express = require("express");
const router = express.Router();
const upload = require("../middleware/newsletterUpload");
const controller = require("../controllers/newsletterImageController");

router.get("/", controller.getNewsletterImage);
router.post("/", upload.single("image"), controller.uploadNewsletterImage);

module.exports = router;
