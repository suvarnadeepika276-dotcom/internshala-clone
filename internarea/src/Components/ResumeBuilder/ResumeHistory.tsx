"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getHistory, downloadResume, setDefaultResume, deleteResume } from "../../../services/resumeApi";
import { Resume, ResumePayment } from "../../../types/resume";
import { Download, FileText, CheckCircle, Trash2, ShieldCheck } from "lucide-react";

interface Props {
  onSelectResume?: (resume: Resume) => void;
  onRefresh?: () => void;
}

export default function ResumeHistory({ onSelectResume, onRefresh }: Props) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [payments, setPayments] = useState<ResumePayment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getHistory();
      setResumes(data.resumes || []);
      setPayments(data.payments || []);
    } catch (err) {
      console.error(err);
      toast.error("Could not load resume history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSetDefault = async (resumeId: string) => {
    try {
      await setDefaultResume(resumeId);
      toast.success("Set as default resume for applications!");
      loadData();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Failed to update default resume");
    }
  };

  const handleDownload = async (resumeId: string, pdfUrl?: string) => {
    try {
      const { pdfUrl: fileUrl } = await downloadResume(resumeId);
      const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";
      const fullUrl = fileUrl?.startsWith("http") ? fileUrl : `${backendBase}${fileUrl}`;
      window.open(fullUrl, "_blank");
    } catch (err) {
      toast.error("Could not download resume. Ensure payment was completed.");
    }
  };

  const handleDelete = async (resumeId: string) => {
    if (!confirm("Are you sure you want to delete this resume version?")) return;
    try {
      await deleteResume(resumeId);
      toast.success("Resume deleted");
      loadData();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Failed to delete resume");
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-2"></div>
        <p>Loading history & invoices...</p>
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-dashed p-8">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <h3 className="text-base font-semibold text-gray-900">No resumes generated yet</h3>
        <p className="text-sm text-gray-500 mt-1">Create your first resume draft and generate it to see invoices and download history here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Resume Versions & Generation History</h2>
            <p className="text-xs text-gray-500">All your saved resume versions, ATS templates, and official invoices</p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full">
            {resumes.length} {resumes.length === 1 ? "Version" : "Versions"}
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {resumes.map((resume) => {
            const isPaid = resume.paymentStatus === "paid";
            const matchingPayment = payments.find((p) => String(p.resumeId) === String(resume._id));

            return (
              <div key={resume._id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-base">{resume.versionName || "Resume Version"}</span>
                    {resume.isDefault && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Default for Applications
                      </span>
                    )}
                    <span className="text-[11px] font-medium px-2 py-0.5 bg-gray-100 text-gray-700 rounded capitalize">
                      {resume.templateId?.replace("-", " ") || "Classic ATS"}
                    </span>
                    {isPaid ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Paid & Verified
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                        Draft (Unpaid)
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500">
                    Candidate: <span className="text-gray-700 font-medium">{resume.fullName || "—"}</span> • Email: <span className="text-gray-700 font-medium">{resume.email || "—"}</span>
                  </p>

                  {matchingPayment?.invoiceNumber && (
                    <div className="text-xs text-gray-600 flex items-center gap-2 mt-1">
                      <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
                        Invoice #{matchingPayment.invoiceNumber}
                      </span>
                      <span>Amount: ₹{matchingPayment.amount}</span>
                      <span>• {new Date(matchingPayment.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {onSelectResume && (
                    <button
                      onClick={() => onSelectResume(resume)}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
                    >
                      Edit Version
                    </button>
                  )}

                  {isPaid ? (
                    <>
                      <button
                        onClick={() => handleDownload(resume._id!, resume.pdfUrl)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                      >
                        <Download className="w-3.5 h-3.5" /> Download PDF
                      </button>

                      {!resume.isDefault && (
                        <button
                          onClick={() => handleSetDefault(resume._id!)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Make Default
                        </button>
                      )}
                    </>
                  ) : null}

                  <button
                    onClick={() => handleDelete(resume._id!)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                    title="Delete Version"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
