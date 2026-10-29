"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { onAuthStateChanged, sendEmailVerification, signOut, User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, firebaseConfigured } from "@/lib/firebase";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    return onAuthStateChanged(auth, async current => {
      setUser(current);
      if (!current) { setLoading(false); return; }
      setDisplayName(current.displayName || "");
      setAvatarUrl(current.photoURL || "🎮");
      if (db) {
        try {
          const snapshot = await getDoc(doc(db, "users", current.uid));
          if (snapshot.exists()) {
            const data = snapshot.data();
            setDisplayName(data.displayName || current.displayName || "");
            setBio(data.bio || "");
            setVisibility(data.visibility === "private" ? "private" : "public");
            setAvatarUrl(data.avatarUrl || current.photoURL || "🎮");
          }
        } catch { setNotice("Could not load the saved profile. Check Firebase Firestore rules and setup."); }
      }
      setLoading(false);
    });
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !db) { setNotice("Firebase setup is not complete."); return; }
    const name = displayName.trim();
    if (!name) { setNotice("Please enter a display name."); return; }
    setBusy(true); setNotice("");
    try {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: name,
        email: user.email || "",
        bio: bio.trim().slice(0, 160),
        avatarUrl,
        visibility,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setNotice("Profile saved.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save profile. Check Firestore rules."); }
    finally { setBusy(false); }
  }

  async function leave() {
    if (!auth) return;
    await signOut(auth);
    window.location.href = "/";
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
      {!user.emailVerified && user.providerData.some(p=>p.providerId==="password") && <div className="account-setup-note"><strong>Email not verified</strong><br/><button type="button" className="account-inline-button" onClick={async()=>{try{await sendEmailVerification(user);setNotice("Verification email sent.");}catch(e){setNotice(e instanceof Error?e.message:"Could not send verification email.");}}}>Resend verification email</button></div>}
      <form className="account-form" onSubmit={saveProfile}>
        <div className="avatar-editor"><div className="profile-avatar">{avatarUrl.startsWith("http") ? <img src={avatarUrl} alt="Your avatar"/> : <span>{avatarUrl || "🎮"}</span>}</div><label>Choose an avatar<select value={avatarUrl.startsWith("http") ? "🎮" : (avatarUrl || "🎮")} onChange={e=>setAvatarUrl(e.target.value)}><option value="🎮">🎮 Gamepad</option><option value="👾">👾 Alien</option><option value="🐉">🐉 Dragon</option><option value="🦊">🦊 Fox</option><option value="🐺">🐺 Wolf</option><option value="🚀">🚀 Rocket</option><option value="⚡">⚡ Lightning</option><option value="🔥">🔥 Flame</option><option value="❄️">❄️ Frost</option><option value="🌟">🌟 Star</option></select></label><small>Custom image uploads can be added later if you enable Firebase Storage.</small></div>
        <label>Display name<input value={displayName} onChange={e=>setDisplayName(e.target.value)} maxLength={32} required/></label>
        <label>Bio <span className="account-char-count">{bio.length}/160</span><textarea value={bio} onChange={e=>setBio(e.target.value.slice(0,160))} rows={4} maxLength={160} placeholder="A little about you (optional)"/></label>
        <label>Profile visibility<select value={visibility} onChange={e=>setVisibility(e.target.value as "public"|"private")}><option value="public">Public</option><option value="private">Private</option></select><small>Visibility is stored in your profile; public profile browsing is not enabled yet.</small></label>
        <button className="primary-button account-submit" type="submit" disabled={busy}>{busy?"Saving…":"Save profile →"}</button>
      </form>
      {notice && <p className="account-notice" role="status">{notice}</p>}
      <button className="account-mode-switch" type="button" onClick={leave}>Sign out</button>
    </div>
  </section>;
}
