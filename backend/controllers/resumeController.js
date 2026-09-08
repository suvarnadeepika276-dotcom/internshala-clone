const Resume = require("../Model/Resume");
const ResumeOtp = require("../Model/ResumeOtp");
const ResumePayment = require("../Model/ResumePayment");
const { generateOtp, verifyOtpHash, maskEmail } = require("../utils/otp");
const { sendOtpEmail } = require("../utils/mailer");
const { checkOtpRateLimit, registerOtpRequest } = require("../utils/rateLimit");
const { createOrder, verifyPaymentSignature, RESUME_PRICE_INR } = require("../utils/razorpay");
const { generateResumePdf } = require("../utils/pdfGenerator");

const OTP_TTL_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

// Required fields that must be filled before a resume can be generated.
const REQUIRED_FIELDS = ["fullName", "email"];

function checkResumeComplete(resume) {
  return REQUIRED_FIELDS.every((field) => Boolean(resume[field]));
}

// --- Draft CRUD ---------------------------------------------------------

exports.createOrUpdateDraft = async (req, res) => {
  try {
    const { resumeId, ...fields } = req.body;
    let resume;

    if (resumeId) {
      resume = await Resume.findOne({ _id: resumeId, userId: req.user._id });
      if (!resume) return res.status(404).json({ error: "Resume not found" });
      Object.assign(resume, fields);
    } else {
      resume = new Resume({ ...fields, userId: req.user._id });
    }

    resume.isComplete = checkResumeComplete(resume);
    await resume.save();

    res.status(200).json({ resume });
  } catch (err) {
    res.status(500).json({ error: "Failed to save resume draft" });
  }
};

exports.listResumes = async (req, res) => {
  const resumes = await Resume.find({ userId: req.user._id }).sort({ updatedAt: -1 });
  res.status(200).json({ resumes });
};

exports.setDefaultResume = async (req, res) => {
  const { resumeId } = req.params;
  const resume = await Resume.findOne({ _id: resumeId, userId: req.user._id, paymentStatus: "paid" });

  if (!resume) {
    return res.status(404).json({ error: "Paid resume not found" });
  }

  resume.isDefault = true;
  await resume.save(); // pre-save hook unsets isDefault on the user's other resumes

  res.status(200).json({ success: true, resumeId: resume._id });
};

// --- OTP step (before payment) -----------------------------------------

exports.requestOtp = async (req, res) => {
  const { resumeId } = req.body;

  const resume = await Resume.findOne({ _id: resumeId, userId: req.user._id });
  if (!resume) return res.status(404).json({ error: "Resume not found" });

  if (!checkResumeComplete(resume)) {
    return res.status(400).json({ error: "Please complete required resume fields before proceeding." });
  }

  const rateCheck = await checkOtpRateLimit(req.user._id);
  if (!rateCheck.allowed) {
    return res.status(429).json({ error: "Too many OTP requests", retryAfterMinutes: rateCheck.retryAfterMinutes });
  }

  const otp = generateOtp(6);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await ResumeOtp.findOneAndUpdate(
    { userId: req.user._id, resumeId: resume._id },
    { otpHash: otp.hash, expiresAt, attempts: 0, verified: false },
    { upsert: true }
  );

  await registerOtpRequest(req.user._id);

  try {
  await sendOtpEmail(req.user.email, otp.plain, OTP_TTL_MINUTES);
} catch (err) {
  console.error("EMAIL SEND ERROR:", err);   // ADD THIS LINE
  return res.status(502).json({ error: "Failed to send OTP email" });
}

  res.status(200).json({ success: true, maskedEmail: maskEmail(req.user.email) });
};

exports.verifyOtp = async (req, res) => {
  const { resumeId, otp } = req.body;

  const record = await ResumeOtp.findOne({ userId: req.user._id, resumeId });
  if (!record) return res.status(400).json({ error: "No pending OTP request", attemptsLeft: 0 });

  if (record.expiresAt < new Date()) {
    await record.deleteOne();
    return res.status(410).json({ error: "OTP expired" });
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    await record.deleteOne();
    return res.status(429).json({ error: "Too many failed attempts" });
  }

  const isValid = verifyOtpHash(otp, record.otpHash);

  if (!isValid) {
    record.attempts += 1;
    await record.save();
    return res.status(400).json({
      error: "Invalid OTP",
      attemptsLeft: Math.max(MAX_OTP_ATTEMPTS - record.attempts, 0),
    });
  }

  record.verified = true;
  await record.save();

  await Resume.findByIdAndUpdate(resumeId, { otpVerified: true });

  res.status(200).json({ success: true });
};

