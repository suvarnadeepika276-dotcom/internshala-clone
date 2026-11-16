const mongoose = require("mongoose");

const loginHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  email: { type: String },
  browser: { type: String, default: "Unknown" },
  browserVersion: { type: String, default: "" },
  os: { type: String, default: "Unknown" },
  deviceType: {
    type: String,
    enum: ["desktop", "laptop", "tablet", "mobile", "unknown"],
    default: "unknown",
  },
  deviceModel: { type: String, default: "" },
  publicIp: { type: String, default: "" },
  location: { type: String, default: "" },
  loginTime: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["success", "blocked_time", "blocked_otp", "failed"],
    default: "success",
  },
  isNewDevice: { type: Boolean, default: false },
  isTrusted: { type: Boolean, default: false },
  sessionId: { type: String, default: "" },
  blockedReason: { type: String, default: "" },
});

module.exports = mongoose.model("LoginHistory", loginHistorySchema);
