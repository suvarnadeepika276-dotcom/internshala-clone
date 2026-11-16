const mongoose = require("mongoose");

const languageHistorySchema = new mongoose.Schema(
    {
        email: { type: String, default: "guest" },
        selectedLanguage: { type: String, required: true },
        previousLanguage: { type: String, default: "en" },
        ip: { type: String, default: "unknown" },
        browser: { type: String, default: "unknown" },
        device: { type: String, default: "unknown" },
        timestamp: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.model("LanguageHistory", languageHistorySchema);
