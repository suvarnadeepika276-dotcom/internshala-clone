import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { saveDraft } from "../../../services/resumeApi";
import { updateDraftField } from "../../../redux/resumeSlice";
import PaymentOtpFlow from "../../Components/ResumeBuilder/PaymentOtpFlow";

export default function ResumeBuilderPage() {
    const dispatch = useDispatch();
    const draft = useSelector((s: any) => s.resumeBuilder.draft);
    const [resumeId, setResumeId] = useState<string | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Simple comma-separated inputs for list fields (skills, achievements, languages)
    const [skillsInput, setSkillsInput] = useState("");
    const [achievementsInput, setAchievementsInput] = useState("");
    const [languagesInput, setLanguagesInput] = useState("");

    // Single-entry fields for education/experience/projects/certifications/references
    // (multiple entries per section can be added later - this covers one of each for now)
    const [education, setEducation] = useState({ institution: "", degree: "", fieldOfStudy: "", startYear: "", endYear: "" });
    const [experience, setExperience] = useState({ company: "", role: "", startDate: "", endDate: "", description: "" });
    const [project, setProject] = useState({ title: "", description: "", techStack: "" });
    const [certification, setCertification] = useState({ name: "", issuer: "", year: "" });
    const [reference, setReference] = useState({ name: "", relation: "", contact: "" });
    const [socialLinks, setSocialLinks] = useState({ linkedin: "", github: "", portfolio: "" });
    const [profilePhotoUrl, setProfilePhotoUrl] = useState("");

    const handleChange = (field: string, value: any) => {
        dispatch(updateDraftField({ field: field as any, value }));
    };

    const handleSaveDraft = async () => {
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
                profilePhotoUrl,
                socialLinks,
                resumeId: resumeId || undefined,
            };

            if (education.institution) payload.education = [education];
            if (experience.company) payload.experience = [experience];
            if (project.title) {
                payload.projects = [{ ...project, techStack: project.techStack.split(",").map((s) => s.trim()).filter(Boolean) }];
            }
            if (certification.name) payload.certifications = [certification];
            if (reference.name) payload.references = [reference];

            const saved = await saveDraft(payload);
            setResumeId(saved._id || null);
            toast.success("Draft saved");
        } catch (err) {
            toast.error("Could not save draft. Please check required fields and try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-10">
            <h1 className="text-2xl font-semibold mb-6 text-gray-900">Resume Builder</h1>

            <div className="space-y-4 bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900">Personal Details</h2>

                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900">Full Name *</label>
                    <input className="w-full border rounded px-3 py-2 text-gray-900" value={draft.fullName || ""} onChange={(e) => handleChange("fullName", e.target.value)} placeholder="Full name" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900">Email *</label>
                    <input className="w-full border rounded px-3 py-2 text-gray-900" value={draft.email || ""} onChange={(e) => handleChange("email", e.target.value)} placeholder="you@example.com" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900">Phone</label>
                    <input className="w-full border rounded px-3 py-2 text-gray-900" value={draft.phone || ""} onChange={(e) => handleChange("phone", e.target.value)} />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900">Profile Photo URL</label>
                    <input className="w-full border rounded px-3 py-2 text-gray-900" value={profilePhotoUrl} onChange={(e) => setProfilePhotoUrl(e.target.value)} placeholder="Link to your photo (upload elsewhere and paste the link)" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900">Career Objective</label>
                    <textarea className="w-full border rounded px-3 py-2 text-gray-900" rows={3} value={draft.careerObjective || ""} onChange={(e) => handleChange("careerObjective", e.target.value)} />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900">Skills (comma separated)</label>
                    <input className="w-full border rounded px-3 py-2 text-gray-900" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder="React, Node.js, MongoDB" />
                </div>

                <h2 className="text-lg font-medium text-gray-900 pt-4 border-t">Education</h2>
                <div className="grid grid-cols-2 gap-2">
                    <input className="border rounded px-3 py-2 text-gray-900" placeholder="Institution" value={education.institution} onChange={(e) => setEducation({ ...education, institution: e.target.value })} />
                    <input className="border rounded px-3 py-2 text-gray-900" placeholder="Degree" value={education.degree} onChange={(e) => setEducation({ ...education, degree: e.target.value })} />
                    <input className="border rounded px-3 py-2 text-gray-900" placeholder="Field of study" value={education.fieldOfStudy} onChange={(e) => setEducation({ ...education, fieldOfStudy: e.target.value })} />
                    <div className="flex gap-2">
                        <input className="border rounded px-3 py-2 text-gray-900 w-1/2" placeholder="Start year" value={education.startYear} onChange={(e) => setEducation({ ...education, startYear: e.target.value })} />
                        <input className="border rounded px-3 py-2 text-gray-900 w-1/2" placeholder="End year" value={education.endYear} onChange={(e) => setEducation({ ...education, endYear: e.target.value })} />
                    </div>
                </div>

                <h2 className="text-lg font-medium text-gray-900 pt-4 border-t">Work Experience / Internship</h2>
                <div className="grid grid-cols-2 gap-2">
                    <input className="border rounded px-3 py-2 text-gray-900" placeholder="Company" value={experience.company} onChange={(e) => setExperience({ ...experience, company: e.target.value })} />
                    <input className="border rounded px-3 py-2 text-gray-900" placeholder="Role" value={experience.role} onChange={(e) => setExperience({ ...experience, role: e.target.value })} />
                    <input className="border rounded px-3 py-2 text-gray-900" placeholder="Start date" value={experience.startDate} onChange={(e) => setExperience({ ...experience, startDate: e.target.value })} />
                    <input className="border rounded px-3 py-2 text-gray-900" placeholder="End date" value={experience.endDate} onChange={(e) => setExperience({ ...experience, endDate: e.target.value })} />
                    <textarea className="border rounded px-3 py-2 text-gray-900 col-span-2" placeholder="Description" value={experience.description} onChange={(e) => setExperience({ ...experience, description: e.target.value })} />
                </div>

                <h2 className="text-lg font-medium text-gray-900 pt-4 border-t">Project</h2>
                <div className="grid grid-cols-1 gap-2">
                    <input className="border rounded px-3 py-2 text-gray-900" placeholder="Project title" value={project.title} onChange={(e) => setProject({ ...project, title: e.target.value })} />
                    <input className="border rounded px-3 py-2 text-gray-900" placeholder="Tech stack (comma separated)" value={project.techStack} onChange={(e) => setProject({ ...project, techStack: e.target.value })} />
                    <textarea className="border rounded px-3 py-2 text-gray-900" placeholder="Description" value={project.description} onChange={(e) => setProject({ ...project, description: e.target.value })} />
                </div>

                <h2 className="text-lg font-medium text-gray-900 pt-4 border-t">Certification</h2>
                <div className="grid grid-cols-3 gap-2">
                    <input className="border rounded px-3 py-2 text-gray-900" placeholder="Name" value={certification.name} onChange={(e) => setCertification({ ...certification, name: e.target.value })} />
                    <input className="border rounded px-3 py-2 text-gray-900" placeholder="Issuer" value={certification.issuer} onChange={(e) => setCertification({ ...certification, issuer: e.target.value })} />
                    <input className="border rounded px-3 py-2 text-gray-900" placeholder="Year" value={certification.year} onChange={(e) => setCertification({ ...certification, year: e.target.value })} />
                </div>

                <h2 className="text-lg font-medium text-gray-900 pt-4 border-t">Achievements & Languages</h2>
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900">Achievements (comma separated)</label>
                    <input className="w-full border rounded px-3 py-2 text-gray-900" value={achievementsInput} onChange={(e) => setAchievementsInput(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900">Languages (comma separated)</label>
                    <input className="w-full border rounded px-3 py-2 text-gray-900" value={languagesInput} onChange={(e) => setLanguagesInput(e.target.value)} placeholder="English, Hindi" />
                </div>

                <h2 className="text-lg font-medium text-gray-900 pt-4 border-t">Social Links</h2>
                <div className="grid grid-cols-3 gap-2">
                    <input className="border rounded px-3 py-2 text-gray-900" placeholder="LinkedIn" value={socialLinks.linkedin} onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })} />
                    <input className="border rounded px-3 py-2 text-gray-900" placeholder="GitHub" value={socialLinks.github} onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })} />
                    <input className="border rounded px-3 py-2 text-gray-900" placeholder="Portfolio" value={socialLinks.portfolio} onChange={(e) => setSocialLinks({ ...socialLinks, portfolio: e.target.value })} />
                </div>

                <h2 className="text-lg font-medium text-gray-900 pt-4 border-t">Reference</h2>
                <div className="grid grid-cols-3 gap-2">
                    <input className="border rounded px-3 py-2 text-gray-900" placeholder="Name" value={reference.name} onChange={(e) => setReference({ ...reference, name: e.target.value })} />
                    <input className="border rounded px-3 py-2 text-gray-900" placeholder="Relation" value={reference.relation} onChange={(e) => setReference({ ...reference, relation: e.target.value })} />
                    <input className="border rounded px-3 py-2 text-gray-900" placeholder="Contact" value={reference.contact} onChange={(e) => setReference({ ...reference, contact: e.target.value })} />
                </div>

                <button
                    onClick={handleSaveDraft}
                    disabled={saving}
                    className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 mt-4"
                >
                    {saving ? "Saving..." : "Save Draft"}
                </button>
            </div>

            {resumeId && (
                <div className="mt-8 bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-medium mb-4 text-gray-900">Generate & Download</h2>
                    <PaymentOtpFlow resumeId={resumeId} userEmail={draft.email || ""} />
                </div>
            )}
        </div>
    );
}