const nodemailer = require("nodemailer");

// Requires these in your .env:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
// If using Gmail: use an "App Password", not your normal password.
// If using a transactional provider (SendGrid, Mailgun, etc.) swap this
// transporter config for their SMTP settings or SDK instead.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendOtpEmail(toEmail, otpCode, ttlMinutes = 10) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: toEmail,
    subject: "Your resume payment verification code",
    text: `Your verification code is ${otpCode}. It expires in ${ttlMinutes} minutes. If you didn't request this, you can ignore this email.`,
    html: `<p>Your verification code is <b>${otpCode}</b>.</p><p>It expires in ${ttlMinutes} minutes. If you didn't request this, you can ignore this email.</p>`,
  });
}

async function sendLanguageOtpEmail(toEmail, otpCode, ttlMinutes = 10) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject: "Security Verification: Language Change to French",
      text: `Your verification code to switch website language to French is ${otpCode}. It expires in ${ttlMinutes} minutes.`,
      html: `<h3>Security Verification Required</h3><p>Your verification code to switch website language to French is: <b style="font-size: 20px; color: #1a73e8;">${otpCode}</b></p><p>This code expires in ${ttlMinutes} minutes. If you did not request this language change, please secure your account.</p>`,
    });
  } catch (err) {
    console.log("Email sending error (falling back to console for dev):", err.message);
  }
}

module.exports = { sendOtpEmail, sendLanguageOtpEmail };
