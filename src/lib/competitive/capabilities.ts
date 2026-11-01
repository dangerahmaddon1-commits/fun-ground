import type { Game } from "@/types/game";
export type Capability = "activity-only" | "results-verified" | "multiplayer-supported";
type Review = { gameId: string; capabilities: readonly Capability[]; evidence: readonly string[]; reviewedAt: string };
const reviews: Readonly<Record<string, Review>> = Object.freeze({});
export function getCapabilities(game: Pick<Game, "id">): readonly Capability[] { return reviews[game.id]?.capabilities ?? []; }
export function isRankedEligible(game: Pick<Game, "id">): boolean { return getCapabilities(game).includes("results-verified"); }
export function isMultiplayerIntegrated(game: Pick<Game, "id">): boolean { return getCapabilities(game).includes("multiplayer-supported"); }
