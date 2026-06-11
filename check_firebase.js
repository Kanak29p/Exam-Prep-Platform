import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, setDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAnKH8UnhldVypvkn8bbUhNd-6QHI4TUeM",
  authDomain: "my-proj-c7766.firebaseapp.com",
  projectId: "my-proj-c7766",
  storageBucket: "my-proj-c7766.firebasestorage.app",
  messagingSenderId: "678737200251",
  appId: "1:678737200251:web:37a4f9edea209d1c894ede",
  measurementId: "G-WMM1Z4FYNK"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  try {
    const querySnapshot = await getDocs(collection(db, "question_details"));
    console.log("Docs found:", querySnapshot.docs.length);
  } catch (e) {
    console.error("Error:", e.message);
  }
}

check();
