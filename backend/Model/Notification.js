const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: ["like", "comment", "share", "friend_request", "mention"],
      required: true,
    },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    message: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
