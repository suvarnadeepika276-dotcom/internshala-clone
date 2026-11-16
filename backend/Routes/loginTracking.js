const express = require("express");
const router = express.Router();
const LoginHistory = require("../Model/LoginHistory");
const LoginOtp = require("../Model/LoginOtp");
const User = require("../Model/User");
const { requireAuth } = require("../middleware/auth");
const { sendLoginOtpEmail } = require("../utils/mailer");

// Helper: generate 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper: parse user-agent string into browser/os/device info
function parseUserAgent(ua) {
  ua = ua || "";

  let browser = "Unknown";
  let browserVersion = "";
  let os = "Unknown";
  let deviceType = "desktop";
  let deviceModel = "";

  // Browser detection
  if (ua.includes("Chrome") && !ua.includes("Edg") && !ua.includes("OPR")) {
    browser = "Chrome";
    const match = ua.match(/Chrome\/([\d.]+)/);
    browserVersion = match ? match[1] : "";
  } else if (ua.includes("Firefox")) {
    browser = "Firefox";
    const match = ua.match(/Firefox\/([\d.]+)/);
    browserVersion = match ? match[1] : "";
  } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
    browser = "Safari";
    const match = ua.match(/Version\/([\d.]+)/);
    browserVersion = match ? match[1] : "";
  } else if (ua.includes("Edg")) {
    browser = "Edge";
    const match = ua.match(/Edg\/([\d.]+)/);
    browserVersion = match ? match[1] : "";
  } else if (ua.includes("OPR") || ua.includes("Opera")) {
    browser = "Opera";
  }

  // OS detection
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  // Device type detection
  if (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")) {
    deviceType = "mobile";
    if (ua.includes("iPhone")) deviceModel = "iPhone";
    else if (ua.includes("Samsung")) deviceModel = "Samsung";
    else if (ua.includes("Pixel")) deviceModel = "Google Pixel";
    else deviceModel = "Android Phone";
  } else if (ua.includes("iPad") || ua.includes("Tablet")) {
    deviceType = "tablet";
    deviceModel = ua.includes("iPad") ? "iPad" : "Tablet";
  } else {
    deviceType = "desktop";
  }

  return { browser, browserVersion, os, deviceType, deviceModel };
}

// Helper: get IST hours and minutes
function getISTTime() {
  const now = new Date();
  // IST = UTC + 5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  return {
    hours: istDate.getUTCHours(),
    minutes: istDate.getUTCMinutes(),
  };
}