// --- Payment step (only reachable after OTP verified) -------------------

exports.createPaymentOrder = async (req, res) => {
  try {
    const { resumeId } = req.body;

    const resume = await Resume.findOne({ _id: resumeId, userId: req.user._id });
    if (!resume) return res.status(404).json({ error: "Resume not found" });

    if (!resume.otpVerified) {
      return res.status(403).json({ error: "OTP verification required before payment." });
    }

    const existing = await ResumePayment.findOne({ resumeId, status: { $in: ["created", "paid"] } });
    if (existing?.status === "paid") {
      return res.status(400).json({ error: "This resume has already been paid for." });
    }
    if (existing?.status === "created") {
      return res.status(200).json({ orderId: existing.razorpayOrderId, amount: RESUME_PRICE_INR });
    }

  const order = await createOrder(`resume_${resumeId}`);

    await ResumePayment.create({
      userId: req.user._id,
      resumeId,
      razorpayOrderId: order.id,
      amount: RESUME_PRICE_INR,
      status: "created",
    });

    res.status(200).json({ orderId: order.id, amount: RESUME_PRICE_INR, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error("PAYMENT ORDER ERROR:", err);
    res.status(500).json({ error: "Failed to create payment order" });
  }
};
exports.verifyPayment = async (req, res) => {
  const { resumeId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  const payment = await ResumePayment.findOne({ resumeId, razorpayOrderId, userId: req.user._id });
  if (!payment) return res.status(404).json({ error: "Payment record not found" });

  if (payment.status === "paid") {
    return res.status(400).json({ error: "Payment already verified for this resume." });
  }

  const isValidSignature = verifyPaymentSignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!isValidSignature) {
    payment.status = "failed";
    payment.failureReason = "Signature verification failed";
    await payment.save();
    return res.status(400).json({ error: "Payment verification failed" });
  }

  payment.status = "paid";
  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = razorpaySignature;
  payment.invoiceNumber = `INV-${Date.now()}-${payment._id.toString().slice(-6)}`;
  await payment.save();

  const resume = await Resume.findById(resumeId);
  resume.paymentStatus = "paid";
  resume.paymentId = payment._id;

  // Generate the PDF now that both OTP + payment are confirmed
  const { fileName } = await generateResumePdf(resume);
  resume.pdfUrl = `/generated-resumes/${fileName}`; // serve statically, or swap for S3/Cloudinary URL
  resume.generatedAt = new Date();

  // If this is the user's first paid resume, make it the default
  const otherDefault = await Resume.findOne({ userId: req.user._id, isDefault: true });
  if (!otherDefault) resume.isDefault = true;

  await resume.save();

  res.status(200).json({
    success: true,
    resume: { id: resume._id, pdfUrl: resume.pdfUrl, invoiceNumber: payment.invoiceNumber },
  });
};

exports.markPaymentFailed = async (req, res) => {
  // Called by the frontend when Razorpay checkout reports a failure/cancellation
  const { resumeId, razorpayOrderId, reason } = req.body;

  await ResumePayment.findOneAndUpdate(
    { resumeId, razorpayOrderId, userId: req.user._id },
    { status: "failed", failureReason: reason || "Cancelled by user" }
  );

  res.status(200).json({ success: true });
};

// --- History -------------------------------------------------------------

exports.getHistory = async (req, res) => {
  const resumes = await Resume.find({ userId: req.user._id }).sort({ createdAt: -1 });
  const payments = await ResumePayment.find({ userId: req.user._id }).sort({ createdAt: -1 });

  res.status(200).json({ resumes, payments });
};

exports.logDownload = async (req, res) => {
  const { resumeId } = req.params;
  const resume = await Resume.findOne({ _id: resumeId, userId: req.user._id, paymentStatus: "paid" });
  if (!resume) return res.status(403).json({ error: "Resume not paid or not found" });

  await ResumePayment.findByIdAndUpdate(resume.paymentId, {
    $push: { downloads: { downloadedAt: new Date(), ip: req.ip } },
  });

  res.status(200).json({ pdfUrl: resume.pdfUrl });
};
