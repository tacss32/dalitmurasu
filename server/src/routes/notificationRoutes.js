const express = require("express");
const router = express.Router();
const notifCtrl = require("../controllers/notificationController");

router.post("/", notifCtrl.sendNotification);
router.patch("/mark-as-read", notifCtrl.markAsRead);
router.put("/edit-by-title/:title", notifCtrl.editNotificationByTitle);
router.delete("/by-title", notifCtrl.deleteByTitle);

// 💡 Static GET routes first
router.get("/search-users", notifCtrl.searchUsersByPrefix);
router.get("/client-users", notifCtrl.getAllClientUserNames);

// 🔻 Dynamic route LAST so it doesn't conflict
router.get("/:userName", notifCtrl.getNotificationsByUserName);

module.exports = router;
