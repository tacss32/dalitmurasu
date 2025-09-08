const express = require("express");
const router = express.Router();
const postTitleController = require("../controllers/postHeaderController");

const path = require("path");
const multer = require("multer");

const os = require("os");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const upload = multer({ storage });

router.get("/", postTitleController.getSelectedHeader);
router.post(
  "/",
  upload.fields([
    { name: "desktop-image", maxCount: 1 },
    { name: "mobile-image", maxCount: 1 },
  ]),
  postTitleController.addToPostHeader
);

module.exports = router;
