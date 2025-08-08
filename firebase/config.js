// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA0kT0msgHMrnF-4wMTEhAry9v9ESHL5lc",
  authDomain: "punch-c1409.firebaseapp.com",
  projectId: "punch-c1409",
  storageBucket: "punch-c1409.firebasestorage.app",
  messagingSenderId: "400466785193",
  appId: "1:400466785193:web:7b40bbe5f82ddbccf20ab8",
  measurementId: "G-B8NDKDG8VP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);