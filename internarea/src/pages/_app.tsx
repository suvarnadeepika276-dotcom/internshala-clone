import Footer from "@/Components/Fotter";
import Navbar from "@/Components/Navbar";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { store } from "../store/store";
import { Provider, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { auth } from "@/firebase/firebase";
import { login, logout } from "@/Feature/Userslice";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LanguageProvider } from "@/context/LanguageContext";
import FrenchOtpModal from "@/Components/Language/FrenchOtpModal";
import ChromeOtpModal from "@/Components/LoginTracking/ChromeOtpModal";

const API = process.env.NEXT_PUBLIC_API_URL || "https://internshala-clone-ahv9.onrender.com/api";

export default function App({ Component, pageProps }: AppProps) {
  function AuthListener() {
    const dispatch = useDispatch();
    const [showChromeOtp, setShowChromeOtp] = useState(false);
    const [chromeOtpEmail, setChromeOtpEmail] = useState("");
    const [mobileBlockMsg, setMobileBlockMsg] = useState("");
    const [firebaseUserRef, setFirebaseUserRef] = useState<any>(null);

    useEffect(() => {
      auth.onAuthStateChanged(async (authuser) => {
        if (authuser) {
          dispatch(
            login({
              uid: authuser.uid,
              photo: authuser.photoURL,
              name: authuser.displayName,
              email: authuser.email,
              phoneNumber: authuser.phoneNumber,
            })
          );

          // ── Call login-tracking after Firebase auth ──
          try {
            const token = await authuser.getIdToken();
            const sessionId = authuser.uid + "_" + Date.now();

            const res = await fetch(`${API}/login-tracking/log`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                userAgent: navigator.userAgent,
                sessionId,
              }),
            });

            const data = await res.json();

            if (data.blocked && data.reason === "time_restriction") {
              // Mobile time block — show message
              setMobileBlockMsg(data.message);
              // Sign them out
              auth.signOut();
              dispatch(logout());
            } else if (data.requiresOtp) {
              // Chrome OTP required
              setFirebaseUserRef(authuser);
              setChromeOtpEmail(authuser.email || "");
              setShowChromeOtp(true);

              // Auto-request OTP
              await fetch(`${API}/login-tracking/chrome-otp/request`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              });
            }
          } catch (err) {
            // Login tracking error shouldn't block the user
            console.log("Login tracking error:", err);
          }
        } else {
          dispatch(logout());
          setShowChromeOtp(false);
          setMobileBlockMsg("");
        }
      });
    }, [dispatch]);

    return (
      <>
        {/* Mobile time block overlay */}
        {mobileBlockMsg && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl">
              <div className="text-5xl mb-3">📱</div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Mobile Access Restricted</h2>
              <p className="text-sm text-gray-600 mb-4">{mobileBlockMsg}</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-700 mb-4">
                Mobile login is allowed only between <strong>10:00 AM – 1:00 PM IST</strong>
              </div>
              <button
                onClick={() => setMobileBlockMsg("")}
                className="px-5 py-2 bg-blue-600 text-white rounded-full text-sm font-medium"
              >
                OK, Got It
              </button>
            </div>
          </div>
        )}

        {/* Chrome OTP Modal */}
        {showChromeOtp && (
          <ChromeOtpModal
            email={chromeOtpEmail}
            firebaseUser={firebaseUserRef}
            onSuccess={() => setShowChromeOtp(false)}
            onCancel={() => {
              setShowChromeOtp(false);
              auth.signOut();
              dispatch(logout());
            }}
          />
        )}
      </>
    );
  }

  return (
    <Provider store={store}>
      <LanguageProvider>
        <AuthListener />
        <div className="bg-white">
          <ToastContainer/>
          <Navbar />
          <FrenchOtpModal />
          <Component {...pageProps} />
          <Footer />
        </div>
      </LanguageProvider>
    </Provider>
  );
}
