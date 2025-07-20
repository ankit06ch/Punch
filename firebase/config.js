import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA0kT0msgHMrnF-4wMTEhAry9v9ESHL5lc",
  authDomain: "punch-c1409.firebaseapp.com",
  projectId: "punch-c1409",
  storageBucket: "punch-c1409.appspot.com",
  messagingSenderId: "400466785193",
  appId: "1:400466785193:web:7b40bbe5f82ddbccf20ab8",
  measurementId: "G-B8NDKDG8VP",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);