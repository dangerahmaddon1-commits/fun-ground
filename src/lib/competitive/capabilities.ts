import type { Game } from "@/types/game";

export type Capability = "activity-only" | "results-verified" | "multiplayer-supported";

type Review = {
  gameId: string;
  capabilities: readonly Capability[];
  evidence: readonly string[];
  reviewedAt: string;
};

// Add a game only after the manual integration approval checklist in
// docs/v0.3.0-development.md has been completed and its evidence is linked.
const reviews: Readonly<Record<string, Review>> = Object.freeze({});

const allowedCapabilities: readonly Capability[] = [
  "activity-only",
  "results-verified",
  "multiplayer-supported",
];

function isApprovedReview(gameId: string, review: Review | undefined): review is Review {
  if (!review || review.gameId !== gameId) return false;
  if (!Array.isArray(review.capabilities) || review.capabilities.length === 0) return false;
  if (!review.capabilities.every((capability) => allowedCapabilities.includes(capability))) return false;
  if (!Array.isArray(review.evidence) || review.evidence.length === 0) return false;
  if (!review.evidence.every((url) => typeof url === "string" && /^https:\/\/\S+$/i.test(url))) return false;

  const reviewedAt = Date.parse(review.reviewedAt);
  return Number.isFinite(reviewedAt) && reviewedAt <= Date.now();
}

export function getCapabilities(game: Pick<Game, "id">): readonly Capability[] {
  const review = reviews[game.id];
  return isApprovedReview(game.id, review) ? review.capabilities : [];
}

export function isRankedEligible(game: Pick<Game, "id">): boolean {
  return getCapabilities(game).includes("results-verified");
}

export function isMultiplayerIntegrated(game: Pick<Game, "id">): boolean {
  return getCapabilities(game).includes("multiplayer-supported");
}
