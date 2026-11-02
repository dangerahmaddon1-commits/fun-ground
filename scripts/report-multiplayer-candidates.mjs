import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "data", "games.json");
const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
const games = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.games) ? parsed.games : [];
// Strong signals explicitly identify multiplayer, co-op, versus or player counts.
// Generic "online" and "local play" labels are retained separately as weak hints.
const strongTerms = /multiplayer|co[ -]?op|cooperative|\bversus\b|\bpvp\b|2[ -]?player|two[ -]?player/i;
const weakTerms = /\bonline\b|local play/i;
const negativeDescriptionTerms = /\b(?:no|not|without|isn't|is not|doesn't|does not|cannot|can't)\b[^.!?]{0,45}\b(?:multiplayer|co[ -]?op|cooperative|versus|pvp|2[ -]?player|two[ -]?player)\b|\b(?:multiplayer|co[ -]?op|cooperative|versus|pvp|2[ -]?player|two[ -]?player)\b[^.!?]{0,40}\b(?:not supported|unsupported|unavailable|isn't|is not|doesn't|does not)\b|\b(?:single[ -]?player only|solo only)\b/i;

function labels(values = [], pattern = strongTerms) {
  return values
    .map((item) => typeof item === "string" ? item : item?.name)
    .filter((value) => typeof value === "string" && pattern.test(value));
}

function descriptionEvidence(description) {
  const match = description.match(strongTerms);
  if (!match || match.index === undefined) return null;
  const start = Math.max(0, match.index - 55);
  const end = Math.min(description.length, match.index + match[0].length + 85);
  return description.slice(start, end).replace(/\s+/g, " ").trim();
}

const candidates = [];
const weakHints = [];

for (const game of games) {
  const values = [...(game.modes ?? []), ...(game.features ?? []), ...(game.tags ?? [])];
  const strongLabels = [...new Set(labels(values))];
  const weakLabels = [...new Set(labels(values, weakTerms))];
  const description = typeof game.description === "string" ? game.description : "";
  const evidence = descriptionEvidence(description);
  const descriptionContradicts = negativeDescriptionTerms.test(description);

  // Do not promote a description-only match when the same description
  // explicitly says the game has no multiplayer/co-op support.
  if (descriptionContradicts && strongLabels.length === 0) continue;

  if (strongLabels.length > 0 || evidence) {
    candidates.push({
      id: game.id,
      name: game.name,
      labels: strongLabels,
      weakHints: weakLabels,
      descriptionMatch: Boolean(evidence),
      descriptionEvidence: evidence,
      descriptionContradicts,
    });
  } else if (weakLabels.length > 0) {
    weakHints.push({ id: game.id, name: game.name, labels: weakLabels });
  }
}

console.log(JSON.stringify({
  purpose: "Discovery only. Strong signals are a shortlist for manual review; weak hints are lower-confidence metadata. Neither proves permission, multiplayer integration, or server-verifiable results.",
  catalogueGames: games.length,
  candidateCount: candidates.length,
  weakHintCount: weakHints.length,
  candidates,
  weakHints,
}, null, 2));
