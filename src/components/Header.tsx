"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

const groups = [
  { title: "PLAYER", items: [{ label: "My Profile", href: "/profile" }, { label: "Edit Profile", href: "/profile" }, { label: "My Favorites", href: "/favorites" }, { label: "Recently Played", soon: true }] },
  { title: "PROGRESS & COMPETITION", items: [{ label: "Achievements", soon: true }, { label: "Tournaments", soon: true }, { label: "Leaderboards", soon: true }, { label: "Player Statistics", soon: true }, { label: "Rewards & Badges", soon: true }] },
  { title: "ACCOUNT & HELP", items: [{ label: "Account Settings", soon: true }, { label: "Privacy Settings", soon: true }, { label: "Notifications", soon: true }, { label: "Help & Support", soon: true }] },
];

export default function Header() {
  const [dark, setDark] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("fg-theme");
    const initial = saved ? saved === "dark" : true;
    setDark(initial);
    document.documentElement.dataset.theme = initial ? "dark" : "light";
  }, []);
  useEffect(() => {
    if (!auth) { setAuthLoaded(true); return; }
    return onAuthStateChanged(auth, current => { setUser(current); setAuthLoaded(true); });
  }, []);
  useEffect(() => {
    if (!open) return;
    const pointer = (event: PointerEvent) => { if (root.current && !root.current.contains(event.target as Node)) setOpen(false); };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", pointer);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", pointer); document.removeEventListener("keydown", key); };
  }, [open]);

  function toggleTheme() {
    const next = !dark; setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("fg-theme", next ? "dark" : "light");
  }
  function comingSoon(label: string) {
    const copy: Record<string, string> = {
      "Recently Played": "Recently played games are coming soon to Fun Ground.",
      "Achievements": "Achievements are coming soon to Fun Ground.",
      "Tournaments": "Tournaments are coming soon to Fun Ground.",
      "Leaderboards": "Leaderboards are coming soon to Fun Ground.",
      "Player Statistics": "Player statistics are coming soon to Fun Ground.",
      "Rewards & Badges": "Rewards and badges are coming soon to Fun Ground.",
      "Account Settings": "Account settings are coming soon to Fun Ground.",
      "Privacy Settings": "Privacy settings are coming soon to Fun Ground.",
      "Notifications": "Notifications are coming soon to Fun Ground.",
      "Help & Support": "Help and support are coming soon to Fun Ground."
    };
    setNotice(copy[label] || label + " is coming soon."); setOpen(false);
  }
  async function logout() {
    if (!auth) return;
    try { await signOut(auth); window.location.assign("/"); }
    catch { setNotice("We couldn't sign you out. Please try again."); setOpen(false); }
  }

  return <header className="site-header"><div className="header-inner">
    <Link className="brand" href="/" aria-label="Fun Ground home"><Image src="/fun-ground-logo.svg" alt="Fun Ground gaming logo" width={48} height={48} priority/><span>fun<span className="brand-accent">ground</span><small>PLAY. DISCOVER. REPEAT.</small></span></Link>
    <nav className="main-nav" aria-label="Main navigation"><Link href="/">Home</Link><Link href="/#categories">Categories</Link><Link href="/favorites">Favorites <span className="nav-heart">♥</span></Link></nav>
    <div className="header-actions">
      <div className="account-menu-wrap" ref={root}>
        <button ref={trigger} type="button" className={`account-header-link account-menu-trigger${!user && authLoaded ? " is-signed-out" : ""}`} aria-expanded={open} aria-haspopup="menu" onClick={() => { setOpen(v => !v); setNotice(""); }}>
          <span className="account-avatar" aria-hidden="true">{user?.photoURL ? <img src={user.photoURL} alt="" /> : (user?.displayName?.trim().charAt(0).toUpperCase() || "♟")}</span>
          <span>{!authLoaded ? "Loading…" : user ? (user.displayName || "Player Account") : "Sign In"}</span><span className="account-chevron">⌄</span>
        </button>
        {open && <div className="account-dropdown" role="menu" aria-label="Player account menu">
          <div className="account-menu-heading">{user ? "PLAYER ACCOUNT" : "WELCOME TO FUN GROUND"}</div>
          {!user && <><p className="account-menu-prompt">Sign in or create a free account to access your player profile and account features.</p><Link className="account-menu-item account-menu-primary" href="/sign-in?mode=signin" role="menuitem" onClick={() => setOpen(false)}>Sign In</Link><Link className="account-menu-item" href="/sign-in?mode=signup" role="menuitem" onClick={() => setOpen(false)}>Create Account</Link><div className="account-menu-divider" /></>}
          {groups.map(group => <section key={group.title}><div className="account-menu-section-label">{group.title}</div>{group.items.map(item => item.href
            ? <Link key={item.label} className="account-menu-item" href={item.href} role="menuitem" onClick={() => setOpen(false)}>{item.label}</Link>
            : <button key={item.label} type="button" className="account-menu-item account-menu-coming" role="menuitem" onClick={() => comingSoon(item.label)}>{item.label}<span>Coming Soon</span></button>) }<div className="account-menu-divider" /></section>)}
          {user && <button type="button" className="account-menu-item account-menu-signout" role="menuitem" onClick={logout}>Sign Out</button>}
        </div>}
      </div>
      <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} title={dark ? "Switch to light theme" : "Switch to dark theme"}>{dark ? "☀" : "☾"}</button>
      <Link className="header-cta" href="/#all-games">Explore games <span>↗</span></Link>
    </div>
  </div>{notice && <div className="account-menu-notice" role="status"><span>{notice}</span><button type="button" aria-label="Dismiss message" onClick={() => setNotice("")}>×</button></div>}</header>;
}
