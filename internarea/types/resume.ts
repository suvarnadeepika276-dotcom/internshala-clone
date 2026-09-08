export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
  grade?: string;
}

export interface Experience {
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
}

export interface ResumeProject {
  title: string;
  description?: string;
  techStack?: string[];
  link?: string;
}

export interface Certification {
  name: string;
  issuer: string;
  year?: string;
}

export interface ResumeReference {
  name: string;
  relation: string;
  contact: string;
}

export interface Resume {
  _id?: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  profilePhotoUrl?: string;
  careerObjective?: string;
  education: Education[];
  skills: string[];
  experience: Experience[];
  internships: Experience[];
  projects: ResumeProject[];
  certifications: Certification[];
  achievements: string[];
  languages: string[];
  socialLinks: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    other?: string;
  };
  references: ResumeReference[];
  templateId: string;
  themeColor: string;
  fontFamily: string;
  versionName: string;
  isDefault: boolean;
  otpVerified: boolean;
  paymentStatus: "pending" | "paid" | "failed" | "cancelled";
  pdfUrl?: string;
}

export interface ResumePayment {
  _id: string;
  resumeId: string;
  razorpayOrderId: string;
  amount: number;
  status: "created" | "paid" | "failed" | "cancelled";
  invoiceNumber?: string;
  createdAt: string;
}
