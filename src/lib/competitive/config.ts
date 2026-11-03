/** Server-side competitive feature gates. Missing values are always disabled. Keep these names out of NEXT_PUBLIC_*. */
export const competitiveFeatures = Object.freeze({
  activityTracking: process.env.FUN_GROUND_ACTIVITY_TRACKING_ENABLED === "true",
  matchmaking: process.env.FUN_GROUND_MATCHMAKING_ENABLED === "true",
  chessOnlineMatches: process.env.FUN_GROUND_CHESS_ONLINE_MATCHES_ENABLED === "true",
  rankedMatches: process.env.FUN_GROUND_RANKED_ENABLED === "true",
  dailyMissions: process.env.FUN_GROUND_DAILY_MISSIONS_ENABLED === "true",
  leaderboards: process.env.FUN_GROUND_LEADERBOARDS_ENABLED === "true",
  tournamentEntry: process.env.FUN_GROUND_TOURNAMENT_ENTRY_ENABLED === "true",
  rewardsLedger: process.env.FUN_GROUND_REWARDS_LEDGER_ENABLED === "true",
});

export type CompetitiveFeature = keyof typeof competitiveFeatures;

export function isCompetitiveFeatureEnabled(feature: CompetitiveFeature): boolean {
  return competitiveFeatures[feature];
}