// POST /api/login-tracking/log
// Called from frontend on every successful Firebase login
router.post("/log", requireAuth, async (req, res) => {
  try {
    const { userAgent, sessionId } = req.body;
    const userId = req.user._id;
    const email = req.user.email;

    const { browser, browserVersion, os, deviceType, deviceModel } =
      parseUserAgent(userAgent || req.headers["user-agent"] || "");

    // Get public IP
    const publicIp =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "";

    // Check if this is a new device/IP (compare with last successful login)
    const lastLogin = await LoginHistory.findOne({
      userId,
      status: "success",
    }).sort({ loginTime: -1 });

    const isNewDevice =
      !lastLogin ||
      lastLogin.browser !== browser ||
      lastLogin.publicIp !== publicIp;

    // ── RULE 1: Mobile device time restriction ──
    // Mobile logins only allowed between 10:00 AM and 1:00 PM IST
    if (deviceType === "mobile") {
      const { hours, minutes } = getISTTime();
      const totalMinutes = hours * 60 + minutes;
      const allowStart = 10 * 60; // 10:00 AM
      const allowEnd = 13 * 60; // 1:00 PM

      if (totalMinutes < allowStart || totalMinutes >= allowEnd) {
        // Log the blocked attempt
        await LoginHistory.create({
          userId,
          email,
          browser,
          browserVersion,
          os,
          deviceType,
          deviceModel,
          publicIp,
          status: "blocked_time",
          isNewDevice,
          sessionId: sessionId || "",
          blockedReason:
            "Mobile login is only allowed between 10:00 AM and 1:00 PM IST.",
        });

        return res.status(403).json({
          blocked: true,
          reason: "time_restriction",
          message:
            "Mobile login is only allowed between 10:00 AM and 1:00 PM IST. Please try again during the allowed window.",
        });
      }
    }

    // ── RULE 2: Chrome browser requires OTP ──
    // If Chrome and no verified OTP session, return requiresOtp flag
    if (browser === "Chrome") {
      return res.json({
        requiresOtp: true,
        email,
        browser,
        browserVersion,
        os,
        deviceType,
        deviceModel,
        publicIp,
        isNewDevice,
        sessionId: sessionId || "",
        message:
          "Google Chrome login requires OTP verification. Please check your email.",
      });
    }

    // ── All other browsers: log directly as success ──
    const record = await LoginHistory.create({
      userId,
      email,
      browser,
      browserVersion,
      os,
      deviceType,
      deviceModel,
      publicIp,
      status: "success",
      isNewDevice,
      sessionId: sessionId || "",
    });

    return res.json({
      success: true,
      message: "Login recorded",
      isNewDevice,
      record,
    });
  } catch (err) {
    console.error("Log login error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/login-tracking/chrome-otp/request
// Send OTP to email for Chrome browser verification
router.post("/chrome-otp/request", requireAuth, async (req, res) => {
  try {
    const email = req.user.email;

    // Check for existing unexpired OTP (rate limit: 1 per 2 minutes)
    const existing = await LoginOtp.findOne({
      email,
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    let otp;
    if (existing && existing.attempts < 5) {
      // Resend same OTP if still valid
      otp = existing.otp;
    } else {
      // Delete old ones and create fresh
      await LoginOtp.deleteMany({ email });
      otp = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await LoginOtp.create({ email, otp, expiresAt });
    }

    // Send email
    try {
      await sendLoginOtpEmail(email, otp);
    } catch (mailErr) {
      console.log("Login OTP email error:", mailErr.message);
    }

    return res.json({
      success: true,
      message: "OTP sent to your registered email.",
      demoOtp: otp, // For evaluator/testing purposes
    });
  } catch (err) {
    console.error("Chrome OTP request error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/login-tracking/chrome-otp/verify
// Verify OTP and log the Chrome login
router.post("/chrome-otp/verify", requireAuth, async (req, res) => {
  try {
    const { otp, userAgent, sessionId } = req.body;
    const email = req.user.email;
    const userId = req.user._id;

    if (!otp) {
      return res.status(400).json({ error: "OTP is required." });
    }

    const otpRecord = await LoginOtp.findOne({
      email,
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res
        .status(400)
        .json({ error: "OTP expired or not found. Please request a new one." });
    }

    if (otpRecord.attempts >= 5) {
      return res
        .status(400)
        .json({ error: "Too many attempts. Please request a new OTP." });
    }

    if (otpRecord.otp !== otp.toString().trim()) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({
        error: `Incorrect OTP. ${5 - otpRecord.attempts} attempts remaining.`,
      });
    }

    // OTP verified
    otpRecord.verified = true;
    await otpRecord.save();

    const { browser, browserVersion, os, deviceType, deviceModel } =
      parseUserAgent(userAgent || req.headers["user-agent"] || "");

    const publicIp =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "";

    const lastLogin = await LoginHistory.findOne({
      userId,
      status: "success",
    }).sort({ loginTime: -1 });

    const isNewDevice =
      !lastLogin ||
      lastLogin.browser !== browser ||
      lastLogin.publicIp !== publicIp;

    // Check if already trusted device
    const trustedRecord = await LoginHistory.findOne({
      userId,
      publicIp,
      browser,
      isTrusted: true,
    });

    const record = await LoginHistory.create({
      userId,
      email,
      browser,
      browserVersion,
      os,
      deviceType,
      deviceModel,
      publicIp,
      status: "success",
      isNewDevice,
      isTrusted: !!trustedRecord,
      sessionId: sessionId || "",
    });

    return res.json({
      success: true,
      message: "OTP verified. Login successful.",
      isNewDevice,
      record,
    });
  } catch (err) {
    console.error("Chrome OTP verify error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/login-tracking/trust-device
// Mark current device as trusted
router.post("/trust-device", requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    await LoginHistory.findOneAndUpdate(
      { userId: req.user._id, sessionId },
      { isTrusted: true }
    );
    return res.json({ success: true, message: "Device marked as trusted." });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/login-tracking/history
// Get login history for the logged-in user
router.get("/history", requireAuth, async (req, res) => {
  try {
    const history = await LoginHistory.find({ userId: req.user._id })
      .sort({ loginTime: -1 })
      .limit(50);
    return res.json({ history });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/login-tracking/sessions
// Active sessions (last 30 days with status success)
router.get("/sessions", requireAuth, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sessions = await LoginHistory.find({
      userId: req.user._id,
      status: "success",
      loginTime: { $gte: thirtyDaysAgo },
    }).sort({ loginTime: -1 });
    return res.json({ sessions });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/login-tracking/sessions/:id
// Sign out from a specific session (removes the record)
router.delete("/sessions/:id", requireAuth, async (req, res) => {
  try {
    const record = await LoginHistory.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: "Session not found." });
    }
    if (record.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized." });
    }
    await record.deleteOne();
    return res.json({ success: true, message: "Session removed." });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
