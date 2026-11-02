import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "data", "games.json");
const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
const games = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.games) ? parsed.games : [];
const terms = /multiplayer|\bonline\b|co[ -]?op|cooperative|\bversus\b|\bpvp\b|2[ -]?player|two[ -]?player|local play/i;

function labels(values = []) {
  return values
    .map((item) => typeof item === "string" ? item : item?.name)
    .filter((value) => typeof value === "string" && terms.test(value));
}

const candidates = games.flatMap((game) => {
  const matched = [
    ...labels(game.modes),
    ...labels(game.features),
    ...labels(game.tags),
  ];
  const descriptionMatch = typeof game.description === "string" && terms.test(game.description);
  if (matched.length === 0 && !descriptionMatch) return [];
  return [{
    id: game.id,
    name: game.name,
    labels: [...new Set(matched)],
    descriptionMatch,
  }];
});

console.log(JSON.stringify({
  purpose: "Discovery only. Catalogue labels/descriptions do not prove multiplayer support or server-verifiable results.",
  catalogueGames: games.length,
  candidateCount: candidates.length,
  candidates,
}, null, 2));
