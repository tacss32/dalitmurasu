const express = require("express");
const router = express.Router();
const {
  getClientProfile,
  updateClientProfile,
} = require("../controllers/profileDetailsController");

const authClient = require("../middleware/authClient");

router.get("/profile", authClient, getClientProfile);      // GET user details
router.put("/profile", authClient, updateClientProfile);   // UPDATE user details

module.exports = router;
