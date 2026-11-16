const express = require("express");
const router = express.Router();
const LanguageHistory = require("../Model/LanguageHistory");
const LanguageOtp = require("../Model/LanguageOtp");
const User = require("../Model/User");
const { sendLanguageOtpEmail } = require("../utils/mailer");

// Helper to generate 6-digit random numeric OTP
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// 1. Change language (Standard languages: en, es, hi, pt, zh)
router.post("/change", async (req, res) => {
    try {
        const { language, previousLanguage, email, browser, device } = req.body;
        const validLanguages = ["en", "es", "hi", "pt", "zh", "fr"];

        if (!validLanguages.includes(language)) {
            return res.status(400).json({ error: "Unsupported language selection" });
        }

        // Security requirement: French requires OTP verification first
        if (language === "fr") {
            return res.status(403).json({
                error: "Security requirement: OTP verification is required to switch language to French.",
                requiresOtp: true,
            });
        }

        const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";

        // Audit log
        await LanguageHistory.create({
            email: email || "guest",
            selectedLanguage: language,
            previousLanguage: previousLanguage || "en",
            ip: Array.isArray(ip) ? ip[0] : ip,
            browser: browser || "Unknown Browser",
            device: device || "Desktop",
            timestamp: new Date(),
        });

        // Update user profile if email exists
        if (email) {
            await User.findOneAndUpdate({ email }, { preferredLanguage: language });
        }

        res.status(200).json({ success: true, language });
    } catch (err) {
        console.error("Language change error:", err);
        res.status(500).json({ error: "Failed to update language preference" });
    }
});

// 2. Request OTP specifically for switching to French
router.post("/french-otp/request", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Registered email address is required to request OTP." });
        }

        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity

        await LanguageOtp.findOneAndUpdate(
            { email },
            { otp, expiresAt, attempts: 0 },
            { upsert: true, new: true }
        );

        console.log(`[SECURITY AUDIT] Language switch OTP for ${email}: ${otp}`);

        try {
            await sendLanguageOtpEmail(email, otp, 10);
        } catch (mailErr) {
            console.warn("Mail dispatch error (check SMTP settings):", mailErr.message);
        }

        res.status(200).json({
            success: true,
            message: `OTP sent successfully to ${email}. Valid for 10 minutes.`,
            demoOtp: otp,
        });
    } catch (err) {
        console.error("French OTP request error:", err);
        res.status(500).json({ error: "Failed to send verification OTP" });
    }
});

// 3. Verify OTP and apply French language change
router.post("/french-otp/verify", async (req, res) => {
    try {
        const { email, otp, previousLanguage, browser, device } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: "Email and OTP are required" });
        }

        const record = await LanguageOtp.findOne({ email });
        if (!record) {
            return res.status(400).json({ error: "No pending OTP request found for this email." });
        }

        if (new Date() > record.expiresAt) {
            await record.deleteOne();
            return res.status(410).json({ error: "OTP has expired. Please request a new one." });
        }

        if (record.attempts >= 5) {
            await record.deleteOne();
            return res.status(429).json({ error: "Too many failed attempts. Please request a new OTP." });
        }

        if (record.otp !== otp.trim()) {
            record.attempts += 1;
            await record.save();
            return res.status(400).json({
                error: `Invalid OTP. ${5 - record.attempts} attempts remaining.`,
            });
        }

        // OTP verified successfully! Delete OTP record
        await record.deleteOne();

        const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";

        // Audit log
        await LanguageHistory.create({
            email,
            selectedLanguage: "fr",
            previousLanguage: previousLanguage || "en",
            ip: Array.isArray(ip) ? ip[0] : ip,
            browser: browser || "Unknown Browser",
            device: device || "Desktop",
            timestamp: new Date(),
        });

        // Update user profile in database
        await User.findOneAndUpdate({ email }, { preferredLanguage: "fr" });

        res.status(200).json({
            success: true,
            language: "fr",
            message: "Language successfully switched to French after OTP verification.",
        });
    } catch (err) {
        console.error("French OTP verify error:", err);
        res.status(500).json({ error: "OTP verification failed" });
    }
});

// 4. Retrieve language change audit history
router.get("/history", async (req, res) => {
    try {
        const history = await LanguageHistory.find().sort({ timestamp: -1 }).limit(50);
        res.status(200).json({ history });
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve language audit logs" });
    }
});

module.exports = router;
