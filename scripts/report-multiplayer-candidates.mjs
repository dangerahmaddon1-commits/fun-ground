import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "data", "games.json");
const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
const games = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.games) ? parsed.games : [];

const multiplayerTerms = /multiplayer|co[ -]?op|cooperative|\\bversus\\b|\\bpvp\\b|2[ -]?player|two[ -]?player/i;
const weakTerms = /\\bonline\\b|local play/i;
const onlineTerms = /\\bonline\\b|\\binternet\\b|remote|cross[- ]platform/i;
const localTerms = /\\blocal\\b|same device|same screen|split[- ]screen|couch|hotseat|pass[- ]and[- ]play/i;
const negativeDescriptionTerms = /\\b(?:no|not|without|isn't|is not|doesn't|does not|cannot|can't)\\b[^.!?]{0,45}\\b(?:multiplayer|co[ -]?op|cooperative|versus|pvp|2[ -]?player|two[ -]?player)\\b|\\b(?:multiplayer|co[ -]?op|cooperative|versus|pvp|2[ -]?player|two[ -]?player)\\b[^.!?]{0,40}\\b(?:not supported|unsupported|unavailable|isn't|is not|doesn't|does not)\\b|\\b(?:single[ -]?player only|solo only)\\b/i;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function matchingLabels(values, pattern) {
  return values
    .map((item) => typeof item === "string" ? item : item?.name)
    .filter((value) => typeof value === "string" && pattern.test(value));
}

function descriptionEvidence(description) {
  const match = description.match(multiplayerTerms);
  if (!match || match.index === undefined) return null;
  const start = Math.max(0, match.index - 55);
  const end = Math.min(description.length, match.index + match[0].length + 85);
  return description.slice(start, end).replace(/\\s+/g, " ").trim();
}

const onlineCandidates = [];
const localCandidates = [];
const needsVerification = [];
const weakHints = [];

for (const game of games) {
  const metadata = [
    ...asArray(game.modes),
    ...asArray(game.features),
    ...asArray(game.tags),
  ];
  const strongLabels = [...new Set(matchingLabels(metadata, multiplayerTerms))];
  const weakLabels = [...new Set(matchingLabels(metadata, weakTerms))];
  const description = typeof game.description === "string" ? game.description : "";
  const evidence = descriptionEvidence(description);
  const descriptionContradicts = negativeDescriptionTerms.test(description);

  // Do not promote a description-only match when the same description
  // explicitly says multiplayer/co-op is unavailable.
  if (descriptionContradicts && strongLabels.length === 0) continue;

  if (strongLabels.length > 0 || evidence) {
    const metadataText = metadata
      .map((item) => typeof item === "string" ? item : item?.name)
      .filter((value) => typeof value === "string")
      .join(" ");
    const onlineSignal = onlineTerms.test(description) || onlineTerms.test(metadataText);
    const localSignal = localTerms.test(description) || localTerms.test(metadataText);
    const candidate = {
      id: game.id,
      name: game.name,
      labels: strongLabels,
      weakHints: weakLabels,
      descriptionMatch: Boolean(evidence),
      descriptionEvidence: evidence,
      descriptionContradicts,
    };

    if (onlineSignal && !localSignal) onlineCandidates.push(candidate);
    else if (localSignal && !onlineSignal) localCandidates.push(candidate);
    else needsVerification.push(candidate);
  } else if (weakLabels.length > 0) {
    weakHints.push({ id: game.id, name: game.name, labels: weakLabels });
  }
}

console.log(JSON.stringify({
  purpose: "Discovery only. Online signals, local signals and multiplayer terms are triage hints, not proof of permission, transport, authoritative game state or server-verifiable results.",
  catalogueGames: games.length,
  onlineCandidateCount: onlineCandidates.length,
  localCandidateCount: localCandidates.length,
  needsVerificationCount: needsVerification.length,
  weakHintCount: weakHints.length,
  onlineCandidates,
  localCandidates,
  needsVerification,
  weakHints,
}, null, 2));
