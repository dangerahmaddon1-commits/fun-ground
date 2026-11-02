import type { Metadata } from "next";
import { competitiveFeatures } from "@/lib/competitive/config";
export const metadata: Metadata = { title: "Player Rewards", description: "Player progression and rewards planned for Fun Ground.", robots: { index: false, follow: true } };
export default function RewardsPage() {
  return <main className="page-container"><div className="eyebrow">PLAYER PROGRESSION</div><h1>Rewards & Progress</h1><p>Fun Ground is preparing player levels, daily missions and competitive leaderboards.</p><p>{competitiveFeatures.rewardsLedger ? "The rewards feature gate is enabled in this environment, but no reward balance or claim flow is exposed." : "Rewards are not active."}</p><section><h2>XP and levels</h2><p>Lifetime progression will be recorded through trusted server-side events.</p><h2>Daily missions</h2><p>Daily goals will require server-side completion checks.</p><h2>Leaderboards</h2><p>Rankings will use validated game results, not scores submitted directly by a browser.</p></section><p>No purchases, deposits, withdrawals, cash redemption or ad-based reward claims are available here.</p></main>;
}
