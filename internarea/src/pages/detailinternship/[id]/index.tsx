import { selectuser } from "@/Feature/Userslice";
import axios from "axios";
import {
    ArrowUpRight,
    Calendar,
    Clock,
    DollarSign,
    ExternalLink,
    MapPin,
    X,
    FileText,
    CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { listResumes, setDefaultResume } from "../../../../services/resumeApi";
import { Resume } from "../../../../types/resume";
import { useLanguage } from "@/context/LanguageContext";
// export const internships = [
//   {
//     _id: "1",
//     title: "Frontend Developer Intern",
//     company: "Tech Innovators",
//     location: "Remote",
//     stipend: "$500/month",
//     Duration: "3 Months",
//     StartDate: "March 15, 2025",
//     aboutCompany:
//       "Tech Innovators is a leading software development company specializing in modern web applications.",
//     aboutJob:
//       "As a Frontend Developer Intern, you will work on real-world projects using React.js and Tailwind CSS.",
//     Whocanapply:
//       "Students and fresh graduates with knowledge of HTML, CSS, JavaScript, and React.js.",
//     perks: "Certificate, Letter of Recommendation, Flexible Work Hours",
//     AdditionalInfo: "This is a remote internship with flexible working hours.",
//     numberOfopning: "2",
//   },
//   {
//     _id: "2",
//     title: "Backend Developer Intern",
//     company: "Cloud Systems",
//     location: "San Francisco",
//     stipend: "$800/month",
//     Duration: "4 Months",
//     StartDate: "April 1, 2025",
//     aboutCompany:
//       "Cloud Systems focuses on scalable backend solutions and cloud-based applications.",
//     aboutJob:
//       "As a Backend Developer Intern, you will work with Node.js, Express, and MongoDB.",
//     Whocanapply:
//       "Students with experience in backend technologies and databases.",
//     perks: "Certificate, Networking Opportunities, Paid Internship",
//     AdditionalInfo: "A strong foundation in databases is required.",
//     numberOfopning: "3",
//   },
//   {
//     _id: "3",
//     title: "UI/UX Designer Intern",
//     company: "Creative Minds",
//     location: "New York",
//     stipend: "$600/month",
//     Duration: "6 Months",
//     StartDate: "May 10, 2025",
//     aboutCompany:
//       "Creative Minds is a design agency focused on user experience and interface design.",
//     aboutJob:
//       "As a UI/UX Designer Intern, you will work with Figma, Adobe XD, and design systems.",
//     Whocanapply:
//       "Students passionate about designing intuitive user experiences.",
//     perks: "Mentorship, Hands-on Projects, Letter of Recommendation",
//     AdditionalInfo: "A portfolio is required for application.",
//     numberOfopning: "1",
//   },
// ];

const index = () => {
    const router = useRouter();
    const { id } = router.query;
    const [internshipData, setinternship] = useState<any>([])
    useEffect(() => {
        const fetchdata = async () => {
            try {
                const res = await axios.get(`https://internshala-clone-ahv9.onrender.com/api/internship/${id}`)
                setinternship(res.data)
            } catch (error) {
                console.log(error)
            }
        }
        fetchdata()
    }, [id])
    const { t } = useLanguage();
    const [availability, setAvailability] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [coverLetter, setCoverLetter] = useState("");
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [selectedResumeId, setSelectedResumeId] = useState<string>("");
    const user = useSelector(selectuser);

    useEffect(() => {
        if (isModalOpen && user) {
            listResumes()
                .then((list) => {
                    const paidList = (list || []).filter((r) => r.paymentStatus === "paid");
                    setResumes(paidList);
                    const def = paidList.find((r) => r.isDefault) || paidList[0];
                    if (def?._id) setSelectedResumeId(def._id);
                })
                .catch(() => {});
        }
    }, [isModalOpen, user]);

    if (!internshipData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }
    const handlesubmitapplication = async () => {
        if (!coverLetter.trim()) {
            toast.error("please write a cover letter");
            return;
        }
        if (!availability) {
            toast.error("please select your availability");
            return;
        }
        try {
            const chosenResume = resumes.find((r) => r._id === selectedResumeId);
            const applicationdata = {
                category: internshipData.category,
                company: internshipData.company,
                coverLetter: coverLetter,
                user: user,
                Application: id,
                availability,
                attachedResume: selectedResumeId || undefined,
                resumePdfUrl: chosenResume?.pdfUrl || undefined,
            };
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://internshala-clone-ahv9.onrender.com/api";
            await axios.post(`${apiBase}/application`, applicationdata);
            toast.success("Application submitted successfully with attached resume!");
            router.push('/internship');
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit application");
        }
    };
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Header Section */}
                <div className="p-6 border-b">
                    <div className="flex items-center space-x-2 text-blue-600 mb-4">
                        <ArrowUpRight className="h-5 w-5" />
                        <span className="font-medium">{t("activelyHiring")}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {internshipData.title}
                    </h1>
                    <p className="text-lg text-gray-600 mb-4">{internshipData.company}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center space-x-2 text-gray-600">
                            <MapPin className="h-5 w-5" />
                            <span>{internshipData.location}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                            <DollarSign className="h-5 w-5" />
                            <span>{internshipData.stipend}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                            <Calendar className="h-5 w-5" />
                            <span>{internshipData.startDate}</span>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-green-500" />
                        <span className="text-green-500 text-sm">
                            Posted on {internshipData.createdAt}
                        </span>
                    </div>
                </div>
                {/* Company Section */}
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        About {internshipData.company}
                    </h2>
                    <div className="flex items-center space-x-2 mb-4">
                        <a
                            href="#"
                            className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                        >
                            <span>Visit company website</span>
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </div>
                    <p className="text-gray-600">{internshipData.aboutCompany}</p>
                </div>
                {/* Internship Details Section */}
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        About the Internship
                    </h2>
                    <p className="text-gray-600 mb-6">{internshipData.aboutInternship}</p>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Who can apply
                    </h3>
                    <p className="text-gray-600 mb-6">{internshipData.whoCanApply}</p>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Perks</h3>
                    <p className="text-gray-600 mb-6">{internshipData.perks}</p>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Additional Information
                    </h3>
                    <p className="text-gray-600 mb-6">{internshipData.additionalInfo}</p>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Number of Openings
                    </h3>
                    <p className="text-gray-600">{internshipData.numberOfOpening}</p>
                </div>
                {/* Apply Button */}
                <div className="p-6 flex justify-center">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition duration-150 font-semibold"
                    >
                        {t("applyNow")}
                    </button>
                </div>
            </div>
            {/* Apply Modal */}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Apply to {internshipData.company}
                                </h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Resume Section */}
                            <div className="bg-gray-50 border rounded-xl p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                                        <FileText className="w-4 h-4 text-blue-600" /> Attached Resume
                                    </h3>
                                    <Link
                                        href="/resumebuilder"
                                        target="_blank"
                                        className="text-xs text-blue-600 font-semibold hover:underline"
                                    >
                                        Resume Builder →
                                    </Link>
                                </div>

                                {resumes.length > 0 ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={selectedResumeId}
                                                onChange={(e) => setSelectedResumeId(e.target.value)}
                                                className="w-full text-xs border rounded-lg p-2 bg-white text-gray-800 font-medium"
                                            >
                                                {resumes.map((r) => (
                                                    <option key={r._id} value={r._id}>
                                                        {r.versionName || "Resume"} {r.isDefault ? "★ (Default Resume)" : ""} — {r.templateId || "Classic"}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <p className="text-[11px] text-gray-500">
                                            The selected ATS-friendly resume will be attached to your internship application.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-xs text-gray-600">
                                        <p>No paid ATS resume found in your profile.</p>
                                        <Link
                                            href="/resumebuilder"
                                            className="inline-block mt-2 text-xs font-semibold text-blue-600 underline"
                                        >
                                            Generate an ATS Resume with Resume Builder (₹50)
                                        </Link>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Cover Letter
                                </h3>
                                <p className="text-gray-600 mb-2">
                                    Why should you be selected for this internship?
                                </p>
                                <textarea
                                    value={coverLetter}
                                    onChange={(e) => setCoverLetter(e.target.value)}
                                    className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                                    placeholder="Write your cover letter here..."
                                ></textarea>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Your Availability
                                </h3>
                                <div className="space-y-3">
                                    {[
                                        "Yes, I am available to join immediately",
                                        "No, I am currently on notice period",
                                        "No, I will have to serve notice period",
                                        "Other",
                                    ].map((option) => (
                                        <label key={option} className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                name=""
                                                id=""
                                                value={option}
                                                checked={availability === option}
                                                onChange={(e) => setAvailability(e.target.value)}
                                                className="h-4 w-4 text-blue-600"
                                            />
                                            <span className="text-gray-700">{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                {user ? (
                                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold" onClick={handlesubmitapplication}>
                                        {t("submitApplication")}
                                    </button>
                                ) : (
                                    <Link
                                        href={`/`}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                                    >
                                        Sign up to apply
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default index;