import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function App() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [user, setUser] = useState(null);
  const [journalText, setJournalText] = useState("");
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState("");

  const sharedJournalDocId = "shared-journal";

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setError("");

      if (currentUser) {
        const entriesRef = collection(db, "journals", sharedJournalDocId, "entries");
        const q = query(entriesRef, orderBy("createdAt", "desc"));

        const unsubscribeEntries = onSnapshot(
          q,
          (querySnapshot) => {
            const newEntries = [];
            querySnapshot.forEach((doc) => {
              newEntries.push(doc.data());
            });
            console.log("Fetched entries:", newEntries); // DEBUG
            setEntries(newEntries);
          },
          (error) => {
            console.error("Error fetching entries:", error);
            setError("Error fetching entries: " + error.message);
          }
        );

        return unsubscribeEntries;
      } else {
        setEntries([]);
      }
    });

    return unsubscribeAuth;
  }, []);

  const login = async () => {
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      console.log("User logged in:", email); // DEBUG
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
    }
  };

  const register = async () => {
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      console.log("User registered:", email); // DEBUG
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message);
    }
  };

  const logout = () => {
    signOut(auth);
    console.log("User logged out"); // DEBUG
  };

  const onJournalChange = (e) => {
    setJournalText(e.target.value);
  };

  const saveEntry = async () => {
    if (user && journalText.trim()) {
      const entriesRef = collection(db, "journals", sharedJournalDocId, "entries");
      console.log("Trying to save entry:", journalText); // DEBUG
      try {
        await addDoc(entriesRef, {
          text: journalText.trim(),
          createdAt: serverTimestamp(),
        });
        console.log("Entry saved successfully."); // DEBUG
        setJournalText("");
      } catch (error) {
        console.error("Failed to save entry:", error.message);
        setError("Failed to save entry: " + error.message);
      }
    } else {
      console.log("Save skipped: no user logged in or empty journal text."); // DEBUG
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

      <p className="subtitle">Write a New Entry</p>
      <textarea
        className="journal-textarea"
        value={journalText}
        onChange={onJournalChange}
        placeholder="Write your journal here..."
        rows={6}
      />
      <button className="btn retro-btn" onClick={saveEntry}>
        Save Entry
      </button>

      {error && <p className="error">{error}</p>}

      <div className="entries">
        <h3>Past Entries</h3>
        {entries.length === 0 ? (
          <p>No entries yet.</p>
        ) : (
          entries.map((entry, index) => (
            <div key={index} className="entry-box">
              <p>{entry.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
