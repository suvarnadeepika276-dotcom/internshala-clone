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


declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentOtpFlow({ resumeId, userEmail }: { resumeId: string; userEmail: string }) {
  const dispatch = useDispatch();
  const { otpStep, maskedEmail, paymentStep } = useSelector((s: any) => s.resumeBuilder);
  const [otpValue, setOtpValue] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const { maskedEmail } = await requestOtp(resumeId);
      dispatch(otpSent(maskedEmail));
      toast.success("OTP sent to your email");
    } catch (err: any) {
      const data = err?.response?.data;
      if (err?.response?.status === 429) {
        toast.error(`Too many requests. Try again in ${data.retryAfterMinutes} minutes.`);
      } else if (err?.response?.status === 400) {
        toast.error(data.error || "Please complete your resume first.");
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
      toast.success("Email verified");
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      if (status === 410) toast.error("OTP expired. Please request a new one.");
      else if (status === 429) toast.error("Too many failed attempts. Request a new OTP.");
      else if (status === 400) toast.error(`Invalid OTP. ${data.attemptsLeft} attempts left.`);
      else toast.error("Verification failed. Check your connection and try again.");
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
        key: keyId,
        amount: amount * 100,
        currency: "INR",
        name: "InternArea",
        description: "Resume PDF generation",
        order_id: orderId,
        handler: async (response: any) => {
          try {
            await verifyPayment({
              resumeId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            dispatch(paymentSucceeded());
            toast.success("Payment verified! Your resume is being generated.");
          } catch (err) {
            dispatch(paymentFailed("Payment verification failed"));
            toast.error("Payment verification failed. Contact support if money was deducted.");
          }
        },
        modal: {
          // fires if the user closes the checkout without paying
          ondismiss: async () => {
            await markPaymentFailed(resumeId, orderId, "Cancelled by user");
            dispatch(paymentFailed("Payment cancelled"));
            toast.info("Payment cancelled.");
          },
        },
        prefill: { email: userEmail },
        theme: { color: "#1a73e8" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", async (response: any) => {
        await markPaymentFailed(resumeId, orderId, response.error?.description || "Payment failed");
        dispatch(paymentFailed(response.error?.description || "Payment failed"));
        toast.error("Payment failed. Please try again.");
      });
      rzp.open();
    } catch (err) {
      toast.error("Could not start payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Loads Razorpay's checkout script - no npm package needed for this part */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="payment-otp-flow">
        {otpStep === "idle" && (
          <button
            onClick={handleSendOtp}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Send verification code
          </button>
        )}

        {otpStep === "sent" && (
          <div>
            <p className="text-gray-900 mb-2">Code sent to {maskedEmail}</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 6-digit code"
              className="border rounded px-3 py-2 text-gray-900 mr-2 mb-2"
            />
            <div className="flex gap-2">
              <button
                onClick={handleVerifyOtp}
                disabled={otpValue.length !== 6 || loading}
                className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                Verify
              </button>
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="text-blue-600 underline px-2 py-2 disabled:opacity-50"
              >
                Resend code
              </button>
            </div>
          </div>
        )}

        {otpStep === "verified" && paymentStep !== "paid" && (
          <button
            onClick={handlePay}
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Pay ₹50 & Generate Resume
          </button>
        )}

        {paymentStep === "paid" && (
          <p className="text-green-700 font-medium">
            ✅ Payment successful — your resume is ready to download.
          </p>
        )}
      </div>
    </>
  );
}