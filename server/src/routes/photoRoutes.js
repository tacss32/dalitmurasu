const express = require("express");
const router = express.Router();

const path = require("path");
const multer = require("multer");

const os = require("os");
const { uploadPhoto } = require("../controllers/photosController");

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

router.post("/", upload.fields([{ name: "image", maxCount: 1 }]), uploadPhoto);

module.exports = router;
