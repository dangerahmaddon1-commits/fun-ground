import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "data", "games.json");
const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
const games = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.games) ? parsed.games : [];
// Metadata may use "online" as a weak discovery hint. Descriptions must
// contain an explicit multiplayer/co-op/player-count signal to avoid noisy matches.
const metadataTerms = /multiplayer|\bonline\b|co[ -]?op|cooperative|\bversus\b|\bpvp\b|2[ -]?player|two[ -]?player|local play/i;
const descriptionTerms = /multiplayer|co[ -]?op|cooperative|\bversus\b|\bpvp\b|2[ -]?player|two[ -]?player/i;

function labels(values = []) {
  return values
    .map((item) => typeof item === "string" ? item : item?.name)
    .filter((value) => typeof value === "string" && metadataTerms.test(value));
}

function descriptionEvidence(description) {
  const match = description.match(descriptionTerms);
  if (!match || match.index === undefined) return null;
  const start = Math.max(0, match.index - 55);
  const end = Math.min(description.length, match.index + match[0].length + 85);
  return description.slice(start, end).replace(/\s+/g, " ").trim();
}

const candidates = games.flatMap((game) => {
  const matched = [
    ...labels(game.modes),
    ...labels(game.features),
    ...labels(game.tags),
  ];
  const description = typeof game.description === "string" ? game.description : "";
  const evidence = descriptionEvidence(description);
  if (matched.length === 0 && !evidence) return [];
  return [{
    id: game.id,
    name: game.name,
    labels: [...new Set(matched)],
    descriptionMatch: Boolean(evidence),
    descriptionEvidence: evidence,
  }];
});

console.log(JSON.stringify({
  purpose: "Discovery only. Catalogue labels/descriptions do not prove multiplayer support or server-verifiable results.",
  catalogueGames: games.length,
  candidateCount: candidates.length,
  candidates,
}, null, 2));
