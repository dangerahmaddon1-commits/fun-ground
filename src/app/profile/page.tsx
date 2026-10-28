"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { onAuthStateChanged, sendEmailVerification, signOut, User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, firebaseConfigured, storage } from "@/lib/firebase";

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
      setAvatarUrl(current.photoURL || "");
      if (db) {
        try {
          const snapshot = await getDoc(doc(db, "users", current.uid));
          if (snapshot.exists()) {
            const data = snapshot.data();
            setDisplayName(data.displayName || current.displayName || "");
            setBio(data.bio || "");
            setVisibility(data.visibility === "private" ? "private" : "public");
            setAvatarUrl(data.avatarUrl || current.photoURL || "");
          }
        } catch { setNotice("Could not load the saved profile. Check Firebase Firestore rules and setup."); }
      }
      setLoading(false);
    });
  }, []);

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user || !storage) return;
    if (!file.type.startsWith("image/")) { setNotice("Please choose an image file."); return; }
    if (file.size > 2 * 1024 * 1024) { setNotice("Please choose an image under 2 MB."); return; }
    setBusy(true); setNotice("");
    try {
      const avatarRef = ref(storage, `avatars/${user.uid}/profile`);
      await uploadBytes(avatarRef, file, { contentType: file.type });
      const url = await getDownloadURL(avatarRef);
      setAvatarUrl(url);
      setNotice("Avatar uploaded. Save your profile to keep the change.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Avatar upload failed."); }
    finally { setBusy(false); event.target.value = ""; }
  }

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
        <div className="avatar-editor"><div className="profile-avatar">{avatarUrl ? <img src={avatarUrl} alt="Your avatar"/> : <span>🎮</span>}</div><label className="avatar-upload">Upload avatar<input type="file" accept="image/*" onChange={uploadAvatar} disabled={busy}/></label><small>Image files only, up to 2 MB.</small></div>
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
