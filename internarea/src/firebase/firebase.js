// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDFQkBDclQLXXpNUZFMtEwjpUuNtWL3uU0",
    authDomain: "internarea-a128b.firebaseapp.com",
    projectId: "internarea-a128b",
    storageBucket: "internarea-a128b.firebasestorage.app",
    messagingSenderId: "185122343566",
    appId: "1:185122343566:web:a4c489fdba0afc87e557df"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const provider = new GoogleAuthProvider();
export { auth, provider };
