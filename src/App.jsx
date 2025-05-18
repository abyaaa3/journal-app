import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

export default function App() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [user, setUser] = useState(null);
  const [journalText, setJournalText] = useState("");
  const [error, setError] = useState("");

  const sharedJournalDocId = "shared-journal";

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setError("");
      if (currentUser) {
        const docRef = doc(db, "journals", sharedJournalDocId);
        const unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setJournalText(docSnap.data().text || "");
          } else {
            setJournalText("");
          }
        });
        return unsubscribeDoc;
      } else {
        setJournalText("");
      }
    });
    return unsubscribeAuth;
  }, []);

  const login = async () => {
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      setError(err.message);
    }
  };

  const register = async () => {
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      setError(err.message);
    }
  };

  const logout = () => signOut(auth);

  const onJournalChange = async (e) => {
    const newText = e.target.value;
    setJournalText(newText);
    if (user) {
      const docRef = doc(db, "journals", sharedJournalDocId);
      await setDoc(docRef, { text: newText });
    }
  };

  if (!user) {
    return (
      <div className="container fadeIn">
        <h1 className="title">Shared Journal</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />
        <input
          type="password"
          placeholder="Password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          className="input"
        />
        {error && <p className="error">{error}</p>}
        <div className="button-row">
          <button className="btn retro-btn" onClick={login}>
            Login
          </button>
          <button className="btn retro-btn" onClick={register}>
            Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container fadeIn">
      <header className="header">
        <h2 className="welcome">Welcome, {user.email}</h2>
        <button className="btn retro-btn" onClick={logout}>
          Logout
        </button>
      </header>
      <p className="subtitle">Your Shared Journal</p>
      <textarea
        className="journal-textarea"
        value={journalText}
        onChange={onJournalChange}
        placeholder="Write your journal here..."
        rows={20}
      />
    </div>
  );
}
