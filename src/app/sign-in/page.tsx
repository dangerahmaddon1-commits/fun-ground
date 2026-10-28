"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, firebaseConfigured } from "@/lib/firebase";

export default function SignInPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveProfile(user: NonNullable<typeof auth>["currentUser"], name?: string) {
    if (!db || !user) return;
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      displayName: name || user.displayName || user.email?.split("@")[0] || "Player",
      email: user.email || "",
      bio: "",
      avatarUrl: user.photoURL || "",
      visibility: "public",
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!auth || !db) { setNotice("Account setup is not finished yet. The site owner needs to add the Firebase web app settings and enable Authentication."); return; }
    setBusy(true); setNotice("");
    try {
      if (mode === "signup") {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const name = displayName.trim() || email.split("@")[0];
        await updateProfile(credential.user, { displayName: name });
        await saveProfile(credential.user, name);
        await sendEmailVerification(credential.user);
        setNotice("Account created. Check your email for the verification link, then return to sign in.");
      } else {
        const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
        if (!credential.user.emailVerified) {
          await sendEmailVerification(credential.user);
          setNotice("Please verify your email first. We sent another verification link.");
          await auth.signOut();
          return;
        }
        await saveProfile(credential.user);
        window.location.href = "/profile";
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  }

  async function googleSignIn() {
    if (!auth || !db) { setNotice("Account setup is not finished yet. The site owner needs to add the Firebase web app settings and enable Authentication."); return; }
    setBusy(true); setNotice("");
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      await saveProfile(result.user);
      window.location.href = "/profile";
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Google sign-in failed. Please try again.");
    } finally { setBusy(false); }
  }

  return <section className="account-page">
    <div className="account-card">
      <Link className="account-back" href="/">← Back to Fun Ground</Link>
      <span className="eyebrow">YOUR PLAYER SPACE</span>
      <h1>{mode === "signup" ? "Join the fun." : "Welcome back."}</h1>
      <p className="account-subtitle">Create a player profile or sign in. You can still play games without an account.</p>
      {!firebaseConfigured && <div className="account-setup-note"><strong>Setup still needed</strong><br/>The account screens are being prepared, but Firebase credentials and provider settings have not been connected to this deployment yet.</div>}
      <button className="google-account-button" type="button" onClick={googleSignIn} disabled={busy}>Continue with Google</button>
      <div className="account-divider"><span>or use email</span></div>
      <form className="account-form" onSubmit={submit}>
        {mode === "signup" && <label>Display name<input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your player name" maxLength={32} autoComplete="nickname"/></label>}
        <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email"/></label>
        <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode === "signup" ? "At least 6 characters" : "Your password"} required minLength={6} autoComplete={mode === "signup" ? "new-password" : "current-password"}/></label>
        <button className="primary-button account-submit" disabled={busy} type="submit">{busy ? "Please wait…" : mode === "signup" ? "Create account →" : "Sign in →"}</button>
      </form>
      <button className="account-mode-switch" type="button" onClick={()=>{setMode(mode==="signup"?"signin":"signup");setNotice("");}}>{mode==="signup"?"Already have an account? Sign in":"New to Fun Ground? Create an account"}</button>
      <p className="account-reset">Password reset will be available once the Firebase project setup is completed.</p>
      {notice && <p className="account-notice" role="status">{notice}</p>}
    </div>
  </section>;
}
