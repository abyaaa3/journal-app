import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyDRz7vTxCmhag63VoAHuatw6XOsA8R1pjo",
  authDomain: "my-journal-5f55a.firebaseapp.com",
  projectId: "my-journal-5f55a",
  storageBucket: "my-journal-5f55a.appspot.com",  // fix domain here
  messagingSenderId: "225670581218",
  appId: "1:225670581218:web:06e1f3d95eb4dd104247bb"
};

const app = initializeApp(firebaseConfig);

// Export auth for use in App.jsx
export const auth = getAuth(app);

export const db = getFirestore(app);