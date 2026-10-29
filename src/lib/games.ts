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
  const map = new Map<string, { slug: string; name: string; count: number }>();
  for (const game of games) {
    const seen = new Set<string>();
    for (const cat of game.categories ?? []) {
      const slug = cat?.slug?.trim();
      const name = cat?.name?.trim();
      if (!slug || !name || seen.has(slug)) continue;
      seen.add(slug);
      const current = map.get(slug);
      if (current) current.count += 1;
      else map.set(slug, { slug, name, count: 1 });
    }
  }
  return [...map.values()].sort((a,b) => a.name.localeCompare(b.name));
}
export function developerDisplayName(value?: string | null) {
  const name = value?.trim();
  return name && !/^(?:null|undefined|n\/?a|unknown)$/i.test(name) ? name : undefined;
}
export function plainDescription(value?: string) {
  return (value ?? "Play this free online game on Fun Ground.").replace(/\s+/g, " ").trim();
}

