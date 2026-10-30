import type { Game } from "@/types/game";

// Pure utilities safe to import into browser-side components.
export function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "game";
}

export function gamePath(game: Game) {
  return `/game/${encodeURIComponent(game.id)}/${slugify(game.name)}`;
}

export function readStoredIdList(key: string): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}
