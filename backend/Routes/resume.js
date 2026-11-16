const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middleware/auth");
const { requirePremium } = require("../middleware/premium");
const resumeController = require("../controllers/resumeController");

// Authentication required for all resume endpoints
router.use(requireAuth);

// Status check & test activation (doesn't require premium check yet)
router.get("/status", resumeController.getUserStatus);
router.post("/activate-premium", resumeController.activateTestPremium);

// All resume actions require premium membership
router.use(requirePremium);

// Draft & Version management
router.post("/draft", resumeController.createOrUpdateDraft);
router.get("/", resumeController.listResumes);
router.patch("/:resumeId/default", resumeController.setDefaultResume);
router.delete("/:resumeId", resumeController.deleteResume);

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
