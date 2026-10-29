"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, firebaseConfigured } from "@/lib/firebase";

const profileSaveNotice = "Your sign-in worked, but the player profile could not be saved. Please try saving again from your profile page.";

function errorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code)
    : "";
}

function authErrorMessage(error: unknown) {
  switch (errorCode(error)) {
    case "auth/invalid-email": return "Enter a valid email address.";
    case "auth/email-already-in-use": return "An account already uses this email. Choose Sign in instead.";
    case "auth/weak-password": return "Choose a password with at least 6 characters.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password": return "The email or password does not match an account.";
    case "auth/popup-closed-by-user": return "Google sign-in was closed before it finished. Try again when you're ready.";
    case "auth/popup-blocked": return "Your browser blocked the Google sign-in window. Allow pop-ups for Fun Ground and try again.";
    case "auth/unauthorized-domain": return "Google sign-in is not enabled for this website address yet.";
    case "auth/too-many-requests": return "There were too many attempts. Wait a little while, then try again.";
    case "auth/network-request-failed": return "We couldn't reach the sign-in service. Check your connection and try again.";
    default: return "We couldn't complete that request. Please check your details and try again.";
  }
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function SignInPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [resetOpen, setResetOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveProfile(user: User, name?: string) {
    if (!db) return;
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      displayName: name || user.displayName || user.email?.split("@")[0] || "Player",
      email: user.email || "",
      bio: "",
      avatarUrl: user.photoURL || "🎮",
      visibility: "public",
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  function rememberProfileSaveFailure() {
    try { window.sessionStorage.setItem("fg-profile-save-notice", profileSaveNotice); } catch {}
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim();
    const normalizedName = displayName.trim();
    if (!auth || !db) {
      setNotice("Account setup is not connected yet. Please try again later.");
      return;
    }
    if (!normalizedEmail) { setNotice("Enter your email address."); return; }
    if (!validEmail(normalizedEmail)) { setNotice("Enter a valid email address, such as name@example.com."); return; }
    if (mode === "signup" && !normalizedName) { setNotice("Choose a display name for your player profile."); return; }
    if (!password) { setNotice("Enter your password."); return; }
    if (mode === "signup" && password.length < 6) { setNotice("Choose a password with at least 6 characters."); return; }

    setBusy(true);
    setNotice("");
    try {
      if (mode === "signup") {
        const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        await updateProfile(credential.user, { displayName: normalizedName });
        let profileSaved = true;
        try { await saveProfile(credential.user, normalizedName); } catch { profileSaved = false; }
        await sendEmailVerification(credential.user);
        await auth.signOut();
        setMode("signin");
        setPassword("");
        setNotice(profileSaved
          ? "Account created. Check your email for the verification link, then sign in."
          : "Account created and verification email sent. Your player profile could not be saved yet; try again after signing in.");
      } else {
        const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        if (!credential.user.emailVerified) {
          await sendEmailVerification(credential.user);
          await auth.signOut();
          setNotice("Please verify your email first. We sent another verification link.");
          return;
        }
        try { await saveProfile(credential.user); } catch { rememberProfileSaveFailure(); }
        window.location.assign("/profile");
      }
    } catch (error) {
      setNotice(authErrorMessage(error));
    } finally { setBusy(false); }
  }

  async function resetPassword() {
    const normalizedEmail = email.trim();
    if (!auth) { setNotice("Account setup is not connected yet. Please try again later."); return; }
    if (!normalizedEmail) { setNotice("Enter your account email above first."); return; }
    if (!validEmail(normalizedEmail)) { setNotice("Check the email address above and try again."); return; }
    setBusy(true);
    setNotice("");
    try {
      await sendPasswordResetEmail(auth, normalizedEmail);
      setNotice("If an account exists for that email, Firebase will send a password-reset link. Check your inbox and spam folder.");
    } catch (error) { setNotice(authErrorMessage(error)); }
    finally { setBusy(false); }
  }

  async function googleSignIn() {
    if (!auth || !db) {
      setNotice("Account setup is not connected yet. Please try again later.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      try { await saveProfile(result.user); } catch { rememberProfileSaveFailure(); }
      window.location.assign("/profile");
    } catch (error) { setNotice(authErrorMessage(error)); }
    finally { setBusy(false); }
  }

  function switchMode() {
    setMode(mode === "signup" ? "signin" : "signup");
    setResetOpen(false);
    setNotice("");
    setPassword("");
  }

  return <section className="account-page">
    <div className="account-card">
      <Link className="account-back" href="/">← Back to Fun Ground</Link>
      <span className="eyebrow">YOUR PLAYER SPACE</span>
      <h1>{resetOpen ? "Reset your password." : mode === "signup" ? "Join the fun." : "Welcome back."}</h1>
      <p className="account-subtitle">Create a player profile or sign in. You can still play games without an account.</p>
      {!firebaseConfigured && <div className="account-setup-note"><strong>Setup still needed</strong><br/>The account screens are ready, but Firebase settings and sign-in providers still need to be connected.</div>}
      {!resetOpen && <>
        <button className="google-account-button" type="button" onClick={googleSignIn} disabled={busy}>Continue with Google</button>
        <div className="account-divider"><span>or use email</span></div>
      </>}
      <form className="account-form" onSubmit={event => { if (resetOpen) { event.preventDefault(); void resetPassword(); } else { void submit(event); } }} noValidate>
        {mode === "signup" && !resetOpen && <label>Display name<input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your player name" maxLength={32} autoComplete="nickname" required/></label>}
        <label>Email address<input id="account-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" aria-describedby={resetOpen ? "email-help" : undefined} required/></label>
        {!resetOpen && <label>Password<div className="password-input-wrap"><input id="account-password" type={passwordVisible ? "text" : "password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode === "signup" ? "At least 6 characters" : "Your password"} minLength={mode === "signup" ? 6 : undefined} autoComplete={mode === "signup" ? "new-password" : "current-password"} required/><button className="password-visibility" type="button" onClick={()=>setPasswordVisible(v=>!v)} aria-controls="account-password" aria-label={passwordVisible ? "Hide password" : "Show password"}>{passwordVisible ? "Hide" : "Show"}</button></div></label>}
        {!resetOpen && <button className="primary-button account-submit" disabled={busy} type="submit">{busy ? "Please wait…" : mode === "signup" ? "Create account →" : "Sign in →"}</button>}
      </form>
      {mode === "signin" && !resetOpen && <button className="account-mode-switch" type="button" onClick={()=>{setResetOpen(true);setNotice("");}}>Forgot your password?</button>}
      {resetOpen && <div className="account-reset-panel"><p id="email-help">Enter the email for your account above. We'll send a reset link if an account is registered with that address.</p><button className="primary-button account-submit" type="button" onClick={resetPassword} disabled={busy}>{busy ? "Sending…" : "Send password reset email"}</button><button className="account-mode-switch" type="button" onClick={()=>{setResetOpen(false);setNotice("");}}>Back to sign in</button></div>}
      {!resetOpen && <button className="account-mode-switch" type="button" onClick={switchMode}>{mode === "signup" ? "Already have an account? Sign in" : "New to Fun Ground? Create an account"}</button>}
      {notice && <p className="account-notice" role="status">{notice}</p>}
    </div>
  </section>;
}

