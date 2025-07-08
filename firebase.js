// firebase.js

// Import Firebase core + modules you'll use
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC-CkRS-G6Sn0q-Y-1GeZHhcWVzF46nJ7o",
  authDomain: "to-do-list-eb8d4.firebaseapp.com",
  projectId: "to-do-list-eb8d4",
  storageBucket: "to-do-list-eb8d4.firebasestorage.app",
  messagingSenderId: "428984898670",
  appId: "1:428984898670:web:717f82efd146a9a4cb427f",
  measurementId: "G-YDT86QCRMR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services for use in other modules
export const auth = getAuth(app);
export const db = getFirestore(app);
