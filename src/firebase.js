// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider
} from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAnKH8UnhldVypvkn8bbUhNd-6QHI4TUeM",
  authDomain: "my-proj-c7766.firebaseapp.com",
  projectId: "my-proj-c7766",
  storageBucket: "my-proj-c7766.firebasestorage.app",
  messagingSenderId: "678737200251",
  appId: "1:678737200251:web:37a4f9edea209d1c894ede",
  measurementId: "G-WMM1Z4FYNK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const provider = new GoogleAuthProvider();