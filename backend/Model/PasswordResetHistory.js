const mongoose = require("mongoose");

const passwordResetHistorySchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        identifier: { type: String, required: true }, // email or mobile
        resetMethod: { type: String, enum: ["email", "mobile"], required: true },
        status: {
            type: String,
            enum: ["requested", "verified", "blocked_cooldown", "failed_attempts", "expired"],
            default: "requested",
        },
        ip: { type: String, default: "unknown" },
        browser: { type: String, default: "unknown" },
        device: { type: String, default: "unknown" },
        requestTime: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.model("PasswordResetHistory", passwordResetHistorySchema);
