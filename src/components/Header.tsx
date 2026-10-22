"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
export default function Header() {
  const [dark, setDark] = useState(true);
  useEffect(() => { const saved = localStorage.getItem("fg-theme"); const initial = saved ? saved === "dark" : true; setDark(initial); document.documentElement.dataset.theme = initial ? "dark" : "light"; }, []);
  function toggleTheme() { const next = !dark; setDark(next); document.documentElement.dataset.theme = next ? "dark" : "light"; localStorage.setItem("fg-theme", next ? "dark" : "light"); }
  return <header className="site-header"><div className="header-inner">
    <Link className="brand" href="/" aria-label="Fun Ground home"><Image src="/fun-ground-logo.svg" alt="Fun Ground gaming logo" width={48} height={48} priority/><span>fun<span className="brand-accent">ground</span><small>PLAY. DISCOVER. REPEAT.</small></span></Link>
    <nav className="main-nav" aria-label="Main navigation"><Link href="/">Home</Link><Link href="/#categories">Categories</Link><Link href="/favorites">Favorites <span className="nav-heart">♥</span></Link></nav>
    <div className="header-actions"><button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} title={dark ? "Switch to light theme" : "Switch to dark theme"}>{dark ? "☀" : "☾"}</button><Link className="header-cta" href="/#all-games">Explore games <span>↗</span></Link></div>
  </div></header>;
}
