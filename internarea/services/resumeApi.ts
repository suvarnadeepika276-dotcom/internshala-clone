import axios from "axios";
import { getAuth } from "firebase/auth";
import { Resume } from "../types/resume";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://internshala-clone-ahv9.onrender.com/api";

// Attaches the current Firebase ID token to every request,
// matching the requireAuth middleware on the backend.
async function authHeader() {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export async function saveDraft(resume: Partial<Resume> & { resumeId?: string }) {
  const headers = await authHeader();
  const res = await axios.post(`${API_BASE}/resume/draft`, resume, { headers });
  return res.data.resume as Resume;
}

export async function listResumes() {
  const headers = await authHeader();
  const res = await axios.get(`${API_BASE}/resume`, { headers });
  return res.data.resumes as Resume[];
}

export async function setDefaultResume(resumeId: string) {
  const headers = await authHeader();
  await axios.patch(`${API_BASE}/resume/${resumeId}/default`, {}, { headers });
}

export async function requestOtp(resumeId: string) {
  const headers = await authHeader();
  const res = await axios.post(`${API_BASE}/resume/otp/request`, { resumeId }, { headers });
  return res.data as { maskedEmail: string };
}

export async function verifyOtp(resumeId: string, otp: string) {
  const headers = await authHeader();
  const res = await axios.post(`${API_BASE}/resume/otp/verify`, { resumeId, otp }, { headers });
  return res.data;
}

export async function createPaymentOrder(resumeId: string) {
  const headers = await authHeader();
  const res = await axios.post(`${API_BASE}/resume/payment/order`, { resumeId }, { headers });
  return res.data as { orderId: string; amount: number; keyId: string };
}

export async function verifyPayment(payload: {
  resumeId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const headers = await authHeader();
  const res = await axios.post(`${API_BASE}/resume/payment/verify`, payload, { headers });
  return res.data;
}

export async function markPaymentFailed(resumeId: string, razorpayOrderId: string, reason: string) {
  const headers = await authHeader();
  await axios.post(`${API_BASE}/resume/payment/failed`, { resumeId, razorpayOrderId, reason }, { headers });
}

export async function getHistory() {
  const headers = await authHeader();
  const res = await axios.get(`${API_BASE}/resume/history`, { headers });
  return res.data;
}

export async function getUserStatus() {
  const headers = await authHeader();
  const res = await axios.get(`${API_BASE}/resume/status`, { headers });
  return res.data as { isPremium: boolean; user: any };
}

export async function activateTestPremium() {
  const headers = await authHeader();
  const res = await axios.post(`${API_BASE}/resume/activate-premium`, {}, { headers });
  return res.data as { success: boolean; isPremium: boolean };
}

export async function deleteResume(resumeId: string) {
  const headers = await authHeader();
  const res = await axios.delete(`${API_BASE}/resume/${resumeId}`, { headers });
  return res.data;
}

export async function downloadResume(resumeId: string) {
  const headers = await authHeader();
  const res = await axios.get(`${API_BASE}/resume/${resumeId}/download`, { headers });
  return res.data as { pdfUrl: string };
}