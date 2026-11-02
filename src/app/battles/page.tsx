import type { Metadata } from "next";
import { competitiveFeatures } from "@/lib/competitive/config";
export const metadata: Metadata = { title: "Fun Battles", description: "Competitive gaming is being prepared for Fun Ground.", robots: { index: false, follow: true } };
export default function BattlesPage() {
  return <main className="page-container"><div className="eyebrow">FUN GROUND COMPETITIVE</div><h1>Fun Battles</h1><p>Quick Match and Ranked Match are being developed for games with real, tested multiplayer support.</p><p>{competitiveFeatures.matchmaking ? "Matchmaking is enabled for this environment, but no game is currently approved for queue access." : "Matchmaking is not available yet."}</p><section><h2>Quick Match</h2><p>Casual automatic matchmaking for approved multiplayer games.</p><h2>Ranked Match</h2><p>Competitive matchmaking requires verified results and eligible games. Ranked play is currently unavailable.</p></section><p>No entry fees, cash prizes, withdrawals or redeemable rewards are offered here.</p></main>;
}
