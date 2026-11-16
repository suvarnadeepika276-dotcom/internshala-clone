"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Script from "next/script";
import {
  requestOtp,
  verifyOtp,
  createPaymentOrder,
  verifyPayment,
  markPaymentFailed,
} from "../../../services/resumeApi";
import { otpSent, otpVerified, paymentOrderCreated, paymentSucceeded, paymentFailed } from "../../../redux/resumeSlice";
import { Download, ShieldCheck, Mail, ArrowRight, RefreshCw } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Props {
  resumeId: string;
  userEmail: string;
  onSuccess?: () => void;
}

export default function PaymentOtpFlow({ resumeId, userEmail, onSuccess }: Props) {
  const dispatch = useDispatch();
  const { otpStep, maskedEmail, paymentStep } = useSelector((s: any) => s.resumeBuilder);
  const [otpValue, setOtpValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedPdf, setGeneratedPdf] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const res = await requestOtp(resumeId);
      dispatch(otpSent(res.maskedEmail || userEmail));
      toast.success("Identity verification OTP sent to your email");
    } catch (err: any) {
      const data = err?.response?.data;
      if (err?.response?.status === 429) {
        toast.error(`Too many requests. Try again in ${data.retryAfterMinutes} minutes.`);
      } else if (err?.response?.status === 400) {
        toast.error(data.error || "Please complete required resume fields (Name, Email) first.");
      } else {
        toast.error("Failed to send OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      await verifyOtp(resumeId, otpValue);
      dispatch(otpVerified());
      toast.success("Identity verified! You may now proceed with Razorpay checkout.");
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      if (status === 410) toast.error("OTP expired. Please request a new one.");
      else if (status === 429) toast.error("Too many failed attempts. Request a new OTP.");
      else if (status === 400) toast.error(`Invalid OTP. ${data?.attemptsLeft ?? 0} attempts left.`);
      else toast.error("Verification failed. Please check the code and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    setLoading(true);
    try {
      const { orderId, amount, keyId } = await createPaymentOrder(resumeId);
      dispatch(paymentOrderCreated());

      const options = {
        key: keyId || "rzp_test_placeholder",
        amount: amount * 100,
        currency: "INR",
        name: "InternArea Resume Builder",
        description: "ATS Resume Generation & Download (₹50)",
        order_id: orderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await verifyPayment({
              resumeId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            dispatch(paymentSucceeded());
            setGeneratedPdf(verifyRes.resume?.pdfUrl || null);
            setInvoiceNumber(verifyRes.resume?.invoiceNumber || null);
            toast.success("Payment verified! Your ATS Resume has been generated.");
            if (onSuccess) onSuccess();
          } catch (err) {
            dispatch(paymentFailed("Payment verification failed"));
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        modal: {
          ondismiss: async () => {
            await markPaymentFailed(resumeId, orderId, "Cancelled by user");
            dispatch(paymentFailed("Payment cancelled"));
            toast.info("Payment cancelled.");
          },
        },
        prefill: { email: userEmail },
        theme: { color: "#1a73e8" },
      };

      if (!window.Razorpay) {
        toast.error("Razorpay SDK not loaded. Please refresh the page.");
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", async (response: any) => {
        await markPaymentFailed(resumeId, orderId, response.error?.description || "Payment failed");
        dispatch(paymentFailed(response.error?.description || "Payment failed"));
        toast.error("Payment failed. Please try again.");
      });
      rzp.open();
    } catch (err) {
      toast.error("Could not initiate payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadDirect = () => {
    if (!generatedPdf) return;
    const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";
    const fullUrl = generatedPdf.startsWith("http") ? generatedPdf : `${backendBase}${generatedPdf}`;
    window.open(fullUrl, "_blank");
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
        {/* Step indicator */}
        <div className="flex items-center justify-between text-xs font-medium text-gray-500 pb-3 border-b">
          <span className={`flex items-center gap-1 ${otpStep === "verified" ? "text-green-600 font-bold" : "text-blue-600 font-bold"}`}>
            <span className="w-5 h-5 rounded-full flex items-center justify-center bg-blue-100 text-blue-700">1</span>
            Email OTP Verification
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
          <span className={`flex items-center gap-1 ${paymentStep === "paid" ? "text-green-600 font-bold" : otpStep === "verified" ? "text-blue-600 font-bold" : ""}`}>
            <span className="w-5 h-5 rounded-full flex items-center justify-center bg-gray-200 text-gray-700">2</span>
            ₹50 Razorpay Fee
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
          <span className={`flex items-center gap-1 ${paymentStep === "paid" ? "text-green-600 font-bold" : ""}`}>
            <span className="w-5 h-5 rounded-full flex items-center justify-center bg-gray-200 text-gray-700">3</span>
            Download PDF
          </span>
        </div>

        {/* Step 1: OTP Idle */}
        {otpStep === "idle" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              For security, an OTP will be sent to your registered email before enabling the payment gateway.
            </p>
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <Mail className="w-4 h-4" />
              {loading ? "Sending OTP..." : "Send Verification OTP"}
            </button>
          </div>
        )}

        {/* Step 1: OTP Sent */}
        {otpStep === "sent" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-800">
              Enter the 6-digit verification code sent to <strong className="text-blue-600">{maskedEmail || userEmail}</strong>:
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                placeholder="6-digit code"
                className="w-36 border border-gray-300 rounded-lg px-3 py-2 text-center text-lg tracking-widest font-mono text-gray-900 focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleVerifyOtp}
                disabled={otpValue.length !== 6 || loading}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 p-2"
              >
                <RefreshCw className="w-3 h-3" /> Resend
              </button>
            </div>
            <p className="text-xs text-gray-500">OTP is valid for 10 minutes. Max 5 verification attempts.</p>
          </div>
        )}

        {/* Step 2: OTP Verified, Ready to Pay */}
        {otpStep === "verified" && paymentStep !== "paid" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <ShieldCheck className="w-4 h-4" /> Identity Verified via Email OTP
            </div>
            <p className="text-sm text-gray-700">
              Click below to initiate the ₹50 transaction via Razorpay. Your ATS resume PDF will be generated immediately upon successful verification.
            </p>
            <button
              onClick={handlePay}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm shadow transition-colors disabled:opacity-50"
            >
              {loading ? "Processing..." : "Pay ₹50 via Razorpay & Generate PDF"}
            </button>
          </div>
        )}

        {/* Step 3: Paid & Generated */}
        {paymentStep === "paid" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Resume Successfully Generated & Paid!
            </div>
            {invoiceNumber && (
              <p className="text-xs text-emerald-700">
                Official Invoice: <span className="font-mono font-bold">{invoiceNumber}</span> • ₹50 Paid
              </p>
            )}
            <p className="text-xs text-emerald-600">
              This resume is now saved to your profile and set as your default resume for internship applications.
            </p>
            {generatedPdf && (
              <button
                onClick={downloadDirect}
                className="mt-2 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg text-xs shadow"
              >
                <Download className="w-4 h-4" /> Download Resume PDF
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
