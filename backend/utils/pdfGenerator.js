const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function getFontFamily(font) {
  const f = (font || "").toLowerCase();
  if (f.includes("times") || f.includes("serif")) {
    return { regular: "Times-Roman", bold: "Times-Bold", italic: "Times-Italic" };
  }
  if (f.includes("courier") || f.includes("mono")) {
    return { regular: "Courier", bold: "Courier-Bold", italic: "Courier-Oblique" };
  }
  return { regular: "Helvetica", bold: "Helvetica-Bold", italic: "Helvetica-Oblique" };
}

// 1. Classic ATS Template
function generateClassicAtsTemplate(doc, resume, fonts) {
  const theme = resume.themeColor || "#1a73e8";

  // Name & Contact
  doc.font(fonts.bold).fontSize(22).fillColor(theme).text(resume.fullName || "Untitled", { align: "center" });
  doc.moveDown(0.2);
  
  const contactParts = [resume.email, resume.phone, resume.address].filter(Boolean);
  doc.font(fonts.regular).fontSize(9.5).fillColor("#374151").text(contactParts.join("  |  "), { align: "center" });

  const links = Object.values(resume.socialLinks || {}).filter(Boolean);
  if (links.length) {
    doc.moveDown(0.1);
    doc.font(fonts.regular).fontSize(9).fillColor(theme).text(links.join("  •  "), { align: "center" });
  }
  doc.moveDown(0.8);

  const renderSectionHeader = (title) => {
    doc.moveDown(0.5);
    doc.font(fonts.bold).fontSize(12).fillColor(theme).text(title.toUpperCase());
    doc.strokeColor("#d1d5db").lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.4);
  };

  // Career Objective
  if (resume.careerObjective) {
    renderSectionHeader("Professional Summary");
    doc.font(fonts.regular).fontSize(10).fillColor("#1f2937").text(resume.careerObjective, { lineGap: 2 });
  }

  // Skills
  if (resume.skills?.length) {
    renderSectionHeader("Skills");
    doc.font(fonts.bold).fontSize(10).fillColor("#111827").text("Technical & Core Skills: ", { continued: true });
    doc.font(fonts.regular).fillColor("#374151").text(resume.skills.join(", "));
  }

  // Experience
  if (resume.experience?.length) {
    renderSectionHeader("Work Experience");
    resume.experience.forEach((exp) => {
      doc.font(fonts.bold).fontSize(11).fillColor("#111827").text(exp.role || "Role", { continued: true });
      doc.font(fonts.regular).fillColor("#4b5563").text(` — ${exp.company || ""}`, { continued: true });
      const dateText = `${exp.startDate || ""} - ${exp.isCurrent ? "Present" : exp.endDate || ""}`;
      doc.font(fonts.italic).fontSize(9).fillColor("#6b7280").text(` (${dateText})`, { align: "right" });
      if (exp.description) {
        doc.font(fonts.regular).fontSize(9.5).fillColor("#374151").text(exp.description, { lineGap: 1.5 });
      }
      doc.moveDown(0.4);
    });
  }

  // Internships
  if (resume.internships?.length) {
    renderSectionHeader("Internships");
    resume.internships.forEach((intern) => {
      doc.font(fonts.bold).fontSize(11).fillColor("#111827").text(intern.role || "Intern", { continued: true });
      doc.font(fonts.regular).fillColor("#4b5563").text(` — ${intern.company || ""}`);
      if (intern.description) {
        doc.font(fonts.regular).fontSize(9.5).fillColor("#374151").text(intern.description);
      }
      doc.moveDown(0.4);
    });
  }

  // Projects
  if (resume.projects?.length) {
    renderSectionHeader("Projects");
    resume.projects.forEach((proj) => {
      doc.font(fonts.bold).fontSize(10.5).fillColor("#111827").text(proj.title || "Project", { continued: Boolean(proj.techStack?.length) });
      if (proj.techStack?.length) {
        doc.font(fonts.italic).fontSize(9).fillColor("#6b7280").text(` [${proj.techStack.join(", ")}]`);
      }
      if (proj.description) {
        doc.font(fonts.regular).fontSize(9.5).fillColor("#374151").text(proj.description);
      }
      doc.moveDown(0.4);
    });
  }

  // Education
  if (resume.education?.length) {
    renderSectionHeader("Education");
    resume.education.forEach((edu) => {
      const degreeStr = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(" in ");
      doc.font(fonts.bold).fontSize(10.5).fillColor("#111827").text(degreeStr || "Degree", { continued: true });
      const yearStr = [edu.startYear, edu.endYear].filter(Boolean).join(" - ");
      if (yearStr) {
        doc.font(fonts.italic).fontSize(9).fillColor("#6b7280").text(` (${yearStr})`, { align: "right" });
      } else {
        doc.text("");
      }
      doc.font(fonts.regular).fontSize(9.5).fillColor("#4b5563").text(edu.institution || "");
      doc.moveDown(0.3);
    });
  }

  // Certifications
  if (resume.certifications?.length) {
    renderSectionHeader("Certifications");
    resume.certifications.forEach((cert) => {
      doc.font(fonts.bold).fontSize(10).fillColor("#111827").text(`• ${cert.name || ""}`, { continued: true });
      doc.font(fonts.regular).fillColor("#4b5563").text(` — ${cert.issuer || ""} ${cert.year ? `(${cert.year})` : ""}`);
    });
  }

  // Achievements & Languages
  if (resume.achievements?.length || resume.languages?.length) {
    renderSectionHeader("Additional Information");
    if (resume.achievements?.length) {
      doc.font(fonts.bold).fontSize(9.5).fillColor("#111827").text("Achievements: ", { continued: true });
      doc.font(fonts.regular).fillColor("#374151").text(resume.achievements.join("; "));
      doc.moveDown(0.2);
    }
    if (resume.languages?.length) {
      doc.font(fonts.bold).fontSize(9.5).fillColor("#111827").text("Languages: ", { continued: true });
      doc.font(fonts.regular).fillColor("#374151").text(resume.languages.join(", "));
    }
  }

  // References
  if (resume.references?.length) {
    renderSectionHeader("References");
    resume.references.forEach((ref) => {
      doc.font(fonts.regular).fontSize(9.5).fillColor("#374151").text(`${ref.name} (${ref.relation}) — ${ref.contact}`);
    });
  }
}

