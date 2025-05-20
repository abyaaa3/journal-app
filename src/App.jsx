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
  doc,
  deleteDoc,
} from "firebase/firestore";

export default function App() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [user, setUser] = useState(null);
  const [journalText, setJournalText] = useState("");
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("write"); // write or view

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
              newEntries.push({ id: doc.id, ...doc.data() });
            });
            setEntries(newEntries);
          },
          (error) => {
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

  const logout = () => {
    signOut(auth);
  };

  const onJournalChange = (e) => {
    setJournalText(e.target.value);
  };

  const saveEntry = async () => {
    if (user && journalText.trim()) {
      const entriesRef = collection(db, "journals", sharedJournalDocId, "entries");
      try {
        await addDoc(entriesRef, {
          text: journalText.trim(),
          createdAt: serverTimestamp(),
        });
        setJournalText("");
      } catch (error) {
        setError("Failed to save entry: " + error.message);
      }
    }
  };

  const deleteEntry = async (entryId) => {
    if (!entryId) return;
    if (!window.confirm("Are you sure you want to delete this entry?")) return;

    try {
      const entryDocRef = doc(db, "journals", sharedJournalDocId, "entries", entryId);
      await deleteDoc(entryDocRef);
    } catch (error) {
      setError("Failed to delete entry: " + error.message);
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

      <div className="tab-buttons">
        <button
          className={`btn retro-btn ${activeTab === "write" ? "active" : ""}`}
          onClick={() => setActiveTab("write")}
        >
          Write
        </button>
        <button
          className={`btn retro-btn ${activeTab === "view" ? "active" : ""}`}
          onClick={() => setActiveTab("view")}
        >
          View
        </button>
      </div>

      {activeTab === "write" && (
        <>
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
        </>
      )}

      {activeTab === "view" && (
        <div className="entries">
          <h3>Past Entries</h3>
          {entries.length === 0 ? (
            <p>No entries yet.</p>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="entry-box">
                <p>{entry.text}</p>
                <small>
                  {entry.createdAt?.toDate
                    ? entry.createdAt.toDate().toLocaleString()
                    : ""}
                </small>
                <button
                  className="btn retro-btn delete-btn"
                  onClick={() => deleteEntry(entry.id)}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
}
