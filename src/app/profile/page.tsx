"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { onAuthStateChanged, sendEmailVerification, signOut, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, firebaseConfigured } from "@/lib/firebase";

type ProfileDraft = {
  displayName: string;
  bio: string;
  visibility: "public" | "private";
  avatarUrl: string;
};

function errorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code)
    : "";
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [savedProfile, setSavedProfile] = useState<ProfileDraft | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  function applyProfile(profile: ProfileDraft) {
    setDisplayName(profile.displayName);
    setBio(profile.bio);
    setVisibility(profile.visibility);
    setAvatarUrl(profile.avatarUrl);
  }

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    return onAuthStateChanged(auth, async current => {
      setUser(current);
      if (!current) { setSavedProfile(null); setLoading(false); return; }

      let hasPendingNotice = false;
      try {
        const pendingNotice = window.sessionStorage.getItem("fg-profile-save-notice");
        if (pendingNotice) {
          hasPendingNotice = true;
          setNotice(pendingNotice);
          window.sessionStorage.removeItem("fg-profile-save-notice");
        }
      } catch {}

      const fallback: ProfileDraft = {
        displayName: current.displayName || "",
        bio: "",
        visibility: "public",
        avatarUrl: current.photoURL || "🎮",
      };
      applyProfile(fallback);
      setSavedProfile(fallback);

      if (db) {
        try {
          const snapshot = await getDoc(doc(db, "users", current.uid));
          if (snapshot.exists()) {
            const data = snapshot.data();
            const saved: ProfileDraft = {
              displayName: data.displayName || current.displayName || "",
              bio: data.bio || "",
              visibility: data.visibility === "private" ? "private" : "public",
              avatarUrl: data.avatarUrl || current.photoURL || "🎮",
            };
            applyProfile(saved);
            setSavedProfile(saved);
          }
        } catch {
          if (!hasPendingNotice) setNotice("You are signed in, but the saved profile could not be loaded. Profile permissions may need to be updated.");
        }
      }
      setLoading(false);
    });
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !db) { setNotice("Account setup is not complete yet."); return; }
    const name = displayName.trim();
    if (!name) { setNotice("Please enter a display name."); return; }
    setBusy(true);
    setNotice("");
    const saved: ProfileDraft = { displayName: name, bio: bio.trim().slice(0, 160), visibility, avatarUrl };
    try {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: saved.displayName,
        email: user.email || "",
        bio: saved.bio,
        avatarUrl: saved.avatarUrl,
        visibility: saved.visibility,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      applyProfile(saved);
      setSavedProfile(saved);
      setNotice("Profile saved.");
    } catch (error) {
      setNotice(errorCode(error) === "permission-denied"
        ? "Profile permissions are not active yet, so these changes were not saved. Please try again later."
        : "We couldn't save your profile. Check your connection and try again.");
    } finally { setBusy(false); }
  }

  function discardChanges() {
    if (!savedProfile) return;
    applyProfile(savedProfile);
    setNotice("Changes discarded.");
  }

  async function leave() {
    if (!auth) return;
    await signOut(auth);
    window.location.assign("/");
  }

  if (loading) return <section className="account-page"><div className="account-card"><p>Loading your player profile…</p></div></section>;
  if (!firebaseConfigured) return <section className="account-page"><div className="account-card"><span className="eyebrow">PLAYER PROFILE</span><h1>Almost ready.</h1><p className="account-subtitle">Firebase has not been connected to this deployment yet. You can continue playing games as a guest.</p><Link className="primary-button account-submit" href="/sign-in">Go to sign in</Link></div></section>;
  if (!user) return <section className="account-page"><div className="account-card"><span className="eyebrow">PLAYER PROFILE</span><h1>Sign in first.</h1><p className="account-subtitle">Sign in to create and manage your player profile.</p><Link className="primary-button account-submit" href="/sign-in">Sign in →</Link></div></section>;

  return <section className="account-page">
    <div className="account-card account-card-wide">
      <Link className="account-back" href="/">← Back to Fun Ground</Link>
      <span className="eyebrow">YOUR PLAYER SPACE</span>
      <h1>Player profile</h1>
      <p className="account-subtitle">Personalize your profile. Your email is not displayed as your public name.</p>
      {!user.emailVerified && user.providerData.some(p=>p.providerId === "password") && <div className="account-setup-note"><strong>Email not verified</strong><br/><button type="button" className="account-inline-button" onClick={async()=>{try{await sendEmailVerification(user);setNotice("Verification email sent.");}catch{setNotice("Could not send the verification email. Check your connection and try again.");}}}>Resend verification email</button></div>}
      <form className="account-form" onSubmit={saveProfile}>
        <div className="avatar-editor"><div className="profile-avatar">{avatarUrl.startsWith("http") ? <img src={avatarUrl} alt="Your avatar"/> : <span>{avatarUrl || "🎮"}</span>}</div><label>Choose an avatar<select value={avatarUrl.startsWith("http") ? "🎮" : (avatarUrl || "🎮")} onChange={e=>setAvatarUrl(e.target.value)}><option value="🎮">🎮 Gamepad</option><option value="👾">👾 Alien</option><option value="🐉">🐉 Dragon</option><option value="🦊">🦊 Fox</option><option value="🐺">🐺 Wolf</option><option value="🚀">🚀 Rocket</option><option value="⚡">⚡ Lightning</option><option value="🔥">🔥 Flame</option><option value="❄️">❄️ Frost</option><option value="🌟">🌟 Star</option></select></label><small>Custom image uploads can be added later if you enable Firebase Storage.</small></div>
        <label>Display name<input value={displayName} onChange={e=>setDisplayName(e.target.value)} maxLength={32} required/></label>
        <label>Bio <span className="account-char-count">{bio.length}/160</span><textarea value={bio} onChange={e=>setBio(e.target.value.slice(0,160))} rows={4} maxLength={160} placeholder="A little about you (optional)"/></label>
        <label>Profile visibility<select value={visibility} onChange={e=>setVisibility(e.target.value as "public"|"private")}><option value="public">Public</option><option value="private">Private</option></select><small className="account-help">This preference is saved to your profile. Other players cannot browse profiles yet, even when Public is selected.</small></label>
        <div className="account-actions"><button className="primary-button account-submit" type="submit" disabled={busy}>{busy ? "Saving…" : "Save profile →"}</button><button className="secondary-button account-submit" type="button" onClick={discardChanges} disabled={busy || !savedProfile}>Discard changes</button></div>
      </form>
      {notice && <p className="account-notice" role="status">{notice}</p>}
      <button className="account-mode-switch" type="button" onClick={leave}>Sign out</button>
    </div>
  </section>;
}