// 2. Modern ATS Template (Left vertical accent bar, bold modern headers)
function generateModernAtsTemplate(doc, resume, fonts) {
  const theme = resume.themeColor || "#0f766e";

  // Left accent bar at page top
  doc.rect(40, 40, 6, 60).fill(theme);

  // Header
  doc.font(fonts.bold).fontSize(22).fillColor("#111827").text(resume.fullName || "Untitled", 56, 42);
  const contactParts = [resume.email, resume.phone, resume.address].filter(Boolean);
  doc.font(fonts.regular).fontSize(9.5).fillColor("#4b5563").text(contactParts.join(" • "), 56, 70);

  const links = Object.values(resume.socialLinks || {}).filter(Boolean);
  if (links.length) {
    doc.font(fonts.regular).fontSize(9).fillColor(theme).text(links.join(" | "), 56, 84);
  }

  doc.y = 115;

  const renderSectionHeader = (title) => {
    doc.moveDown(0.6);
    const startY = doc.y;
    doc.rect(40, startY + 2, 4, 13).fill(theme);
    doc.font(fonts.bold).fontSize(12).fillColor(theme).text(title, 52, startY);
    doc.moveDown(0.3);
  };

  if (resume.careerObjective) {
    renderSectionHeader("SUMMARY");
    doc.x = 52;
    doc.font(fonts.regular).fontSize(9.5).fillColor("#1f2937").text(resume.careerObjective);
  }

  if (resume.skills?.length) {
    renderSectionHeader("SKILLS & EXPERTISE");
    doc.x = 52;
    doc.font(fonts.regular).fontSize(9.5).fillColor("#374151").text(resume.skills.join(" • "));
  }

  if (resume.experience?.length) {
    renderSectionHeader("WORK EXPERIENCE");
    resume.experience.forEach((exp) => {
      doc.x = 52;
      doc.font(fonts.bold).fontSize(10.5).fillColor("#111827").text(exp.role || "Role", { continued: true });
      doc.font(fonts.regular).fillColor("#4b5563").text(` at ${exp.company || ""}`);
      const dateText = `${exp.startDate || ""} - ${exp.isCurrent ? "Present" : exp.endDate || ""}`;
      doc.font(fonts.italic).fontSize(9).fillColor("#6b7280").text(dateText);
      if (exp.description) {
        doc.font(fonts.regular).fontSize(9.5).fillColor("#374151").text(exp.description);
      }
      doc.moveDown(0.3);
    });
  }

  if (resume.internships?.length) {
    renderSectionHeader("INTERNSHIPS");
    resume.internships.forEach((intern) => {
      doc.x = 52;
      doc.font(fonts.bold).fontSize(10.5).fillColor("#111827").text(intern.role || "Intern", { continued: true });
      doc.font(fonts.regular).fillColor("#4b5563").text(` — ${intern.company || ""}`);
      if (intern.description) {
        doc.font(fonts.regular).fontSize(9.5).fillColor("#374151").text(intern.description);
      }
      doc.moveDown(0.3);
    });
  }

  if (resume.projects?.length) {
    renderSectionHeader("KEY PROJECTS");
    resume.projects.forEach((proj) => {
      doc.x = 52;
      doc.font(fonts.bold).fontSize(10).fillColor("#111827").text(proj.title || "Project", { continued: Boolean(proj.techStack?.length) });
      if (proj.techStack?.length) {
        doc.font(fonts.regular).fontSize(9).fillColor(theme).text(` (${proj.techStack.join(", ")})`);
      }
      if (proj.description) {
        doc.font(fonts.regular).fontSize(9.5).fillColor("#374151").text(proj.description);
      }
      doc.moveDown(0.3);
    });
  }

  if (resume.education?.length) {
    renderSectionHeader("EDUCATION");
    resume.education.forEach((edu) => {
      doc.x = 52;
      const deg = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(" in ");
      doc.font(fonts.bold).fontSize(10).fillColor("#111827").text(deg || "Degree");
      doc.font(fonts.regular).fontSize(9.5).fillColor("#4b5563").text(`${edu.institution || ""} [${edu.startYear || ""}-${edu.endYear || ""}]`);
      doc.moveDown(0.2);
    });
  }

  if (resume.certifications?.length || resume.achievements?.length || resume.languages?.length) {
    renderSectionHeader("ADDITIONAL DETAILS");
    doc.x = 52;
    if (resume.certifications?.length) {
      doc.font(fonts.bold).fontSize(9.5).fillColor("#111827").text("Certifications: ", { continued: true });
      doc.font(fonts.regular).fillColor("#374151").text(resume.certifications.map(c => `${c.name} (${c.issuer || ""})`).join(", "));
    }
    if (resume.languages?.length) {
      doc.font(fonts.bold).fontSize(9.5).fillColor("#111827").text("Languages: ", { continued: true });
      doc.font(fonts.regular).fillColor("#374151").text(resume.languages.join(", "));
    }
  }
}

