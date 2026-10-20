"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import type { Game } from "@/types/game";
import { gamePath } from "@/lib/game-utils";
export default function GameCard({ game, index = 0 }: { game: Game; index?: number }) {
  const [favorite, setFavorite] = useState(false);
  useEffect(() => { try { setFavorite(JSON.parse(localStorage.getItem("fg-favorites") || "[]").includes(game.id)); } catch {} }, [game.id]);
  function toggle(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault(); e.stopPropagation();
    let ids: string[] = []; try { ids = JSON.parse(localStorage.getItem("fg-favorites") || "[]"); } catch {}
    ids = ids.includes(game.id) ? ids.filter(id => id !== game.id) : [...ids, game.id];
    localStorage.setItem("fg-favorites", JSON.stringify(ids)); setFavorite(ids.includes(game.id));
    window.dispatchEvent(new Event("fg-favorites-updated"));
  }
  return <article className="game-card"><Link href={gamePath(game)} className="game-card-link" aria-label={`Play ${game.name}`}>
    <div className="game-art">{game.image ? <img src={game.image} alt={`${game.name} game thumbnail`} loading={index < 8 ? "eager" : "lazy"} /> : <div className="no-art">🎮</div>}<span className="play-overlay">▶ Play</span></div>
    <div className="game-card-copy"><div className="game-card-title-row"><h3>{game.name}</h3><span className="card-arrow">↗</span></div><p>{game.categories?.[0]?.name || "Arcade"}</p></div>
  </Link><button className={`favorite-button ${favorite ? "is-favorite" : ""}`} onClick={toggle} aria-label={favorite ? `Remove ${game.name} from favorites` : `Add ${game.name} to favorites`} title={favorite ? "Remove favorite" : "Add to favorites"}>{favorite ? "♥" : "♡"}</button></article>;
}
