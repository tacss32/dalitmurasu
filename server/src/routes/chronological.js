const express = require("express");
const router = express.Router();
const { getChronologicalView } = require("../controllers/chronologicalController");

router.get("/", getChronologicalView);

module.exports = router;
