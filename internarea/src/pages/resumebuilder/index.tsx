"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  saveDraft,
  listResumes,
  getUserStatus,
  activateTestPremium,
} from "../../../services/resumeApi";
import { updateDraftField, setDraft, resetBuilder } from "../../../redux/resumeSlice";
import { Resume, Education, Experience, ResumeProject, Certification, ResumeReference } from "../../../types/resume";
import PaymentOtpFlow from "../../Components/ResumeBuilder/PaymentOtpFlow";
import ResumePreview from "../../Components/ResumeBuilder/ResumePreview";
import ResumeHistory from "../../Components/ResumeBuilder/ResumeHistory";
import {
  FileText,
  Eye,
  History,
  Plus,
  Trash2,
  Save,
  Palette,
  Sparkles,
  Layers,
  Crown,
  Check,
} from "lucide-react";

const TEMPLATES = [
  { id: "classic-ats", name: "Classic ATS", description: "Standard single-column, line dividers. High compatibility." },
  { id: "modern-ats", name: "Modern Accent", description: "Bold accent bar, clean pills for skills & modern hierarchy." },
  { id: "minimal-ats", name: "Minimalist", description: "Spacious, crisp typography, clean whitespace." },
];

const COLORS = [
  { name: "Corporate Blue", hex: "#1a73e8" },
  { name: "Forest Emerald", hex: "#059669" },
  { name: "Deep Navy", hex: "#1e3a8a" },
  { name: "Charcoal Slate", hex: "#334155" },
  { name: "Burgundy", hex: "#991b1b" },
  { name: "Purple", hex: "#7c3aed" },
];

const FONTS = [
  { id: "Helvetica", name: "Helvetica (Clean Sans-Serif)" },
  { id: "Times-Roman", name: "Times New Roman (Formal Serif)" },
  { id: "Courier", name: "Courier (Tech Monospace)" },
];

