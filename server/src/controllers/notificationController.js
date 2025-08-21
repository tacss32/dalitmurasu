const Notification = require("../models/Notification");
const ClientUser = require("../models/ClientUser");

// ✅ 1. Send Notification (with Popup + All Users option)
exports.sendNotification = async (req, res) => {
  try {
    const { title, message, targetUserNames, popup, allUsers } = req.body;

    let userIds = [];

    // If 'allUsers' is true, fetch all users
    if (allUsers) {
      const allClients = await ClientUser.find({});
      userIds = allClients.map((user) => user._id);
    } else {
      // Otherwise, fetch only selected users
      if (!targetUserNames || targetUserNames.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Provide targetUserNames or set allUsers = true.",
        });
      }

      const users = await ClientUser.find({ name: { $in: targetUserNames } });
      if (!users.length) {
        return res.status(404).json({
          success: false,
          message: "No users matched the provided names.",
        });
      }

      userIds = users.map((user) => user._id);
    }

    // Create notification
    const notification = new Notification({
      title,
      message,
      popup: popup || false, // <-- Store popup flag
      userIds,
    });

    const saved = await notification.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error("Send Notification Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to send notification" });
  }
};

// ✅ 2. Get Notifications by User Name
exports.getNotificationsByUserName = async (req, res) => {
  try {
    const { userName } = req.params;

    const user = await ClientUser.findOne({ name: userName });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const notifications = await Notification.find({ userIds: user._id }).sort({
      createdAt: -1,
    });

    const enriched = notifications.map((notif) => ({
      _id: notif._id,
      title: notif.title,
      message: notif.message,
      popup: notif.popup || false, // <-- Include popup flag
      read: notif.readBy.includes(user._id),
      createdAt: notif.createdAt,
    }));

    res.status(200).json({ success: true, data: enriched });
  } catch (err) {
    console.error("Fetch Notifications Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch notifications" });
  }
};

// ✅ 3. Mark Notification as Read by User Name
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId, userName } = req.body;

    const user = await ClientUser.findOne({ name: userName });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const updated = await Notification.findByIdAndUpdate(
      notificationId,
      { $addToSet: { readBy: user._id } },
      { new: true }
    );

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("Mark As Read Error:", err);
    res.status(500).json({ success: false, message: "Failed to mark as read" });
  }
};

// ✅ 4. Edit Notification by Title
exports.editNotificationByTitle = async (req, res) => {
  try {
    const { title } = req.params;
    const { newTitle, message, popup } = req.body;

    const updated = await Notification.findOneAndUpdate(
      { title },
      { title: newTitle, message, popup: popup || false },
      { new: true }
    );

    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("Edit Notification Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to update notification" });
  }
};

// ✅ 5. Delete Notification by Title
exports.deleteByTitle = async (req, res) => {
  try {
    const { title } = req.body;

    const deleted = await Notification.findOneAndDelete({ title });
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });

    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (err) {
    console.error("Delete Notification Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete notification" });
  }
};

// ✅ 6. Get All Client User Names
exports.getAllClientUserNames = async (req, res) => {
  try {
    const users = await ClientUser.find({}, "name");
    res.status(200).json({ success: true, users });
  } catch (err) {
    console.error("Fetch Client Users Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

// ✅ 7. Search Client Users by Prefix
exports.searchUsersByPrefix = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Query prefix 'q' is required" });
    }

    const regex = new RegExp("^" + q, "i");
    const users = await ClientUser.find({
      $or: [
        { name: { $regex: regex } },
        { email: { $regex: regex } },
        { phone: { $regex: regex } },
      ],
    }).select("name email phone");

    res.status(200).json({ success: true, users });
  } catch (err) {
    console.error("User search error:", err);
    res.status(500).json({ success: false, message: "Failed to search users" });
  }
};
