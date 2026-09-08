const { getApps, initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

// Initialize Firebase Admin only once
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  // Check for Bearer token
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Missing auth token",
    });
  }

  const idToken = authHeader.split(" ")[1];

  try {
    // Verify Firebase ID token
    const decoded = await getAuth().verifyIdToken(idToken);

    // Get your MongoDB User model
    const User = require("../Model/User");

    const user = await User.findOneAndUpdate(
      { firebaseUid: decoded.uid },
      {
        firebaseUid: decoded.uid,
        email: decoded.email,
        name: decoded.name,
        photo: decoded.picture,
      },
      { upsert: true, new: true }
    );

    req.user = user;
    next();
  } catch (err) {
    console.error("Firebase authentication error:", err);

    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}

module.exports = { requireAuth };