export default function ResumeBuilderPage() {
  const dispatch = useDispatch();
  const draft = useSelector((s: any) => s.resumeBuilder.draft);

  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "history">("edit");
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [savedResumes, setSavedResumes] = useState<Resume[]>([]);
  const [isPremium, setIsPremium] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Comma-separated field inputs
  const [skillsInput, setSkillsInput] = useState("");
  const [achievementsInput, setAchievementsInput] = useState("");
  const [languagesInput, setLanguagesInput] = useState("");

  // Array states for multi-item sections
  const [educationList, setEducationList] = useState<Education[]>([]);
  const [experienceList, setExperienceList] = useState<Experience[]>([]);
  const [internshipList, setInternshipList] = useState<Experience[]>([]);
  const [projectList, setProjectList] = useState<ResumeProject[]>([]);
  const [certificationList, setCertificationList] = useState<Certification[]>([]);
  const [referenceList, setReferenceList] = useState<ResumeReference[]>([]);

  // Social Links & Photo
  const [socialLinks, setSocialLinks] = useState({ linkedin: "", github: "", portfolio: "" });
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");

  // Check premium status and load existing versions
  const loadUserAndResumes = async () => {
    try {
      const status = await getUserStatus().catch(() => ({ isPremium: true }));
      setIsPremium(status?.isPremium ?? true);

      const list = await listResumes().catch(() => []);
      setSavedResumes(list || []);

      if (list && list.length > 0 && !resumeId) {
        populateResume(list[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    loadUserAndResumes();
  }, []);

  const populateResume = (res: Resume) => {
    setResumeId(res._id || null);
    dispatch(setDraft(res));
    setSkillsInput((res.skills || []).join(", "));
    setAchievementsInput((res.achievements || []).join(", "));
    setLanguagesInput((res.languages || []).join(", "));
    setEducationList(res.education || []);
    setExperienceList(res.experience || []);
    setInternshipList(res.internships || []);
    setProjectList(res.projects || []);
    setCertificationList(res.certifications || []);
    setReferenceList(res.references || []);
    setSocialLinks({
      linkedin: res.socialLinks?.linkedin || "",
      github: res.socialLinks?.github || "",
      portfolio: res.socialLinks?.portfolio || "",
    });
    setProfilePhotoUrl(res.profilePhotoUrl || "");
  };

  const handleStartNewVersion = () => {
    dispatch(resetBuilder());
    setResumeId(null);
    setSkillsInput("");
    setAchievementsInput("");
    setLanguagesInput("");
    setEducationList([]);
    setExperienceList([]);
    setInternshipList([]);
    setProjectList([]);
    setCertificationList([]);
    setReferenceList([]);
    setSocialLinks({ linkedin: "", github: "", portfolio: "" });
    setProfilePhotoUrl("");
    dispatch(updateDraftField({ field: "versionName", value: `Version ${savedResumes.length + 1}` }));
    toast.info("Created a new blank resume version.");
  };

  const handleFieldChange = (field: keyof Resume, value: any) => {
    dispatch(updateDraftField({ field, value }));
  };

  // Multi-item helper handlers
  const addEducation = () => {
    setEducationList([...educationList, { institution: "", degree: "", fieldOfStudy: "", startYear: "", endYear: "" }]);
  };
  const updateEducation = (index: number, key: keyof Education, val: string) => {
    const updated = [...educationList];
    updated[index] = { ...updated[index], [key]: val };
    setEducationList(updated);
  };
  const removeEducation = (index: number) => {
    setEducationList(educationList.filter((_, i) => i !== index));
  };

  const addExperience = () => {
    setExperienceList([...experienceList, { company: "", role: "", startDate: "", endDate: "", isCurrent: false, description: "" }]);
  };
  const updateExperience = (index: number, key: keyof Experience, val: any) => {
    const updated = [...experienceList];
    updated[index] = { ...updated[index], [key]: val };
    setExperienceList(updated);
  };
  const removeExperience = (index: number) => {
    setExperienceList(experienceList.filter((_, i) => i !== index));
  };

  const addInternship = () => {
    setInternshipList([...internshipList, { company: "", role: "", startDate: "", endDate: "", description: "" }]);
  };
  const updateInternship = (index: number, key: keyof Experience, val: any) => {
    const updated = [...internshipList];
    updated[index] = { ...updated[index], [key]: val };
    setInternshipList(updated);
  };
  const removeInternship = (index: number) => {
    setInternshipList(internshipList.filter((_, i) => i !== index));
  };

  const addProject = () => {
    setProjectList([...projectList, { title: "", description: "", techStack: [], link: "" }]);
  };
  const updateProject = (index: number, key: keyof ResumeProject, val: any) => {
    const updated = [...projectList];
    updated[index] = { ...updated[index], [key]: val };
    setProjectList(updated);
  };
  const removeProject = (index: number) => {
    setProjectList(projectList.filter((_, i) => i !== index));
  };

  const addCertification = () => {
    setCertificationList([...certificationList, { name: "", issuer: "", year: "" }]);
  };
  const updateCertification = (index: number, key: keyof Certification, val: string) => {
    const updated = [...certificationList];
    updated[index] = { ...updated[index], [key]: val };
    setCertificationList(updated);
  };
  const removeCertification = (index: number) => {
    setCertificationList(certificationList.filter((_, i) => i !== index));
  };

  const addReference = () => {
    setReferenceList([...referenceList, { name: "", relation: "", contact: "" }]);
  };
  const updateReference = (index: number, key: keyof ResumeReference, val: string) => {
    const updated = [...referenceList];
    updated[index] = { ...updated[index], [key]: val };
    setReferenceList(updated);
  };
  const removeReference = (index: number) => {
    setReferenceList(referenceList.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    if (!draft.fullName?.trim() || !draft.email?.trim()) {
      toast.error("Full Name and Email are required fields.");
      return;
    }
    setSaving(true);
    try {
      const skills = skillsInput.split(",").map((s) => s.trim()).filter(Boolean);
      const achievements = achievementsInput.split(",").map((s) => s.trim()).filter(Boolean);
      const languages = languagesInput.split(",").map((s) => s.trim()).filter(Boolean);

      const payload: any = {
        ...draft,
        skills,
        achievements,
        languages,
        education: educationList,
        experience: experienceList,
        internships: internshipList,
        projects: projectList,
        certifications: certificationList,
        references: referenceList,
        profilePhotoUrl,
        socialLinks,
        resumeId: resumeId || undefined,
      };

      const saved = await saveDraft(payload);
      setResumeId(saved._id || null);
      toast.success("Resume version saved successfully!");
      loadUserAndResumes();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Could not save draft. Please check fields.");
    } finally {
      setSaving(false);
    }
  };

  const handleActivatePremium = async () => {
    try {
      await activateTestPremium();
      setIsPremium(true);
      toast.success("Premium membership unlocked!");
      loadUserAndResumes();
    } catch (err) {
      toast.error("Could not activate test premium");
    }
  };

  // Composite object for live preview
  const currentPreviewData: Partial<Resume> = {
    ...draft,
    skills: skillsInput.split(",").map((s) => s.trim()).filter(Boolean),
    achievements: achievementsInput.split(",").map((s) => s.trim()).filter(Boolean),
    languages: languagesInput.split(",").map((s) => s.trim()).filter(Boolean),
    education: educationList,
    experience: experienceList,
    internships: internshipList,
    projects: projectList,
    certifications: certificationList,
    references: referenceList,
    profilePhotoUrl,
    socialLinks,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-blue-600" />
            Premium ATS Resume Builder
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Build ATS-compliant resumes with customizable templates, verified email OTP security, and Razorpay integration (₹50).
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
          <button
            onClick={() => setActiveTab("edit")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "edit" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FileText className="w-4 h-4" /> Editor
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "preview" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Eye className="w-4 h-4" /> Live Preview
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "history" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <History className="w-4 h-4" /> Invoices & History
          </button>
        </div>
      </div>

      {/* Premium Notification Banner if not premium */}
      {!isPremium && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Premium Membership Feature</p>
              <p className="text-xs text-amber-700">The Resume Builder is reserved for Premium users. Unlock now to access ATS templates and PDF generation.</p>
            </div>
          </div>
          <button
            onClick={handleActivatePremium}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow transition-colors flex-shrink-0"
          >
            Activate Premium Membership
          </button>
        </div>
      )}

      {/* VERSION MANAGER BANNER */}
      {activeTab !== "history" && (
        <div className="bg-white border rounded-xl p-4 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-gray-500" />
            <div>
              <span className="text-xs font-medium text-gray-500">Editing Version:</span>
              <input
                type="text"
                value={draft.versionName || "Version 1"}
                onChange={(e) => handleFieldChange("versionName", e.target.value)}
                placeholder="e.g. Software Engineer Resume"
                className="ml-2 font-semibold text-gray-900 border-b border-dashed border-gray-300 focus:border-blue-600 outline-none text-sm px-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {savedResumes.length > 0 && (
              <select
                value={resumeId || ""}
                onChange={(e) => {
                  const target = savedResumes.find((r) => r._id === e.target.value);
                  if (target) populateResume(target);
                }}
                className="text-xs border rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-800"
              >
                <option value="" disabled>Switch Saved Version</option>
                {savedResumes.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.versionName || "Untitled"} {r.isDefault ? "★ (Default)" : ""}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleStartNewVersion}
              className="text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> New Version
            </button>

            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save Draft"}
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: RESUME EDITOR */}
      {activeTab === "edit" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form: 7 cols on lg */}
          <div className="lg:col-span-7 space-y-6">

            {/* 1. Template & Style Selector */}
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Palette className="w-5 h-5 text-blue-600" />
                1. Choose ATS Template & Styling
              </h2>

              {/* Template Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TEMPLATES.map((t) => {
                  const isSelected = (draft.templateId || "classic-ats") === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleFieldChange("templateId", t.id)}
                      className={`cursor-pointer rounded-lg border-2 p-3 text-left transition-all ${
                        isSelected ? "border-blue-600 bg-blue-50/50" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-xs text-gray-900">{t.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                      </div>
                      <p className="text-[11px] text-gray-500 leading-tight">{t.description}</p>
                    </div>
                  );
                })}
              </div>

              {/* Theme Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Accent Color</label>
                <div className="flex flex-wrap items-center gap-3">
                  {COLORS.map((c) => {
                    const isSelected = (draft.themeColor || "#1a73e8") === c.hex;
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => handleFieldChange("themeColor", c.hex)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                          isSelected ? "scale-110 ring-2 ring-offset-2 ring-blue-500" : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font Family Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Font Family</label>
                <select
                  value={draft.fontFamily || "Helvetica"}
                  onChange={(e) => handleFieldChange("fontFamily", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-xs text-gray-800 bg-white"
                >
                  {FONTS.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Personal Information */}
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
              <h2 className="text-base font-bold text-gray-900">2. Personal Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={draft.fullName || ""}
                    onChange={(e) => handleFieldChange("fullName", e.target.value)}
                    placeholder="Rahul Sharma"
                    className="w-full border rounded-lg px-3 py-2 text-xs text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={draft.email || ""}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    placeholder="rahul@example.com"
                    className="w-full border rounded-lg px-3 py-2 text-xs text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={draft.phone || ""}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full border rounded-lg px-3 py-2 text-xs text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Location / Address</label>
                  <input
                    type="text"
                    value={draft.address || ""}
                    onChange={(e) => handleFieldChange("address", e.target.value)}
                    placeholder="Bangalore, India"
                    className="w-full border rounded-lg px-3 py-2 text-xs text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Profile Photo URL (Optional)</label>
                <input
                  type="url"
                  value={profilePhotoUrl}
                  onChange={(e) => setProfilePhotoUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full border rounded-lg px-3 py-2 text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Career Objective / Professional Summary</label>
                <textarea
                  rows={3}
                  value={draft.careerObjective || ""}
                  onChange={(e) => handleFieldChange("careerObjective", e.target.value)}
                  placeholder="Passionate computer science student looking for frontend/backend developer internships..."
                  className="w-full border rounded-lg px-3 py-2 text-xs text-gray-900"
                />
              </div>

              {/* Social Links */}
              <div className="pt-2 border-t">
                <label className="block text-xs font-semibold text-gray-700 mb-2">Social & Portfolio Links</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="LinkedIn Profile"
                    value={socialLinks.linkedin}
                    onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                    className="border rounded-lg px-3 py-2 text-xs text-gray-900"
                  />
                  <input
                    type="text"
                    placeholder="GitHub Profile"
                    value={socialLinks.github}
                    onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })}
                    className="border rounded-lg px-3 py-2 text-xs text-gray-900"
                  />
                  <input
                    type="text"
                    placeholder="Portfolio URL"
                    value={socialLinks.portfolio}
                    onChange={(e) => setSocialLinks({ ...socialLinks, portfolio: e.target.value })}
                    className="border rounded-lg px-3 py-2 text-xs text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* 3. Skills */}
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-2">
              <h2 className="text-base font-bold text-gray-900">3. Skills</h2>
              <p className="text-xs text-gray-500">Comma separated (e.g. React.js, Node.js, TypeScript, MongoDB, Docker)</p>
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="React.js, Node.js, Python, Tailwind CSS, SQL"
                className="w-full border rounded-lg px-3 py-2 text-xs text-gray-900"
              />
            </div>

            {/* 4. Education (Dynamic Array) */}
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-gray-900">4. Education</h2>
                <button
                  type="button"
                  onClick={addEducation}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Education
                </button>
              </div>

              {educationList.length === 0 && (
                <p className="text-xs text-gray-400 italic">No education entries added yet.</p>
              )}

              {educationList.map((edu, idx) => (
                <div key={idx} className="p-3.5 bg-gray-50 border rounded-lg space-y-2 relative">
                  <button
                    type="button"
                    onClick={() => removeEducation(idx)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Degree (e.g. B.Tech)"
                      value={edu.degree}
                      onChange={(e) => updateEducation(idx, "degree", e.target.value)}
                      className="border rounded px-2.5 py-1.5 text-xs text-gray-900 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Field of Study (e.g. Computer Science)"
                      value={edu.fieldOfStudy}
                      onChange={(e) => updateEducation(idx, "fieldOfStudy", e.target.value)}
                      className="border rounded px-2.5 py-1.5 text-xs text-gray-900 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="College / Institution"
                      value={edu.institution}
                      onChange={(e) => updateEducation(idx, "institution", e.target.value)}
                      className="border rounded px-2.5 py-1.5 text-xs text-gray-900 bg-white"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Start Year"
                        value={edu.startYear}
                        onChange={(e) => updateEducation(idx, "startYear", e.target.value)}
                        className="w-1/2 border rounded px-2.5 py-1.5 text-xs text-gray-900 bg-white"
                      />
                      <input
                        type="text"
                        placeholder="End Year"
                        value={edu.endYear}
                        onChange={(e) => updateEducation(idx, "endYear", e.target.value)}
                        className="w-1/2 border rounded px-2.5 py-1.5 text-xs text-gray-900 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 5. Work Experience (Dynamic Array) */}
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-gray-900">5. Work Experience</h2>
                <button
                  type="button"
                  onClick={addExperience}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Experience
                </button>
              </div>

              {experienceList.length === 0 && (
                <p className="text-xs text-gray-400 italic">No work experience entries added.</p>
              )}

              {experienceList.map((exp, idx) => (
                <div key={idx} className="p-3.5 bg-gray-50 border rounded-lg space-y-2 relative">
                  <button
                    type="button"
                    onClick={() => removeExperience(idx)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={exp.company}
                      onChange={(e) => updateExperience(idx, "company", e.target.value)}
                      className="border rounded px-2.5 py-1.5 text-xs text-gray-900 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Job Role / Title"
                      value={exp.role}
                      onChange={(e) => updateExperience(idx, "role", e.target.value)}
                      className="border rounded px-2.5 py-1.5 text-xs text-gray-900 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Start Date (e.g. Jan 2024)"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(idx, "startDate", e.target.value)}
                      className="border rounded px-2.5 py-1.5 text-xs text-gray-900 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="End Date (e.g. Present)"
                      value={exp.endDate}
                      onChange={(e) => updateExperience(idx, "endDate", e.target.value)}
                      className="border rounded px-2.5 py-1.5 text-xs text-gray-900 bg-white"
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Key responsibilities & accomplishments..."
                    value={exp.description}
                    onChange={(e) => updateExperience(idx, "description", e.target.value)}
                    className="w-full border rounded px-2.5 py-1.5 text-xs text-gray-900 bg-white"
                  />
                </div>
              ))}
            </div>

            {/* 6. Internships (Dynamic Array) */}
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-gray-900">6. Internships</h2>
                <button
                  type="button"
                  onClick={addInternship}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Internship
                </button>
              </div>

              {internshipList.length === 0 && (
                <p className="text-xs text-gray-400 italic">No internship entries added yet.</p>
              )}

              {internshipList.map((intern, idx) => (
                <div key={idx} className="p-3.5 bg-gray-50 border rounded-lg space-y-2 relative">
                  <button
                    type="button"
                    onClick={() => removeInternship(idx)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Organization / Company"
                      value={intern.company}
                      onChange={(e) => updateInternship(idx, "company", e.target.value)}
                      className="border rounded px-2.5 py-1.5 text-xs text-gray-900 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Internship Title (e.g. Web Development Intern)"
                      value={intern.role}
                      onChange={(e) => updateInternship(idx, "role", e.target.value)}
                      className="border rounded px-2.5 py-1.5 text-xs text-gray-900 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Start Date"
                      value={intern.startDate}
                      onChange={(e) => updateInternship(idx, "startDate", e.target.value)}
                      className="border rounded px-2.5 py-1.5 text-xs text-gray-900 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="End Date"
                      value={intern.endDate}
                      onChange={(e) => updateInternship(idx, "endDate", e.target.value)}
                      className="border rounded px-2.5 py-1.5 text-xs text-gray-900 bg-white"
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Learnings, key contributions..."
                    value={intern.description}
                    onChange={(e) => updateInternship(idx, "description", e.target.value)}
                    className="w-full border rounded px-2.5 py-1.5 text-xs text-gray-900 bg-white"
                  />
                </div>
              ))}
            </div>

            {/* 7. Projects (Dynamic Array) */}
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-gray-900">7. Projects</h2>
                <button
                  type="button"
                  onClick={addProject}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Project
                </button>
              </div>

              {projectList.map((proj, idx) => (
                <div key={idx} className="p-3.5 bg-gray-50 border rounded-lg space-y-2 relative">
                  <button
                    type="button"
                    onClick={() => removeProject(idx)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Project Title"
                      value={proj.title}
                      onChange={(e) => updateProject(idx, "title", e.target.value)}
                      className="border rounded px-2.5 py-1.5 text-xs text-gray-900 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Tech Stack (comma separated)"
                      value={(proj.techStack || []).join(", ")}
                      onChange={(e) =>
                        updateProject(
                          idx,
                          "techStack",
                          e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                        )
                      }
                      className="border rounded px-2.5 py-1.5 text-xs text-gray-900 bg-white"
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Short description & impact..."
                    value={proj.description}
                    onChange={(e) => updateProject(idx, "description", e.target.value)}
                    className="w-full border rounded px-2.5 py-1.5 text-xs text-gray-900 bg-white"
                  />
                </div>
              ))}
            </div>

            {/* 8. Certifications, Achievements & Languages */}
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-gray-900">8. Certifications</h2>
                <button
                  type="button"
                  onClick={addCertification}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Certification
                </button>
              </div>

              {certificationList.map((cert, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded border relative">
                  <input
                    type="text"
                    placeholder="Name"
                    value={cert.name}
                    onChange={(e) => updateCertification(idx, "name", e.target.value)}
                    className="border rounded px-2 py-1 text-xs text-gray-900 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Issuer"
                    value={cert.issuer}
                    onChange={(e) => updateCertification(idx, "issuer", e.target.value)}
                    className="border rounded px-2 py-1 text-xs text-gray-900 bg-white"
                  />
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Year"
                      value={cert.year}
                      onChange={(e) => updateCertification(idx, "year", e.target.value)}
                      className="w-full border rounded px-2 py-1 text-xs text-gray-900 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeCertification(idx)}
                      className="text-gray-400 hover:text-red-600 px-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-3 border-t">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Achievements (Comma separated)</label>
                <input
                  type="text"
                  value={achievementsInput}
                  onChange={(e) => setAchievementsInput(e.target.value)}
                  placeholder="Hackathon Winner, Dean's List 2024, Published Research Paper"
                  className="w-full border rounded-lg px-3 py-2 text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Languages (Comma separated)</label>
                <input
                  type="text"
                  value={languagesInput}
                  onChange={(e) => setLanguagesInput(e.target.value)}
                  placeholder="English, Hindi, Spanish"
                  className="w-full border rounded-lg px-3 py-2 text-xs text-gray-900"
                />
              </div>
            </div>

            {/* 9. References */}
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-gray-900">9. References</h2>
                <button
                  type="button"
                  onClick={addReference}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Reference
                </button>
              </div>

              {referenceList.map((ref, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded border">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={ref.name}
                    onChange={(e) => updateReference(idx, "name", e.target.value)}
                    className="border rounded px-2 py-1 text-xs text-gray-900 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Relationship"
                    value={ref.relation}
                    onChange={(e) => updateReference(idx, "relation", e.target.value)}
                    className="border rounded px-2 py-1 text-xs text-gray-900 bg-white"
                  />
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Contact Info"
                      value={ref.contact}
                      onChange={(e) => updateReference(idx, "contact", e.target.value)}
                      className="w-full border rounded px-2 py-1 text-xs text-gray-900 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeReference(idx)}
                      className="text-gray-400 hover:text-red-600 px-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Save Button */}
            <div className="sticky bottom-4 z-10 bg-white/90 backdrop-blur p-4 rounded-xl border shadow-lg flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">Save your draft before proceeding to OTP verification & payment.</span>
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-xs shadow transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Draft"}
              </button>
            </div>
          </div>

          {/* Right Column: Live Sticky Preview & Payment Flow: 5 cols on lg */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Preview Panel */}
            <div className="sticky top-20 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Live ATS Preview</h3>
                  <span className="text-[11px] text-blue-600 font-medium">Updates in real-time</span>
                </div>
                <div className="max-h-[500px] overflow-y-auto border rounded-lg bg-gray-50 p-2">
                  <ResumePreview resume={currentPreviewData} />
                </div>
              </div>

              {/* Generate & Download Section */}
              <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
                <h3 className="text-base font-bold text-gray-900">Generate & Download (₹50)</h3>
                {!resumeId ? (
                  <p className="text-xs text-gray-500">
                    Click <strong>"Save Draft"</strong> above first to save your resume details before initiating OTP verification.
                  </p>
                ) : (
                  <PaymentOtpFlow
                    resumeId={resumeId}
                    userEmail={draft.email || ""}
                    onSuccess={loadUserAndResumes}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FULLSCREEN LIVE PREVIEW */}
      {activeTab === "preview" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border">
            <div>
              <h2 className="text-base font-bold text-gray-900">Live Resume ATS Preview</h2>
              <p className="text-xs text-gray-500">
                Template: <strong className="capitalize">{draft.templateId || "classic-ats"}</strong> • Font: <strong>{draft.fontFamily || "Helvetica"}</strong>
              </p>
            </div>
            <button
              onClick={() => setActiveTab("edit")}
              className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200"
            >
              Back to Editor
            </button>
          </div>
          <ResumePreview resume={currentPreviewData} />
        </div>
      )}

      {/* TAB 3: HISTORY & INVOICES */}
      {activeTab === "history" && (
        <ResumeHistory
          onSelectResume={(selected) => {
            populateResume(selected);
            setActiveTab("edit");
          }}
          onRefresh={loadUserAndResumes}
        />
      )}
    </div>
  );
}
