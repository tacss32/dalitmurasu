const express = require("express");
const router = express.Router();
const { searchUniversalPosts } = require("../controllers/searchController");

router.get("/", searchUniversalPosts);

module.exports = router;
