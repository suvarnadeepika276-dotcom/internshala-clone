const mongoose = require("mongoose");

const educationSchema = new mongoose.Schema(
  {
    institution: String,
    degree: String,
    fieldOfStudy: String,
    startYear: String,
    endYear: String,
    grade: String,
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    company: String,
    role: String,
    startDate: String,
    endDate: String,
    isCurrent: Boolean,
    description: String,
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    techStack: [String],
    link: String,
  },
  { _id: false }
);

const certificationSchema = new mongoose.Schema(
  {
    name: String,
    issuer: String,
    year: String,
  },
  { _id: false }
);

const referenceSchema = new mongoose.Schema(
  {
    name: String,
    relation: String,
    contact: String,
  },
  { _id: false }
);

const resumeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Personal details
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    address: String,
    profilePhotoUrl: String,
    careerObjective: String,

    education: [educationSchema],
    skills: [String],
    experience: [experienceSchema],
    internships: [experienceSchema],
    projects: [projectSchema],
    certifications: [certificationSchema],
    achievements: [String],
    languages: [String],
    socialLinks: {
      linkedin: String,
      github: String,
      portfolio: String,
      other: String,
    },
    references: [referenceSchema],

    // Template / styling
    templateId: { type: String, required: true, default: "classic-ats" },
    themeColor: { type: String, default: "#1a73e8" },
    fontFamily: { type: String, default: "Inter" },

    // Versioning
    versionName: { type: String, default: "Version 1" },
    isDefault: { type: Boolean, default: false },

    // Generation status - a resume is NOT generated/downloadable
    // until otpVerified AND paymentStatus === 'paid'
    otpVerified: { type: Boolean, default: false },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled"],
      default: "pending",
    },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "ResumePayment" },

    pdfUrl: String, // set once generation succeeds
    generatedAt: Date,

    isComplete: { type: Boolean, default: false }, // set true once required fields are validated
  },
  { timestamps: true }
);

// Ensure only one default resume per user
resumeSchema.pre("save", async function (next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

module.exports = mongoose.model("Resume", resumeSchema);
