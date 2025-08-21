const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    popup: { type: Boolean, default: false }, // <-- New field
    userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "ClientUser" }],
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "ClientUser" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
