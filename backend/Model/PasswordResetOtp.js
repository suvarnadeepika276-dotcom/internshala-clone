const mongoose = require("mongoose");

const passwordResetOtpSchema = new mongoose.Schema(
    {
        identifier: { type: String, required: true, index: true }, // email or phone
        resetMethod: { type: String, enum: ["email", "mobile"], required: true },
        otp: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        attempts: { type: Number, default: 0 },
        verified: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model("PasswordResetOtp", passwordResetOtpSchema);
