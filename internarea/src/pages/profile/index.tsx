import { selectuser } from "@/Feature/Userslice";
import { ExternalLink, Mail, User, Monitor, Smartphone, Tablet, Clock, Shield, LogOut } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { auth } from "@/firebase/firebase";
import { toast } from "react-toastify";

const API = process.env.NEXT_PUBLIC_API_URL || "https://internshala-clone-ahv9.onrender.com/api";

interface LoginRecord {
  _id: string;
  browser: string;
  browserVersion: string;
  os: string;
  deviceType: string;
  deviceModel: string;
  publicIp: string;
  loginTime: string;
  status: string;
  isNewDevice: boolean;
  isTrusted: boolean;
  blockedReason: string;
}

const ProfilePage = () => {
  const user = useSelector(selectuser);
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<"history" | "sessions">("history");
  const [sessions, setSessions] = useState<LoginRecord[]>([]);

  const getToken = async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return "";
    return await firebaseUser.getIdToken();
  };

  const fetchLoginHistory = async () => {
    setLoadingHistory(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/login-tracking/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLoginHistory(data.history || []);
      }
    } catch (err) {
      toast.error("Could not load login history");
    }
    setLoadingHistory(false);
  };

  const fetchSessions = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/login-tracking/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {}
  };

  const handleSignOutSession = async (sessionId: string) => {
    if (!confirm("Sign out from this session?")) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API}/login-tracking/sessions/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Session removed");
        fetchSessions();
      }
    } catch (err) {
      toast.error("Failed to remove session");
    }
  };

  const handleTrustDevice = async (sessionId: string) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/login-tracking/trust-device`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        toast.success("Device marked as trusted");
        fetchSessions();
      }
    } catch (err) {}
  };

  useEffect(() => {
    if (showHistory && user) {
      fetchLoginHistory();
      fetchSessions();
    }
  }, [showHistory, user]);

  const getDeviceIcon = (deviceType: string) => {
    if (deviceType === "mobile") return <Smartphone className="w-4 h-4" />;
    if (deviceType === "tablet") return <Tablet className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      success: "bg-green-100 text-green-700",
      blocked_time: "bg-red-100 text-red-700",
      blocked_otp: "bg-orange-100 text-orange-700",
      failed: "bg-gray-100 text-gray-600",
    };
    const labels: { [key: string]: string } = {
      success: "✓ Success",
      blocked_time: "⛔ Time Blocked",
      blocked_otp: "⛔ OTP Failed",
      failed: "✗ Failed",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || "bg-gray-100 text-gray-600"}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="relative h-32 bg-gradient-to-r from-blue-500 to-blue-600">
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
              {user?.photo ? (
                <img
                  src={user?.photo}
                  alt={user?.name}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="pt-16 pb-8 px-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
              <div className="mt-2 flex items-center justify-center text-gray-500">
                <Mail className="h-4 w-4 mr-2" />
                <span>{user?.email}</span>
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <span className="text-blue-600 font-semibold text-2xl">0</span>
                  <p className="text-blue-600 text-sm mt-1">Active Applications</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <span className="text-green-600 font-semibold text-2xl">0</span>
                  <p className="text-green-600 text-sm mt-1">Accepted Applications</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-center pt-2">
                <Link
                  href="/userapplication"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  View Applications
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </div>

              {/* ── LOGIN HISTORY SECTION ── */}
              <div className="border-t pt-6">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-800">Login History & Active Sessions</span>
                  </div>
                  <span className="text-gray-400 text-sm">{showHistory ? "▲ Hide" : "▼ Show"}</span>
                </button>

                {showHistory && (
                  <div className="mt-4">
                    {/* Sub-tabs */}
                    <div className="flex gap-2 mb-4 border-b">
                      <button
                        onClick={() => setActiveTab("history")}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "history" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
                      >
                        📋 Login History
                      </button>
                      <button
                        onClick={() => setActiveTab("sessions")}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "sessions" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
                      >
                        💻 Active Sessions
                      </button>
                    </div>

                    {/* LOGIN HISTORY TAB */}
                    {activeTab === "history" && (
                      <>
                        {loadingHistory ? (
                          <div className="text-center py-6 text-gray-400">Loading...</div>
                        ) : loginHistory.length === 0 ? (
                          <div className="text-center py-6 text-gray-400 text-sm">No login history found.</div>
                        ) : (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {loginHistory.map((record) => (
                              <div
                                key={record._id}
                                className={`border rounded-xl p-3 ${record.status === "success" ? "border-gray-200" : "border-red-100 bg-red-50"}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`p-1.5 rounded-lg ${record.status === "success" ? "bg-blue-50 text-blue-600" : "bg-red-100 text-red-500"}`}>
                                      {getDeviceIcon(record.deviceType)}
                                    </span>
                                    <div>
                                      <p className="text-sm font-medium text-gray-800">
                                        {record.browser} {record.browserVersion && `${record.browserVersion}`}
                                        {record.isNewDevice && (
                                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">New Device</span>
                                        )}
                                        {record.isTrusted && (
                                          <span className="ml-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Trusted</span>
                                        )}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {record.os} · {record.deviceType}
                                        {record.deviceModel ? ` (${record.deviceModel})` : ""}
                                      </p>
                                      <p className="text-xs text-gray-400">IP: {record.publicIp || "N/A"}</p>
                                      {record.blockedReason && (
                                        <p className="text-xs text-red-500 mt-1">{record.blockedReason}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    {getStatusBadge(record.status)}
                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 justify-end">
                                      <Clock className="w-3 h-3" />
                                      {formatTime(record.loginTime)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {/* ACTIVE SESSIONS TAB */}
                    {activeTab === "sessions" && (
                      <>
                        {sessions.length === 0 ? (
                          <div className="text-center py-6 text-gray-400 text-sm">No active sessions found.</div>
                        ) : (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {sessions.map((session) => (
                              <div key={session._id} className="border border-gray-200 rounded-xl p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                                      {getDeviceIcon(session.deviceType)}
                                    </span>
                                    <div>
                                      <p className="text-sm font-medium text-gray-800">
                                        {session.browser} on {session.os}
                                        {session.isTrusted && (
                                          <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Trusted</span>
                                        )}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {session.deviceModel || session.deviceType} · IP: {session.publicIp || "N/A"}
                                      </p>
                                      <p className="text-xs text-gray-400">{formatTime(session.loginTime)}</p>
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    {!session.isTrusted && (
                                      <button
                                        onClick={() => handleTrustDevice(session._id)}
                                        className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                                      >
                                        Trust
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleSignOutSession(session._id)}
                                      className="text-xs px-2 py-1 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 flex items-center gap-1"
                                    >
                                      <LogOut className="w-3 h-3" /> Sign Out
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              {/* ── END LOGIN HISTORY ── */}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
