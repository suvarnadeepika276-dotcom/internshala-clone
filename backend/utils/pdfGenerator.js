const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// Simple single-column ATS-friendly template.
// Add more functions here (e.g. generateModernTemplate) and switch
// on resume.templateId inside generateResumePdf if you add more templates.
function generateClassicAtsTemplate(doc, resume) {
  doc.fontSize(20).fillColor(resume.themeColor || "#1a73e8").text(resume.fullName, { align: "left" });
  doc.fontSize(10).fillColor("#333").text([resume.email, resume.phone, resume.address].filter(Boolean).join(" | "));
  doc.moveDown();

  if (resume.careerObjective) {
    doc.fontSize(13).fillColor("#000").text("Career Objective", { underline: true });
    doc.fontSize(10).fillColor("#333").text(resume.careerObjective);
    doc.moveDown();
  }

  if (resume.skills?.length) {
    doc.fontSize(13).fillColor("#000").text("Skills", { underline: true });
    doc.fontSize(10).fillColor("#333").text(resume.skills.join(", "));
    doc.moveDown();
  }

  if (resume.education?.length) {
    doc.fontSize(13).fillColor("#000").text("Education", { underline: true });
    resume.education.forEach((edu) => {
      doc
        .fontSize(10)
        .fillColor("#333")
        .text(`${edu.degree || ""} - ${edu.institution || ""} (${edu.startYear || ""}-${edu.endYear || ""})`);
    });
    doc.moveDown();
  }

  if (resume.experience?.length) {
    doc.fontSize(13).fillColor("#000").text("Work Experience", { underline: true });
    resume.experience.forEach((exp) => {
      doc.fontSize(11).fillColor("#000").text(`${exp.role} - ${exp.company}`);
      doc.fontSize(9).fillColor("#666").text(`${exp.startDate} - ${exp.isCurrent ? "Present" : exp.endDate}`);
      if (exp.description) doc.fontSize(10).fillColor("#333").text(exp.description);
      doc.moveDown(0.5);
    });
  }

  if (resume.internships?.length) {
    doc.fontSize(13).fillColor("#000").text("Internships", { underline: true });
    resume.internships.forEach((exp) => {
      doc.fontSize(11).fillColor("#000").text(`${exp.role} - ${exp.company}`);
      if (exp.description) doc.fontSize(10).fillColor("#333").text(exp.description);
      doc.moveDown(0.5);
    });
  }

  if (resume.projects?.length) {
    doc.fontSize(13).fillColor("#000").text("Projects", { underline: true });
    resume.projects.forEach((proj) => {
      doc.fontSize(11).fillColor("#000").text(proj.title);
      if (proj.techStack?.length) doc.fontSize(9).fillColor("#666").text(proj.techStack.join(", "));
      if (proj.description) doc.fontSize(10).fillColor("#333").text(proj.description);
      doc.moveDown(0.5);
    });
  }

  if (resume.certifications?.length) {
    doc.fontSize(13).fillColor("#000").text("Certifications", { underline: true });
    resume.certifications.forEach((cert) => {
      doc.fontSize(10).fillColor("#333").text(`${cert.name} - ${cert.issuer} (${cert.year || ""})`);
    });
    doc.moveDown();
  }

  if (resume.achievements?.length) {
    doc.fontSize(13).fillColor("#000").text("Achievements", { underline: true });
    doc.fontSize(10).fillColor("#333").text(resume.achievements.join(", "));
    doc.moveDown();
  }

  if (resume.languages?.length) {
    doc.fontSize(13).fillColor("#000").text("Languages", { underline: true });
    doc.fontSize(10).fillColor("#333").text(resume.languages.join(", "));
    doc.moveDown();
  }

  const links = Object.values(resume.socialLinks || {}).filter(Boolean);
  if (links.length) {
    doc.fontSize(13).fillColor("#000").text("Links", { underline: true });
    doc.fontSize(10).fillColor("#333").text(links.join(" | "));
    doc.moveDown();
  }

  if (resume.references?.length) {
    doc.fontSize(13).fillColor("#000").text("References", { underline: true });
    resume.references.forEach((ref) => {
      doc.fontSize(10).fillColor("#333").text(`${ref.name} (${ref.relation}) - ${ref.contact}`);
    });
  }
}

// Generates the PDF to disk and returns the file path.
// Swap the storage location for S3/Cloudinary upload in production -
// writing to local disk won't persist on most serverless hosts (e.g. Vercel).
async function generateResumePdf(resume) {
  const outputDir = path.join(__dirname, "..", "generated-resumes");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const fileName = `resume-${resume._id}-${Date.now()}.pdf`;
  const filePath = path.join(outputDir, fileName);

  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Template selection - only one template implemented here as an example;
  // add more template functions and branch on resume.templateId.
  generateClassicAtsTemplate(doc, resume);

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  return { filePath, fileName };
}

module.exports = { generateResumePdf };
