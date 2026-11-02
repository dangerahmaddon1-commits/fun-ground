"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

type Mode = "quick" | "ranked";
type QueueStatus = "idle" | "queued" | "busy";

export default function ChessMatchmaking() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [mode, setMode] = useState<Mode>("quick");
  const [status, setStatus] = useState<QueueStatus>("idle");
  const [queuedAt, setQueuedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!auth) {
      setAuthLoaded(true);
      return;
    }
    return onAuthStateChanged(auth, current => {
      setUser(current);
      setAuthLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (status !== "queued" || queuedAt === null) return;
    const update = () => setElapsed(Math.max(0, Math.floor((Date.now() - queuedAt) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [status, queuedAt]);

  useEffect(() => {
    if (!user || status !== "queued") return;
    let active = true;
    const checkQueue = async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/chess/queue?mode=${mode}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await response.json();
        if (!active) return;
        if (response.ok && data.status === "matched" && typeof data.matchId === "string") {
          window.location.assign(`/chess/match/${encodeURIComponent(data.matchId)}`);
        } else if (response.ok && data.status === "not_queued") {
          setStatus("idle");
          setQueuedAt(null);
          setNotice("Your matchmaking queue expired. Please try again.");
        } else if (!response.ok) {
          setNotice(data.error || "Could not check matchmaking status.");
        }
      } catch {
        if (active) setNotice("Connection interrupted. We will keep checking while this page stays open.");
      }
    };
    void checkQueue();
    const timer = window.setInterval(() => void checkQueue(), 2500);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [user, status, mode]);

  async function joinQueue() {
    if (!user) {
      setNotice("Sign in to find a human Chess opponent.");
      return;
    }
    if (mode === "ranked" && !user.emailVerified) {
      setNotice("Verify your account email before entering Ranked Match.");
      return;
    }
    setStatus("busy");
    setNotice("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/chess/queue", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not join matchmaking.");
      if (data.status === "matched" && typeof data.matchId === "string") {
        window.location.assign(`/chess/match/${encodeURIComponent(data.matchId)}`);
        return;
      }
      setQueuedAt(Date.now());
      setElapsed(0);
      setStatus("queued");
      setNotice("Searching for another player. You can cancel at any time.");
    } catch (error) {
      setStatus("idle");
      setNotice(error instanceof Error ? error.message : "Could not join matchmaking.");
    }
  }

  async function leaveQueue() {
    if (!user) return;
    setStatus("busy");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/chess/queue", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = await response.json();
      if (response.status === 409) {
        if (typeof data.matchId === "string") window.location.assign(`/chess/match/${encodeURIComponent(data.matchId)}`);
        else setNotice(data.error || "A match has already started. Reload to open it.");
        setStatus("queued");
        return;
      }
      if (!response.ok) throw new Error(data.error || "Could not leave matchmaking.");
      setStatus("idle");
      setQueuedAt(null);
      setNotice("You left the matchmaking queue.");
    } catch (error) {
      setStatus("queued");
      setNotice(error instanceof Error ? error.message : "Could not leave matchmaking.");
    }
  }

  async function switchToAi() {
    await leaveQueue();
    setNotice(mode === "ranked"
      ? "Switched to an unranked AI game. This game will not affect your rank or rewards."
      : "Switched to a casual AI game.");
  }

  const fallbackAfter = mode === "quick" ? 180 : 300;
  const canOfferAi = status === "queued" && elapsed >= fallbackAfter;
  const minutes = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const seconds = (elapsed % 60).toString().padStart(2, "0");

  if (process.env.NEXT_PUBLIC_CHESS_ONLINE_UI_ENABLED !== "true") return null;

  return (
    <section className="chess-info-card chess-online-card" aria-label="Online Chess matchmaking">
      <h2>Online Chess</h2>
      {!authLoaded ? <p>Checking your player account…</p> : !user ? <>
        <p>Sign in to play against another person.</p>
        <Link className="primary-button" href="/sign-in">Sign in to play</Link>
      </> : <>
        <div className="chess-mode-switch" aria-label="Online match type">
          <button type="button" className={mode === "quick" ? "active" : ""} disabled={status !== "idle"} onClick={() => { setMode("quick"); setNotice(""); }}>Quick Match</button>
          <button type="button" className={mode === "ranked" ? "active" : ""} disabled={status !== "idle"} onClick={() => { setMode("ranked"); setNotice(""); }}>Ranked</button>
        </div>
        <p>{mode === "ranked" ? "Ranked requires a verified email and only human matches count." : "Find a human opponent. AI fallback is always casual."}</p>
        {status === "queued" ? <>
          <p className="chess-queue-timer">Searching · {minutes}:{seconds}</p>
          <button type="button" className="secondary-button" onClick={leaveQueue}>Cancel search</button>
          {canOfferAi && <div className="chess-fallback-offer">
            <strong>{mode === "ranked" ? "Still searching?" : "No opponent yet?"}</strong>
            <p>{mode === "ranked" ? "You can switch to an unranked AI game. It will not affect your rank or rewards." : "You can switch to a casual AI game now."}</p>
            <button type="button" className="primary-button" onClick={switchToAi}>Play against AI</button>
          </div>}
        </> : <button type="button" className="primary-button" disabled={status === "busy"} onClick={joinQueue}>
          {status === "busy" ? "Please wait…" : mode === "ranked" ? "Find Ranked Match" : "Find Quick Match"}
        </button>}
      </>}
      {notice && <p className="chess-notice" role="status">{notice}</p>}
    </section>
  );
}
