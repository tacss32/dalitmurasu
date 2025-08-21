const express = require("express");
const router = express.Router();

const forgotPasswordController = require("../controllers/forgotPasswordController");

router.post("/send-code", forgotPasswordController.sendResetCode);
router.post("/verify-code", forgotPasswordController.verifyResetCode);
router.post("/reset-password", forgotPasswordController.resetPassword);

module.exports = router;
