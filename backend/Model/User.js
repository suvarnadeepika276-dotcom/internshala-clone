const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        firebaseUid: { type: String, required: true, unique: true, index: true },
        email: { type: String, required: true },
        name: String,
        photo: String,
        isPremium: { type: Boolean, default: false },
        preferredLanguage: { type: String, default: "en" },
        phoneNumber: { type: String, default: "" },
        password: { type: String }, // Hashed password
        mustChangePassword: { type: Boolean, default: false },
        lastPasswordResetRequest: { type: Date },
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);