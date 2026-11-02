"use client";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { readStoredIdList } from "@/lib/game-utils";
import { auth } from "@/lib/firebase";

export default function RecentlyPlayedTracker({ id }: { id: string }) {
  useEffect(() => {
    try {
      const key = "fg-recent";
      const ids = readStoredIdList(key);
      localStorage.setItem(key, JSON.stringify([id, ...ids.filter((x) => x !== id)].slice(0, 30)));
    } catch {}

    if (!auth || process.env.NEXT_PUBLIC_FG_ACTIVITY_TRACKING_ENABLED !== "true") return;

    let sessionId: string | null = null;
    let token: string | null = null;
    let stopped = false;

    const finishSession = () => {
      if (!sessionId || !token) return;
      const closingId = sessionId;
      const closingToken = token;
      sessionId = null;
      void fetch("/api/activity/session", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${closingToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: closingId }),
        keepalive: true,
      }).catch(() => {});
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      finishSession();
      token = null;
      if (!user) return;
      try {
        const idToken = await user.getIdToken();
        if (stopped || auth?.currentUser?.uid !== user.uid) return;
        const response = await fetch("/api/activity/session", {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ gameId: id }),
        });
        if (!response.ok) return;
        const data = await response.json() as { sessionId?: unknown };
        if (typeof data.sessionId !== "string") return;
        sessionId = data.sessionId;
        token = idToken;
        if (stopped || auth?.currentUser?.uid !== user.uid) finishSession();
      } catch {
        // Activity tracking is optional and must never interrupt game playback.
      }
    });

    window.addEventListener("pagehide", finishSession);
    return () => {
      stopped = true;
      finishSession();
      unsubscribe();
      window.removeEventListener("pagehide", finishSession);
    };
  }, [id]);

  return null;
}
