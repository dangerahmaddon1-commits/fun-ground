import type { Metadata } from "next";
import Link from "next/link";
import { competitiveFeatures } from "@/lib/competitive/config";

export const metadata: Metadata = {
  title: "Fun Battles",
  description: "Explore Fun Ground Chess and upcoming competitive multiplayer modes.",
  robots: { index: false, follow: true },
};

export default function BattlesPage() {
  return <main className="page-container standard-page">
    <div className="eyebrow">FUN GROUND COMPETITIVE</div>
    <h1>Fun Battles</h1>
    <p className="page-intro">Our competitive platform is starting with Fun Ground Chess. More original games will be added over time.</p>
    <section className="detail-panel" style={{ marginBottom: 20 }}>
      <div className="eyebrow">FIRST ORIGINAL GAME</div>
      <h2>♟ Fun Ground Chess</h2>
      <p>Play against AI in Casual or Training mode, with three difficulty levels. Online human matchmaking is being developed separately and is not available yet.</p>
      <Link className="primary-button" href="/chess">Play Chess <span>↗</span></Link>
    </section>
    <section className="detail-panel">
      <h2>Online Battles</h2>
      <p>{competitiveFeatures.matchmaking ? "The matchmaking service is enabled for this environment, but Chess online matches are not ready to open." : "Online matchmaking is not enabled yet."}</p>
      <p>Quick Match will offer an AI opponent after 3 minutes without finding a human player. Ranked will offer an optional switch to an unranked AI game after 5 minutes. AI games will never affect ranks, leaderboards or tournament rewards.</p>
      <p>No entry fees, cash prizes, withdrawals or redeemable rewards are offered here.</p>
    </section>
  </main>;
}
