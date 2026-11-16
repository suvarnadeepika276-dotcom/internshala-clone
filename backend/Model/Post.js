const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, default: "" },
    mediaUrl: { type: String, default: "" },
    mediaType: {
      type: String,
      enum: ["text", "photo", "video"],
      default: "text",
    },
    privacySettings: {
      type: String,
      enum: ["public", "friends"],
      default: "public",
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
    shares: { type: Number, default: 0 },
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    viewCount: { type: Number, default: 0 },
    friendCountAtPosting: { type: Number, default: 0 },
    hashtags: [{ type: String }],
    mentions: [{ type: String }],
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
