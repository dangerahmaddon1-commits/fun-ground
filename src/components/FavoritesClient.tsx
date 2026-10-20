"use client";
import { useEffect, useState } from "react";
import type { Game } from "@/types/game";
import type { categoriesFrom } from "@/lib/games";
import GameCard from "@/components/GameCard";
export default function FavoritesClient({ games }: { games: Game[]; categories: {slug:string;name:string}[] }) {
  const [ids,setIds] = useState<string[]>([]); const [recent,setRecent] = useState<string[]>([]);
  useEffect(() => { const load=()=>{try{setIds(JSON.parse(localStorage.getItem("fg-favorites")||"[]"));setRecent(JSON.parse(localStorage.getItem("fg-recent")||"[]"));}catch{}};load();window.addEventListener("fg-favorites-updated",load);window.addEventListener("storage",load);return()=>{window.removeEventListener("fg-favorites-updated",load);window.removeEventListener("storage",load);};},[]);
  const byId = new Map(games.map(g=>[g.id,g])); const favorites=ids.map(id=>byId.get(id)).filter((g):g is Game=>Boolean(g)); const played=recent.map(id=>byId.get(id)).filter((g):g is Game=>Boolean(g));
  return <><section className="favorites-block"><div className="section-heading"><div><h2>Saved games</h2><p>{favorites.length} saved on this device</p></div></div>{favorites.length?<div className="game-grid">{favorites.map((g,i)=><GameCard key={g.id} game={g} index={i}/>)}</div>:<div className="empty-state"><span>♡</span><h3>Your favorites will show up here</h3><p>Tap the heart on any game card to save it for later.</p></div>}</section><section className="favorites-block"><div className="section-heading"><div><h2>Recently played</h2><p>Pick up where you left off.</p></div></div>{played.length?<div className="game-grid">{played.map((g,i)=><GameCard key={g.id} game={g} index={i}/>)}</div>:<div className="empty-state compact-empty"><span>◷</span><h3>No games played yet</h3><p>Start a game and it will appear here.</p></div>}</section></>;
}
