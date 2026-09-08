const crypto = require("crypto");

function generateOtp(length = 6) {
  const digits = "0123456789";
  let plain = "";
  for (let i = 0; i < length; i++) {
    plain += digits[crypto.randomInt(0, digits.length)];
  }
  const hash = crypto.createHash("sha256").update(plain).digest("hex");
  return { plain, hash };
}

function verifyOtpHash(inputOtp, storedHash) {
  const inputHash = crypto.createHash("sha256").update(inputOtp).digest("hex");
  const a = Buffer.from(inputHash);
  const b = Buffer.from(storedHash);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function maskEmail(email) {
  const [name, domain] = email.split("@");
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name.slice(0, 2)}${"*".repeat(name.length - 2)}@${domain}`;
}

module.exports = { generateOtp, verifyOtpHash, maskEmail };
