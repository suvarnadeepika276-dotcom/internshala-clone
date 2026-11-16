"use client";

import React, { useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { ShieldCheck, X, RefreshCw, Mail } from "lucide-react";

export default function FrenchOtpModal() {
    const {
        isOtpModalOpen,
        closeOtpModal,
        pendingFrenchEmail,
        setPendingFrenchEmail,
        handleVerifyFrenchOtp,
        handleResendFrenchOtp,
    } = useLanguage();

    const [otp, setOtp] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (!isOtpModalOpen) return null;

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) return;
        setSubmitting(true);
        const ok = await handleVerifyFrenchOtp(otp);
        setSubmitting(false);
        if (ok) setOtp("");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-150">
                <button
                    onClick={closeOtpModal}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center space-y-2 mb-5">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Security Verification Required</h3>
                    <p className="text-xs text-gray-500">
                        Platform security requires a One-Time Password (OTP) before changing the website language to <strong>French (Français)</strong>.
                    </p>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    {/* Email display / entry */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Registered Email Address</label>
                        <div className="flex items-center border rounded-lg px-3 py-2 bg-gray-50 text-gray-800 text-xs">
                            <Mail className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                            <input
                                type="email"
                                value={pendingFrenchEmail}
                                onChange={(e) => setPendingFrenchEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="bg-transparent w-full outline-none text-xs text-gray-900"
                                required
                            />
                        </div>
                    </div>

                    {/* OTP input */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">6-Digit Verification Code</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                            placeholder="Enter 6-digit OTP"
                            className="w-full text-center tracking-widest text-lg font-mono font-bold border-2 border-gray-300 rounded-lg p-2.5 text-gray-900 focus:border-blue-600 focus:outline-none"
                            required
                        />
                        <p className="text-[11px] text-gray-400 mt-1 text-center">Valid for 10 minutes (Max 5 attempts)</p>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2 pt-2">
                        <button
                            type="submit"
                            disabled={otp.length !== 6 || submitting}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-xs shadow transition-colors disabled:opacity-50"
                        >
                            {submitting ? "Verifying OTP..." : "Verify & Switch to French"}
                        </button>

                        <div className="flex justify-between items-center pt-2 text-xs">
                            <button
                                type="button"
                                onClick={handleResendFrenchOtp}
                                className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                            >
                                <RefreshCw className="w-3 h-3" /> Resend OTP
                            </button>
                            <button
                                type="button"
                                onClick={closeOtpModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
