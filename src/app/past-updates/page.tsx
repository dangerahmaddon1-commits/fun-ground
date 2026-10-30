import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Past Updates",
  description: "Read about released improvements and updates to Fun Ground.",
  alternates: { canonical: "/past-updates" },
};

const releases = [
  {
    version: "0.2.1",
    status: "Released",
    title: "Game Catalog Update",
    summary: "Expanded the Fun Ground catalog while preserving existing game entries and their embed data.",
    items: [
      "Expanded the catalog to 3,086 unique game entries.",
      "Added 22 games from the newer catalog snapshot while retaining the previous entries that were absent from that snapshot.",
      "Improved favorite-heart state synchronization across duplicate game cards.",
      "Kept AdSense inactive while the application remains pending.",
    ],
  },
];

export default function PastUpdatesPage() {
  return (
    <article className="roadmap-page">
      <section className="roadmap-hero">
        <span className="eyebrow">FUN GROUND RELEASE HISTORY</span>
        <h1>Past updates.<br /><em>Progress worth sharing.</em></h1>
        <p>Here you'll find a record of improvements already released on Fun Ground. Features still being developed belong on the roadmap until they're released.</p>
        <div className="roadmap-note"><span>✦</span> Released updates only</div>
      </section>
      <section className="roadmap-list" aria-label="Released Fun Ground updates">
        {releases.map((release) => (
          <article className="roadmap-card" data-status="available" key={release.version}>
            <div className="roadmap-card-head">
              <span className="roadmap-card-icon" aria-hidden="true">✓</span>
              <div><div className="roadmap-status">{release.status}</div></div>
              <span className="past-update-version">v{release.version}</span>
            </div>
            <h2>{release.title}</h2>
            <p>{release.summary}</p>
            <ul>{release.items.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
        ))}
      </section>
      <section className="roadmap-bottom">
        <div><h2>See what's next.</h2><p>Check the roadmap for planned and in-progress features. Version 0.2.2 remains under development until released.</p></div>
        <Link className="primary-button" href="/roadmap">View roadmap <span>→</span></Link>
      </section>
    </article>
  );
}
