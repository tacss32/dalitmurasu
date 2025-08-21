const express = require("express");
const router = express.Router();
const postTitleController = require("../controllers/postTitleController");

router.get("/", postTitleController.getAllTitles);
router.post("/add", postTitleController.addToPostTitles);
router.get("/selected", postTitleController.getSelectedTitles);
router.delete("/:id", postTitleController.removeFromPostTitles);

module.exports = router;
