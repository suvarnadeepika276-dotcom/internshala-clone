const OtpRequestLog = require("../Model/OtpRequestLog");

const MAX_REQUESTS_PER_WINDOW = 3;
const WINDOW_MINUTES = 15;

async function checkOtpRateLimit(userId) {
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);

  const recentCount = await OtpRequestLog.countDocuments({
    userId,
    createdAt: { $gte: windowStart },
  });

  if (recentCount >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = await OtpRequestLog.findOne({ userId, createdAt: { $gte: windowStart } }).sort({
      createdAt: 1,
    });
    const retryAfterMs = oldest.createdAt.getTime() + WINDOW_MINUTES * 60 * 1000 - Date.now();
    return { allowed: false, retryAfterMinutes: Math.ceil(retryAfterMs / 60000) };
  }

  return { allowed: true };
}

async function registerOtpRequest(userId) {
  await OtpRequestLog.create({ userId, purpose: "resume-payment" });
}

module.exports = { checkOtpRateLimit, registerOtpRequest };
