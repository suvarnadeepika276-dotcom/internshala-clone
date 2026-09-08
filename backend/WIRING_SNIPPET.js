// This is NOT a new file to add - it's a snippet showing what to add
// to your EXISTING backend/index.js.

// 1. Near your other route imports, add:
const resumeRoutes = require("./routes/resume");

// 2. Near your other app.use(...) route mounts, add:
app.use("/api/resume", resumeRoutes);

// 3. Serve the generated PDFs statically (dev-only approach - see note
//    in utils/pdfGenerator.js about swapping this for S3/Cloudinary in prod):
app.use("/generated-resumes", express.static(require("path").join(__dirname, "generated-resumes")));

// 4. Make sure these are in your .env (backend/.env):
//    SMTP_HOST=
//    SMTP_PORT=
//    SMTP_USER=
//    SMTP_PASS=
//    SMTP_FROM=
//    RAZORPAY_KEY_ID=
//    RAZORPAY_KEY_SECRET=
//    FIREBASE_PROJECT_ID=
//    FIREBASE_CLIENT_EMAIL=
//    FIREBASE_PRIVATE_KEY=
