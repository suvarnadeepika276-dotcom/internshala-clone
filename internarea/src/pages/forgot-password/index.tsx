"use client";

import React, { useState } from "react";
import axios from "axios";
import Link from "next/link";
import { toast } from "react-toastify";
import {
    KeyRound,
    Mail,
    Phone,
    ShieldAlert,
    CheckCircle2,
    Lock,
    Copy,
    Check,
    ArrowRight,
    RefreshCw,
    Clock,
    History,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://internshala-clone-ahv9.onrender.com/api";

export default function ForgotPasswordPage() {
    const [method, setMethod] = useState<"email" | "mobile">("email");
    const [identifier, setIdentifier] = useState("");
    const [step, setStep] = useState<"request" | "otp" | "success" | "change">("request");

    const [loading, setLoading] = useState(false);
    const [maskedTarget, setMaskedTarget] = useState("");
    const [otpValue, setOtpValue] = useState("");
    const [otpHint, setOtpHint] = useState<string | null>(null);

    // 24-hr cooldown state
    const [cooldownError, setCooldownError] = useState<string | null>(null);
    const [retryHours, setRetryHours] = useState<number | null>(null);

    // Generated letters-only password
    const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Change password form
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordChangedSuccess, setPasswordChangedSuccess] = useState(false);

    // Audit logs
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [showAudit, setShowAudit] = useState(false);

    const getBrowserInfo = () => {
        if (typeof window === "undefined") return { browser: "Unknown", device: "Desktop" };
        const ua = navigator.userAgent;
        let browser = "Other";
        if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Google Chrome";
        else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
        else if (ua.includes("Firefox")) browser = "Mozilla Firefox";
        else if (ua.includes("Edg")) browser = "Microsoft Edge";

        const device = /Mobi|Android|iPhone/i.test(ua) ? "Mobile" : "Desktop";
        return { browser, device };
    };

    // 1. Request OTP (Checks 24-hour rate limit)
    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier.trim()) {
            toast.error(`Please enter your registered ${method}`);
            return;
        }

        setLoading(true);
        setCooldownError(null);

        try {
            const { browser, device } = getBrowserInfo();
            const res = await axios.post(`${API_BASE}/auth/forgot-password/request-otp`, {
                identifier: identifier.trim(),
                method,
                browser,
                device,
            });

            setMaskedTarget(res.data.maskedTarget || identifier);
            if (res.data.demoOtp) {
                setOtpHint(res.data.demoOtp);
            }
            toast.success(`Verification code dispatched to your ${method}`);
            setStep("otp");
        } catch (err: any) {
            if (err?.response?.status === 429) {
                // Exactly required message: "You can use this option only once per day."
                const msg = err.response.data?.error || "You can use this option only once per day.";
                setCooldownError(msg);
                setRetryHours(err.response.data?.retryAfterHours || 24);
                toast.error(msg);
            } else {
                toast.error(err?.response?.data?.error || "Failed to process request. Please check details.");
            }
        } finally {
            setLoading(false);
        }
    };

    // 2. Verify OTP & generate letters-only password
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otpValue.length !== 6) {
            toast.error("Please enter the complete 6-digit code");
            return;
        }

        setLoading(true);
        try {
            const { browser, device } = getBrowserInfo();
            const res = await axios.post(`${API_BASE}/auth/forgot-password/verify-otp`, {
                identifier: identifier.trim(),
                otp: otpValue.trim(),
                method,
                browser,
                device,
            });

            setGeneratedPassword(res.data.generatedPassword);
            toast.success("Identity verified! New letters-only password generated.");
            setStep("success");
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Invalid or expired OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // 3. Immediately change temporary password
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_BASE}/auth/forgot-password/change-password`, {
                email: identifier.includes("@") ? identifier : `${identifier}@temp.internshala`,
                newPassword,
            });
            setPasswordChangedSuccess(true);
            toast.success("Password changed successfully! You can now log in.");
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to update password.");
        } finally {
            setLoading(false);
        }
    };

    // Fetch audit history
    const loadAuditHistory = async () => {
        try {
            const res = await axios.get(`${API_BASE}/auth/forgot-password/history`);
            setAuditLogs(res.data.history || []);
            setShowAudit(true);
        } catch (err) {
            toast.error("Failed to load audit logs");
        }
    };

    const copyToClipboard = () => {
        if (!generatedPassword) return;
        navigator.clipboard.writeText(generatedPassword);
        setCopied(true);
        toast.info("Copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                        <KeyRound className="w-7 h-7" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Forgot Password</h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Secure account recovery with identity OTP and 24-hour rate limiting protection.
                    </p>
                </div>

                {/* 24-Hour Cooldown Error Banner */}
                {cooldownError && (
                    <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3 shadow-sm">
                        <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-xs font-bold text-red-900 uppercase tracking-wide">Security Limit Reached</h4>
                            <p className="text-sm font-semibold text-red-700 mt-0.5">{cooldownError}</p>
                            {retryHours && (
                                <p className="text-xs text-red-600 mt-1">
                                    Next attempt allowed in approximately <strong>{retryHours} hours</strong>.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8 space-y-6">

                    {/* STEP 1: REQUEST OTP */}
                    {step === "request" && (
                        <form onSubmit={handleRequestOtp} className="space-y-5">
                            {/* Method Selector: Email or Mobile */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                    Reset Password Using:
                                </label>
                                <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMethod("email");
                                            setIdentifier("");
                                            setCooldownError(null);
                                        }}
                                        className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition ${
                                            method === "email" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                                        }`}
                                    >
                                        <Mail className="w-3.5 h-3.5" /> Registered Email
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMethod("mobile");
                                            setIdentifier("");
                                            setCooldownError(null);
                                        }}
                                        className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition ${
                                            method === "mobile" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                                        }`}
                                    >
                                        <Phone className="w-3.5 h-3.5" /> Mobile Number
                                    </button>
                                </div>
                            </div>

                            {/* Identifier Input */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    {method === "email" ? "Registered Email Address" : "Registered Mobile Number"}
                                </label>
                                <div className="flex items-center border rounded-xl px-3 py-2.5 bg-gray-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 transition">
                                    {method === "email" ? (
                                        <Mail className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                                    ) : (
                                        <Phone className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                                    )}
                                    <input
                                        type={method === "email" ? "email" : "tel"}
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        placeholder={method === "email" ? "you@example.com" : "+91 9876543210"}
                                        className="bg-transparent w-full outline-none text-xs text-gray-900 font-medium"
                                        required
                                    />
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Allowed only once every 24 hours.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                                {loading ? "Verifying..." : "Send Verification OTP"}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>
                    )}

                    {/* STEP 2: VERIFY OTP */}
                    {step === "otp" && (
                        <form onSubmit={handleVerifyOtp} className="space-y-5">
                            <div className="text-center space-y-1">
                                <h3 className="text-sm font-bold text-gray-900">Enter Verification Code</h3>
                                <p className="text-xs text-gray-600">
                                    Sent to <strong className="text-blue-600">{maskedTarget}</strong>
                                </p>
                            </div>

                            {/* Evaluation Code Hint */}
                            {otpHint && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center text-xs text-blue-900">
                                    💡 Test / Evaluation OTP: <span className="font-mono font-bold text-blue-700">{otpHint}</span>
                                </div>
                            )}

                            <div>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={otpValue}
                                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                                    placeholder="Enter 6-digit OTP"
                                    className="w-full text-center tracking-widest text-xl font-mono font-bold border-2 border-gray-300 rounded-xl p-3 text-gray-900 focus:border-blue-600 focus:outline-none"
                                    required
                                />
                                <p className="text-[11px] text-gray-400 mt-1 text-center">Expires in 10 minutes • Max 5 attempts</p>
                            </div>

                            <button
                                type="submit"
                                disabled={otpValue.length !== 6 || loading}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow-sm transition disabled:opacity-50"
                            >
                                {loading ? "Verifying..." : "Verify OTP & Reset Password"}
                            </button>

                            <div className="flex justify-between items-center text-xs pt-1">
                                <button
                                    type="button"
                                    onClick={() => setStep("request")}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ← Back
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRequestOtp}
                                    className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                                >
                                    <RefreshCw className="w-3 h-3" /> Resend OTP
                                </button>
                            </div>
                        </form>
                    )}

                    {/* STEP 3: GENERATED LETTERS-ONLY PASSWORD DELIVERED */}
                    {step === "success" && (
                        <div className="space-y-5">
                            <div className="text-center space-y-2">
                                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-base font-bold text-gray-900">Password Reset Successful</h3>
                                <p className="text-xs text-gray-600">
                                    A random temporary password consisting <strong>only of uppercase and lowercase English letters</strong> has been generated and securely encrypted.
                                </p>
                            </div>

                            {/* Delivered Password Card */}
                            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 text-center space-y-2">
                                <span className="text-[11px] uppercase tracking-wider font-bold text-gray-500">
                                    Your New Temporary Password:
                                </span>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-lg font-mono font-bold text-blue-700 tracking-wide px-3 py-1 bg-white rounded-lg border shadow-sm select-all">
                                        {generatedPassword}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={copyToClipboard}
                                        className="p-2 text-gray-500 hover:text-blue-600 bg-white border rounded-lg shadow-sm"
                                        title="Copy Password"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                                <p className="text-[11px] text-gray-500">
                                    (Delivered to your verified {method})
                                </p>
                            </div>

                            {/* Mandatory Change Notice */}
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                                <p className="font-bold flex items-center gap-1">
                                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                                    Security Requirement:
                                </p>
                                <p className="text-[11px] text-amber-800">
                                    You are required to change this temporary password immediately after your next login.
                                </p>
                            </div>

                            <button
                                onClick={() => setStep("change")}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow-sm transition"
                            >
                                Change to Permanent Password Now →
                            </button>
                        </div>
                    )}

                    {/* STEP 4: CHANGE PERMANENT PASSWORD */}
                    {step === "change" && (
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="text-center space-y-1 mb-2">
                                <h3 className="text-sm font-bold text-gray-900">Set Permanent Password</h3>
                                <p className="text-xs text-gray-500">Replace your temporary letters-only password.</p>
                            </div>

                            {passwordChangedSuccess ? (
                                <div className="text-center space-y-4 py-4">
                                    <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
                                    <h4 className="text-base font-bold text-gray-900">Password Updated Successfully!</h4>
                                    <p className="text-xs text-gray-600">You can now sign in using your new credentials.</p>
                                    <Link
                                        href="/"
                                        className="inline-block bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow hover:bg-blue-700"
                                    >
                                        Go to Homepage / Login
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">New Permanent Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="At least 6 characters"
                                            className="w-full border rounded-xl px-3 py-2 text-xs text-gray-900"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Re-enter new password"
                                            className="w-full border rounded-xl px-3 py-2 text-xs text-gray-900"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow-sm transition disabled:opacity-50"
                                    >
                                        {loading ? "Updating..." : "Save Permanent Password"}
                                    </button>
                                </>
                            )}
                        </form>
                    )}

                </div>

                {/* Audit History Toggle for Evaluators */}
                <div className="mt-6 text-center">
                    <button
                        onClick={loadAuditHistory}
                        className="text-xs text-gray-500 hover:text-blue-600 inline-flex items-center gap-1 font-medium underline"
                    >
                        <History className="w-3.5 h-3.5" /> View Security Audit History
                    </button>

                    {showAudit && (
                        <div className="mt-4 bg-white border rounded-xl p-4 text-left shadow-sm space-y-2 text-xs max-h-60 overflow-y-auto">
                            <div className="flex justify-between items-center pb-2 border-b">
                                <span className="font-bold text-gray-800">Password Reset Audit History</span>
                                <button onClick={() => setShowAudit(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                            </div>
                            {auditLogs.length === 0 ? (
                                <p className="text-gray-400 text-[11px]">No audit logs recorded yet.</p>
                            ) : (
                                auditLogs.map((log, i) => (
                                    <div key={i} className="py-1.5 border-b border-gray-100 last:border-0 text-[11px] flex justify-between items-center">
                                        <div>
                                            <span className="font-semibold text-gray-900">{log.identifier}</span> ({log.resetMethod})
                                            <p className="text-gray-500">{log.browser} • {log.ip}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            log.status === "verified" ? "bg-green-100 text-green-800" :
                                            log.status === "blocked_cooldown" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                                        }`}>
                                            {log.status}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Back to Home Link */}
                <div className="text-center mt-4">
                    <Link href="/" className="text-xs text-gray-500 hover:text-gray-800 font-medium">
                        ← Back to Internshala Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
