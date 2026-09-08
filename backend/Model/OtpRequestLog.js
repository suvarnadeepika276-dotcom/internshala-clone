const mongoose = require("mongoose");

const otpRequestLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  purpose: { type: String, default: "resume-payment" },
  createdAt: { type: Date, default: Date.now },
});

otpRequestLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

module.exports = mongoose.model("OtpRequestLog", otpRequestLogSchema);
