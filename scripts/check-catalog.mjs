import fs from 'node:fs';
const file = new URL('../data/games.json', import.meta.url);
const games = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!Array.isArray(games)) throw new Error('Catalog must be a JSON array.');
const ids = games.map((game) => String(game?.id ?? ''));
const duplicateIds = ids.filter((id, index) => !id || ids.indexOf(id) !== index);
const missing = (field) => games.filter((game) => !game?.[field]).length;
const summary = {
  totalGames: games.length,
  uniqueIds: new Set(ids).size,
  duplicateOrEmptyIds: duplicateIds.length,
  missingNames: missing('name'),
  missingEmbedUrls: missing('game_url'),
  missingImages: missing('image'),
  missingDescriptions: missing('description'),
};
console.log(JSON.stringify(summary, null, 2));
if (games.length !== 3064 || summary.uniqueIds !== 3064 || summary.duplicateOrEmptyIds || summary.missingNames || summary.missingEmbedUrls || summary.missingImages || summary.missingDescriptions) {
  throw new Error('Catalog validation failed. Review the uploaded dataset before deployment.');
}
