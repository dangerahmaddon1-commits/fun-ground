"use client";
import { useEffect, useRef, useState } from "react";
export default function GamePlayer({ src, title }: { src: string; title: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [full, setFull] = useState(false);
  useEffect(() => { const sync = () => setFull(document.fullscreenElement === frameRef.current); document.addEventListener("fullscreenchange", sync); return () => document.removeEventListener("fullscreenchange", sync); }, []);
  async function toggleFullscreen() {
    const frame = frameRef.current;
    if (!frame) return;
    try {
      if (document.fullscreenElement) { await document.exitFullscreen(); setFull(false); }
      else { await frame.requestFullscreen(); setFull(true); }
    } catch { /* Fullscreen can be unavailable in some browsers or embedded contexts. */ }
  }
  return <><iframe ref={frameRef} className="game-iframe" src={src} title={`Play ${title}`} allow="autoplay; fullscreen; gamepad; clipboard-read; clipboard-write" allowFullScreen loading="eager" referrerPolicy="strict-origin-when-cross-origin"/><div className="player-control-row"><span>Use fullscreen for a larger play area.</span><button className="secondary-button" type="button" onClick={toggleFullscreen}>{full ? "↙ Exit fullscreen" : "⛶ Fullscreen"}</button></div></>;
}
