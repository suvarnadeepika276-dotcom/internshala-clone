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

module.exports = { sendOtpEmail };
