const Razorpay = require("razorpay");
const crypto = require("crypto");

// Requires these in your .env:
//   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
// Get these from your Razorpay dashboard (use Test Mode keys while developing).
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const RESUME_PRICE_INR = 50;

async function createOrder(receiptId) {
  return razorpay.orders.create({
    amount: RESUME_PRICE_INR * 100, // Razorpay expects paise
    currency: "INR",
    receipt: receiptId,
  });
}

function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const a = Buffer.from(expectedSignature);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { razorpay, createOrder, verifyPaymentSignature, RESUME_PRICE_INR };
