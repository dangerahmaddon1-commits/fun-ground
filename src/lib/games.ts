import fs from "node:fs";
import path from "node:path";
import type { Game } from "@/types/game";

const dataPath = path.join(process.cwd(), "data", "games.json");
let cachedGames: Game[] | undefined;
export function getGames(): Game[] {
  if (cachedGames) return cachedGames;
  try {
    const raw = fs.readFileSync(dataPath, "utf8");
    const parsed = JSON.parse(raw);
    const games = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.games) ? parsed.games : [];
    cachedGames = games as Game[];
    return cachedGames;
  } catch (error) {
    console.error("Could not read data/games.json", error);
    return [];
  }
}
export function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "game";
}
export function gamePath(game: Game) { return `/game/${encodeURIComponent(game.id)}/${slugify(game.name)}`; }
export function categoriesFrom(games: Game[]) {
  const map = new Map<string, string>();
  for (const game of games) for (const cat of game.categories ?? []) {
    if (cat?.name && cat?.slug) map.set(cat.slug, cat.name);
  }
  return [...map.entries()].map(([slug, name]) => ({ slug, name })).sort((a,b) => a.name.localeCompare(b.name));
}
export function plainDescription(value?: string) {
  return (value ?? "Play this free online game on Fun Ground.").replace(/\s+/g, " ").trim();
}
