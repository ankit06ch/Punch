// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyA0kT0msgHMrnF-4wMTEhAry9v9ESHL5lc",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "punch-c1409.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "punch-c1409",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "punch-c1409.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "400466785193",
  appId: process.env.FIREBASE_APP_ID || "1:400466785193:web:7b40bbe5f82ddbccf20ab8",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-B8NDKDG8VP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);