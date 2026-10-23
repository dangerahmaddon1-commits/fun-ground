import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fun Ground Roadmap",
  description: "See what's coming to Fun Ground: better game discovery, new ways to play, and competitive gaming events.",
  alternates: { canonical: "/roadmap" },
  openGraph: {
    title: "What's Coming to Fun Ground?",
    description: "Explore the Fun Ground roadmap and see what we're working toward.",
    type: "website",
  },
};

const stages = [
  {
    status: "available",
    label: "Available now",
    icon: "✦",
    title: "Explore the games",
    description: "The fun starts with discovering games and finding something that fits your mood.",
    items: ["Browse the game catalogue", "Explore categories and search", "Play supported embedded games"],
  },
  {
    status: "progress",
    label: "Improving",
    icon: "⌕",
    title: "Better game discovery",
    description: "We want it to be easier to find a game you'll love and get back to playing.",
    items: ["Keep improving browsing and mobile usability", "Make game discovery clearer", "Refine the experience as we learn from players"],
  },
  {
    status: "planned",
    label: "Planned",
    icon: "🏆",
    title: "Competitive gaming",
    description: "We're exploring ways to bring players together around games that genuinely support multiplayer.",
    items: ["A dedicated competitive area", "Tournament information and standings", "Free Fire community tournament events"],
  },
  {
    status: "future",
    label: "Future ideas",
    icon: "⚡",
    title: "More ways to play",
    description: "As the platform grows, we hope to introduce more reasons to return and challenge yourself.",
    items: ["Achievements and player milestones", "Community challenges", "More events and features based on player feedback"],
  },
];

export default function RoadmapPage() {
  return (
    <article className="roadmap-page">
      <section className="roadmap-hero">
        <span className="eyebrow">THE FUTURE OF FUN GROUND</span>
        <h1>Play today.<br /><em>More fun ahead.</em></h1>
        <p>We're building Fun Ground one step at a time. Explore what's available, see the ideas we're working toward, and check back as the journey continues.</p>
        <div className="roadmap-note"><span>✦</span> A living roadmap — updated as things change</div>
      </section>

      <section className="roadmap-list" aria-label="Fun Ground roadmap stages">
        {stages.map((stage) => (
          <article className="roadmap-card" data-status={stage.status} key={stage.status}>
            <div className="roadmap-card-head">
              <span className="roadmap-card-icon" aria-hidden="true">{stage.icon}</span>
              <div><div className="roadmap-status">{stage.label}</div></div>
            </div>
            <h2>{stage.title}</h2>
            <p>{stage.description}</p>
            <ul>{stage.items.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
        ))}
      </section>

      <section className="roadmap-bottom">
        <div><h2>More fun is on the way.</h2><p>Keep exploring Fun Ground and come back to see what changes.</p></div>
        <Link className="primary-button" href="/#all-games">Explore games <span>→</span></Link>
      </section>
      <p style={{ color: "var(--muted)", fontSize: 11, marginTop: 18 }}>Roadmap items and timing may change as development progresses. Tournament availability, eligibility, and rewards will be announced with the rules for each event. Cash prizes and withdrawals are not guaranteed.</p>
    </article>
  );
}
