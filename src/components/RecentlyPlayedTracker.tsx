"use client";
import { useEffect } from "react";
export default function RecentlyPlayedTracker({ id }: { id: string }) {
  useEffect(() => { try { const key="fg-recent"; const ids: string[] = JSON.parse(localStorage.getItem(key) || "[]"); localStorage.setItem(key, JSON.stringify([id, ...ids.filter(x=>x!==id)].slice(0,30))); } catch {} }, [id]);
  return null;
}
