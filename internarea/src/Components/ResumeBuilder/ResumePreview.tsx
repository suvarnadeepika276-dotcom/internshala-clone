"use client";

import React from "react";
import { Resume } from "../../../types/resume";

interface Props {
  resume: Partial<Resume>;
}

export default function ResumePreview({ resume }: Props) {
  const templateId = resume.templateId || "classic-ats";
  const themeColor = resume.themeColor || "#1a73e8";
  const fontFamily = resume.fontFamily || "Helvetica";

  // Font class mapping
  const fontStyle = fontFamily.toLowerCase().includes("times")
    ? "font-serif"
    : fontFamily.toLowerCase().includes("courier")
    ? "font-mono"
    : "font-sans";

  return (
    <div className={`bg-white shadow-xl rounded-lg border p-8 max-w-2xl mx-auto ${fontStyle} text-gray-800 transition-all text-sm leading-relaxed min-h-[700px]`}>
      
      {/* 1. CLASSIC ATS TEMPLATE */}
      {templateId === "classic-ats" && (
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center pb-3 border-b border-gray-300">
            {resume.profilePhotoUrl && (
              <img
                src={resume.profilePhotoUrl}
                alt="Profile"
                className="w-16 h-16 rounded-full mx-auto mb-2 object-cover border-2"
                style={{ borderColor: themeColor }}
              />
            )}
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: themeColor }}>
              {resume.fullName || "Your Full Name"}
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              {[resume.email, resume.phone, resume.address].filter(Boolean).join("  |  ") || "email@example.com  |  +91 9876543210"}
            </p>
            {resume.socialLinks && Object.values(resume.socialLinks).filter(Boolean).length > 0 && (
              <p className="text-xs mt-1 font-medium" style={{ color: themeColor }}>
                {Object.values(resume.socialLinks).filter(Boolean).join("  •  ")}
              </p>
            )}
          </div>

          {/* Professional Summary */}
          {resume.careerObjective && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider pb-1 border-b" style={{ color: themeColor }}>
                Professional Summary
              </h2>
              <p className="text-xs text-gray-700 mt-1 whitespace-pre-line">{resume.careerObjective}</p>
            </div>
          )}

          {/* Skills */}
          {resume.skills && resume.skills.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider pb-1 border-b" style={{ color: themeColor }}>
                Core & Technical Skills
              </h2>
              <p className="text-xs text-gray-700 mt-1">
                <span className="font-semibold text-gray-900">Skills: </span>
                {resume.skills.join(", ")}
              </p>
            </div>
          )}

          {/* Work Experience */}
          {resume.experience && resume.experience.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider pb-1 border-b" style={{ color: themeColor }}>
                Work Experience
              </h2>
              <div className="space-y-2 mt-1">
                {resume.experience.map((exp, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold text-gray-900">{exp.role || "Role"}</span>
                      <span className="text-[11px] text-gray-500 italic">
                        {exp.startDate} - {exp.isCurrent ? "Present" : exp.endDate}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">{exp.company}</p>
                    {exp.description && <p className="text-xs text-gray-700 mt-0.5">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Internships */}
          {resume.internships && resume.internships.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider pb-1 border-b" style={{ color: themeColor }}>
                Internships
              </h2>
              <div className="space-y-2 mt-1">
                {resume.internships.map((intern, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold text-gray-900">{intern.role || "Intern"}</span>
                      <span className="text-[11px] text-gray-500 italic">
                        {intern.startDate} - {intern.isCurrent ? "Present" : intern.endDate}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{intern.company}</p>
                    {intern.description && <p className="text-xs text-gray-700 mt-0.5">{intern.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {resume.projects && resume.projects.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider pb-1 border-b" style={{ color: themeColor }}>
                Projects
              </h2>
              <div className="space-y-2 mt-1">
                {resume.projects.map((proj, i) => (
                  <div key={i}>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">{proj.title}</span>
                      {proj.techStack && proj.techStack.length > 0 && (
                        <span className="text-[11px] text-gray-500 italic">[{proj.techStack.join(", ")}]</span>
                      )}
                    </div>
                    {proj.description && <p className="text-xs text-gray-700 mt-0.5">{proj.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {resume.education && resume.education.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider pb-1 border-b" style={{ color: themeColor }}>
                Education
              </h2>
              <div className="space-y-1.5 mt-1">
                {resume.education.map((edu, i) => (
                  <div key={i} className="flex justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(" in ")}
                      </p>
                      <p className="text-xs text-gray-600">{edu.institution}</p>
                    </div>
                    <span className="text-[11px] text-gray-500">
                      {[edu.startYear, edu.endYear].filter(Boolean).join(" - ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info: Certs, Achievements, Languages */}
          {(resume.certifications?.length || resume.achievements?.length || resume.languages?.length) && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider pb-1 border-b" style={{ color: themeColor }}>
                Additional Qualifications
              </h2>
              <div className="mt-1 space-y-1 text-xs text-gray-700">
                {resume.certifications && resume.certifications.length > 0 && (
                  <p>
                    <span className="font-semibold text-gray-900">Certifications: </span>
                    {resume.certifications.map((c) => `${c.name} (${c.issuer || ""})`).join(", ")}
                  </p>
                )}
                {resume.achievements && resume.achievements.length > 0 && (
                  <p>
                    <span className="font-semibold text-gray-900">Achievements: </span>
                    {resume.achievements.join("; ")}
                  </p>
                )}
                {resume.languages && resume.languages.length > 0 && (
                  <p>
                    <span className="font-semibold text-gray-900">Languages: </span>
                    {resume.languages.join(", ")}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. MODERN ATS TEMPLATE */}
      {templateId === "modern-ats" && (
        <div className="space-y-4">
          {/* Accent Header */}
          <div className="flex items-start gap-4 pb-3 border-b-2" style={{ borderColor: themeColor }}>
            <div className="w-2.5 self-stretch rounded-full" style={{ backgroundColor: themeColor }} />
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                {resume.fullName || "Your Full Name"}
              </h1>
              <p className="text-xs text-gray-600 mt-0.5">
                {[resume.email, resume.phone, resume.address].filter(Boolean).join(" • ") || "email@example.com • +91 9876543210"}
              </p>
              {resume.socialLinks && Object.values(resume.socialLinks).filter(Boolean).length > 0 && (
                <p className="text-xs mt-0.5 font-medium" style={{ color: themeColor }}>
                  {Object.values(resume.socialLinks).filter(Boolean).join(" | ")}
                </p>
              )}
            </div>
            {resume.profilePhotoUrl && (
              <img
                src={resume.profilePhotoUrl}
                alt="Profile"
                className="w-14 h-14 rounded-lg object-cover border"
              />
            )}
          </div>

          {/* Summary */}
          {resume.careerObjective && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-3.5 rounded" style={{ backgroundColor: themeColor }} />
                <h2 className="text-xs font-bold uppercase tracking-wide" style={{ color: themeColor }}>
                  Summary
                </h2>
              </div>
              <p className="text-xs text-gray-700 pl-3.5 whitespace-pre-line">{resume.careerObjective}</p>
            </div>
          )}

          {/* Skills */}
          {resume.skills && resume.skills.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-3.5 rounded" style={{ backgroundColor: themeColor }} />
                <h2 className="text-xs font-bold uppercase tracking-wide" style={{ color: themeColor }}>
                  Skills & Expertise
                </h2>
              </div>
              <div className="flex flex-wrap gap-1.5 pl-3.5 mt-1">
                {resume.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: `${themeColor}15`, color: themeColor }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {resume.experience && resume.experience.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-3.5 rounded" style={{ backgroundColor: themeColor }} />
                <h2 className="text-xs font-bold uppercase tracking-wide" style={{ color: themeColor }}>
                  Experience
                </h2>
              </div>
              <div className="space-y-2 pl-3.5 mt-1">
                {resume.experience.map((exp, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-gray-900">{exp.role} <span className="font-normal text-gray-600">at {exp.company}</span></span>
                      <span className="text-[11px] text-gray-500">{exp.startDate} - {exp.isCurrent ? "Present" : exp.endDate}</span>
                    </div>
                    {exp.description && <p className="text-xs text-gray-700 mt-0.5">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {resume.projects && resume.projects.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-3.5 rounded" style={{ backgroundColor: themeColor }} />
                <h2 className="text-xs font-bold uppercase tracking-wide" style={{ color: themeColor }}>
                  Projects
                </h2>
              </div>
              <div className="space-y-1.5 pl-3.5 mt-1">
                {resume.projects.map((proj, i) => (
                  <div key={i} className="text-xs">
                    <span className="font-semibold text-gray-900">{proj.title}</span>
                    {proj.techStack && proj.techStack.length > 0 && (
                      <span className="ml-2 font-medium" style={{ color: themeColor }}>({proj.techStack.join(", ")})</span>
                    )}
                    {proj.description && <p className="text-gray-700 mt-0.5">{proj.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {resume.education && resume.education.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-3.5 rounded" style={{ backgroundColor: themeColor }} />
                <h2 className="text-xs font-bold uppercase tracking-wide" style={{ color: themeColor }}>
                  Education
                </h2>
              </div>
              <div className="space-y-1 pl-3.5 mt-1">
                {resume.education.map((edu, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <div>
                      <p className="font-bold text-gray-900">{[edu.degree, edu.fieldOfStudy].filter(Boolean).join(" in ")}</p>
                      <p className="text-gray-600">{edu.institution}</p>
                    </div>
                    <span className="text-[11px] text-gray-500">{[edu.startYear, edu.endYear].filter(Boolean).join(" - ")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. MINIMALIST ATS TEMPLATE */}
      {templateId === "minimal-ats" && (
        <div className="space-y-4">
          <div className="pb-2 border-b border-gray-200">
            <h1 className="text-2xl font-semibold tracking-wider text-gray-900">
              {resume.fullName || "Your Full Name"}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {[resume.email, resume.phone, resume.address].filter(Boolean).join("   •   ")}
            </p>
          </div>

          {resume.careerObjective && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                Profile
              </h2>
              <p className="text-xs text-gray-700 leading-relaxed">{resume.careerObjective}</p>
            </div>
          )}

          {resume.skills && resume.skills.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                Competencies
              </h2>
              <p className="text-xs text-gray-700 font-medium">{resume.skills.join("   |   ")}</p>
            </div>
          )}

          {resume.experience && resume.experience.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                Experience
              </h2>
              <div className="space-y-2 mt-1">
                {resume.experience.map((exp, i) => (
                  <div key={i} className="text-xs">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">{exp.role} — {exp.company}</span>
                      <span className="text-gray-400">{exp.startDate} - {exp.isCurrent ? "Present" : exp.endDate}</span>
                    </div>
                    {exp.description && <p className="text-gray-600 mt-0.5">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {resume.education && resume.education.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                Education
              </h2>
              <div className="space-y-1.5 mt-1">
                {resume.education.map((edu, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <p className="font-semibold text-gray-900">{edu.degree} - {edu.institution}</p>
                    <span className="text-gray-400">{edu.startYear} - {edu.endYear}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
