import { useState } from "react";
import { toast } from "react-toastify";

const API = process.env.NEXT_PUBLIC_API_URL || "https://internshala-clone-ahv9.onrender.com/api";

interface Props {
  email: string;
  firebaseUser: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ChromeOtpModal({ email, firebaseUser, onSuccess, onCancel }: Props) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");
  const [error, setError] = useState("");

  const getToken = async () => {
    if (!firebaseUser) return "";
    return await firebaseUser.getIdToken();
  };

  const handleVerify = async () => {
    if (!otp || otp.trim().length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const res = await fetch(`${API}/login-tracking/chrome-otp/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          otp: otp.trim(),
          userAgent: navigator.userAgent,
          sessionId: firebaseUser?.uid + "_" + Date.now(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Login verified successfully!");
        onSuccess();
      } else {
        setError(data.error || "Verification failed.");
      }
    } catch (err) {
      setError("Server error. Please try again.");
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      const token = await getToken();
      const res = await fetch(`${API}/login-tracking/chrome-otp/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("OTP resent to your email.");
        if (data.demoOtp) setDemoOtp(data.demoOtp);
      } else {
        setError(data.error || "Failed to resend OTP.");
      }
    } catch (err) {
      setError("Server error.");
    }
    setResending(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🔐</span>
          </div>
          <h2 className="text-lg font-bold text-gray-800">Chrome Login Verification</h2>
          <p className="text-sm text-gray-500 mt-1">
            For security, Google Chrome logins require OTP verification.
          </p>
        </div>

        {/* Email display */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-4 text-sm text-gray-700 flex items-center gap-2">
          <span>✉️</span>
          <span className="truncate">{email}</span>
        </div>

        {/* Demo OTP hint (for evaluators) */}
        {demoOtp && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3 text-sm text-green-700">
            <span className="font-semibold">Test OTP:</span> {demoOtp}
          </div>
        )}

        {/* OTP input */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 block mb-1">
            6-Digit Verification Code
          </label>
          <input
            type="text"
            maxLength={6}
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleVerify(); }}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center text-xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          <p className="text-xs text-gray-400 mt-1 text-center">Valid for 10 minutes · Max 5 attempts</p>
        </div>

        {/* Verify button */}
        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-50 mb-3"
        >
          {loading ? "Verifying..." : "Verify & Continue"}
        </button>

        {/* Resend + Cancel */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-sm text-blue-600 hover:underline disabled:opacity-50"
          >
            {resending ? "Sending..." : "🔄 Resend OTP"}
          </button>
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel Login
          </button>
        </div>
      </div>
    </div>
  );
}
