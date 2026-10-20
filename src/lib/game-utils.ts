import type { Game } from "@/types/game";

// Pure utilities safe to import into browser-side components.
export function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "game";
}

export function gamePath(game: Game) {
  return `/game/${encodeURIComponent(game.id)}/${slugify(game.name)}`;
}
