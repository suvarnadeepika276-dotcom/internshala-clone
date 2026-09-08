const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        firebaseUid: { type: String, required: true, unique: true, index: true },
        email: { type: String, required: true },
        name: String,
        photo: String,
        isPremium: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);