// 3. Minimalist ATS Template (Clean, high-whitespace, classic typography)
function generateMinimalAtsTemplate(doc, resume, fonts) {
  const theme = resume.themeColor || "#334155";

  doc.font(fonts.bold).fontSize(20).fillColor("#0f172a").text(resume.fullName || "Untitled", { align: "left" });
  doc.moveDown(0.2);
  const contactParts = [resume.email, resume.phone, resume.address].filter(Boolean);
  doc.font(fonts.regular).fontSize(9).fillColor("#64748b").text(contactParts.join("   •   "));

  const links = Object.values(resume.socialLinks || {}).filter(Boolean);
  if (links.length) {
    doc.font(fonts.regular).fontSize(8.5).fillColor("#64748b").text(links.join("   •   "));
  }
  doc.moveDown(0.6);

  const renderSectionHeader = (title) => {
    doc.moveDown(0.4);
    doc.font(fonts.bold).fontSize(10).fillColor(theme).text(title.toUpperCase(), { characterSpacing: 1.5 });
    doc.strokeColor("#e2e8f0").lineWidth(0.8).moveTo(50, doc.y + 1).lineTo(550, doc.y + 1).stroke();
    doc.moveDown(0.4);
  };

  if (resume.careerObjective) {
    renderSectionHeader("Summary");
    doc.font(fonts.regular).fontSize(9.5).fillColor("#334155").text(resume.careerObjective, { lineGap: 2 });
  }

  if (resume.skills?.length) {
    renderSectionHeader("Core Competencies");
    doc.font(fonts.regular).fontSize(9.5).fillColor("#334155").text(resume.skills.join("   |   "));
  }

  if (resume.experience?.length) {
    renderSectionHeader("Experience");
    resume.experience.forEach((exp) => {
      doc.font(fonts.bold).fontSize(10).fillColor("#0f172a").text(exp.role || "", { continued: true });
      doc.font(fonts.regular).fillColor("#64748b").text(` — ${exp.company || ""}`, { continued: true });
      const dateText = `${exp.startDate || ""} - ${exp.isCurrent ? "Present" : exp.endDate || ""}`;
      doc.font(fonts.italic).fontSize(8.5).fillColor("#94a3b8").text(`   ${dateText}`);
      if (exp.description) {
        doc.font(fonts.regular).fontSize(9).fillColor("#334155").text(exp.description);
      }
      doc.moveDown(0.3);
    });
  }

  if (resume.internships?.length) {
    renderSectionHeader("Internships");
    resume.internships.forEach((intern) => {
      doc.font(fonts.bold).fontSize(10).fillColor("#0f172a").text(intern.role || "", { continued: true });
      doc.font(fonts.regular).fillColor("#64748b").text(` — ${intern.company || ""}`);
      if (intern.description) {
        doc.font(fonts.regular).fontSize(9).fillColor("#334155").text(intern.description);
      }
      doc.moveDown(0.3);
    });
  }

  if (resume.projects?.length) {
    renderSectionHeader("Projects");
    resume.projects.forEach((proj) => {
      doc.font(fonts.bold).fontSize(9.5).fillColor("#0f172a").text(proj.title || "", { continued: Boolean(proj.techStack?.length) });
      if (proj.techStack?.length) {
        doc.font(fonts.regular).fontSize(8.5).fillColor("#64748b").text(` (${proj.techStack.join(", ")})`);
      }
      if (proj.description) {
        doc.font(fonts.regular).fontSize(9).fillColor("#334155").text(proj.description);
      }
      doc.moveDown(0.3);
    });
  }

  if (resume.education?.length) {
    renderSectionHeader("Education");
    resume.education.forEach((edu) => {
      const deg = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(" in ");
      doc.font(fonts.bold).fontSize(9.5).fillColor("#0f172a").text(deg || "");
      doc.font(fonts.regular).fontSize(9).fillColor("#64748b").text(`${edu.institution || ""} (${edu.startYear || ""} - ${edu.endYear || ""})`);
      doc.moveDown(0.2);
    });
  }

  if (resume.certifications?.length || resume.languages?.length) {
    renderSectionHeader("Credentials & Languages");
    if (resume.certifications?.length) {
      doc.font(fonts.regular).fontSize(9).fillColor("#334155").text(`Certifications: ${resume.certifications.map(c => c.name).join(", ")}`);
    }
    if (resume.languages?.length) {
      doc.font(fonts.regular).fontSize(9).fillColor("#334155").text(`Languages: ${resume.languages.join(", ")}`);
    }
  }
}

// Master generator dispatcher
async function generateResumePdf(resume) {
  const outputDir = path.join(__dirname, "..", "generated-resumes");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const fileName = `resume-${resume._id}-${Date.now()}.pdf`;
  const filePath = path.join(outputDir, fileName);

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const fonts = getFontFamily(resume.fontFamily);

  if (resume.templateId === "modern-ats") {
    generateModernAtsTemplate(doc, resume, fonts);
  } else if (resume.templateId === "minimal-ats") {
    generateMinimalAtsTemplate(doc, resume, fonts);
  } else {
    // Default: classic-ats
    generateClassicAtsTemplate(doc, resume, fonts);
  }

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  return { filePath, fileName };
}

module.exports = { generateResumePdf };
