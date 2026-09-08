const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middleware/auth");
const { requirePremium } = require("../middleware/premium");
const resumeController = require("../controllers/resumeController");

// All resume-builder routes require login + premium
router.use(requireAuth, requirePremium);

// Draft management
router.post("/draft", resumeController.createOrUpdateDraft);
router.get("/", resumeController.listResumes);
router.patch("/:resumeId/default", resumeController.setDefaultResume);

// OTP (must happen before payment)
router.post("/otp/request", resumeController.requestOtp);
router.post("/otp/verify", resumeController.verifyOtp);

// Payment (Razorpay)
router.post("/payment/order", resumeController.createPaymentOrder);
router.post("/payment/verify", resumeController.verifyPayment);
router.post("/payment/failed", resumeController.markPaymentFailed);

// History + downloads
router.get("/history", resumeController.getHistory);
router.get("/:resumeId/download", resumeController.logDownload);

module.exports = router;
