import fs from 'node:fs';
const file = new URL('../data/games.json', import.meta.url);
const games = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!Array.isArray(games)) throw new Error('Catalog must be a JSON array.');
const ids = games.map((game) => String(game?.id ?? ''));
const duplicateIds = ids.filter((id, index) => !id || ids.indexOf(id) !== index);
const newGameIds = [
  '5448', '5446', '5445', '5444', '5443', '5441', '5440', '5439', '5438', '5437', '5436',
  '5435', '5434', '5433', '5432', '5431', '5430', '5429', '5428', '5427', '5425', '5424',
];
const preservedLegacyIds = ['2558', '2664', '2680', '2737', '2879', '2887', '2956', '2959', '3140', '3155', '3189', '3199', '5005'];
const catalogIds = new Set(ids);
const missingNewIds = newGameIds.filter((id) => !catalogIds.has(id));
const missingPreservedLegacyIds = preservedLegacyIds.filter((id) => !catalogIds.has(id));
const newGameIdSet = new Set(newGameIds);
const invalidNewEmbeds = games.filter((game) => newGameIdSet.has(String(game?.id)) && (
  !game?.hash || game.game_url !== `https://play.wgplayground.com/ifr/${game.hash}` ||
  !game.image?.startsWith('https://static.wgplayground.com/')
));
const missing = (field) => games.filter((game) => !game?.[field]).length;
const summary = {
  totalGames: games.length,
  uniqueIds: new Set(ids).size,
  duplicateOrEmptyIds: duplicateIds.length,
  missingNewIds,
  missingPreservedLegacyIds,
  invalidNewEmbeds: invalidNewEmbeds.length,
  missingNames: missing('name'),
  missingEmbedUrls: missing('game_url'),
  missingImages: missing('image'),
  missingDescriptions: missing('description'),
};
console.log(JSON.stringify(summary, null, 2));
if (games.length !== 3086 || summary.uniqueIds !== 3086 || summary.duplicateOrEmptyIds || missingNewIds.length || missingPreservedLegacyIds.length || invalidNewEmbeds.length || summary.missingNames || summary.missingEmbedUrls || summary.missingImages || summary.missingDescriptions) {
  throw new Error('Catalog validation failed. Review the uploaded dataset before deployment.');
}
