"use client";
import Script from "next/script";
import { useEffect } from "react";
declare global { interface Window { adsbygoogle?: unknown[] } }
export default function AdUnit({ slot, label = "Advertisement" }: { slot?: string; label?: string }) {
  const enabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  useEffect(() => {
    if (!enabled || !client || !slot) return;
    try { window.adsbygoogle = window.adsbygoogle || []; window.adsbygoogle.push({}); } catch (error) { console.warn("AdSense initialization deferred", error); }
  }, [enabled, client, slot]);
  if (!enabled || !client || !slot) return null;
  return <div className="ad-unit" aria-label={label}><Script async strategy="afterInteractive" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`} crossOrigin="anonymous"/><ins className="adsbygoogle" style={{ display: "block", minHeight: "90px" }} data-ad-client={client} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true"/></div>;
}
