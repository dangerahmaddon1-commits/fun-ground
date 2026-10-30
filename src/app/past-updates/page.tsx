import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Past Updates",
  description: "See the current Fun Ground version and read about released improvements.",
  alternates: { canonical: "/past-updates" },
};

const currentVersion = "0.2.3";

const releases = [
  {
    version: "0.2.3",
    status: "Current version",
    title: "Sign-In Visibility & Release History",
    summary: "A clearer sign-in experience for visitors and a more useful release history.",
    items: [
      "Made the signed-out account control clearly display Sign In in the site header.",
      "Added a welcome prompt explaining that visitors can sign in or create a free account.",
      "Added direct Sign In and Create Account links to the signed-out account menu.",
      "Updated the Past Updates page to show the current version and keep the release history in order.",
    ],
  },
  {
    version: "0.2.2",
    status: "Previous release",
    title: "Player Profiles & Account Menu",
    summary: "A clearer player account experience, with sign-in options and a responsive account menu.",
    items: [
      "Added a player account dropdown with Sign In and Create Account options for signed-out visitors.",
      "Added account links for player profiles, profile editing, and favorites.",
      "Added Coming Soon notices for features still being developed, including recently played games, achievements, tournaments, and player statistics.",
      "Added responsive mobile styling, account avatars, and sign-out support.",
    ],
  },
  {
    version: "0.2.1",
    status: "Previous release",
    title: "Game Catalog Update",
    summary: "Expanded the Fun Ground catalog while preserving existing game entries and their embed data.",
    items: [
      "Expanded the catalog to 3,086 unique game entries.",
      "Added 22 games from the newer catalog snapshot while retaining the previous entries that were absent from that snapshot.",
      "Improved favorite-heart state synchronization across duplicate game cards.",
    ],
  },
];

export default function PastUpdatesPage() {
  return (
    <article className="roadmap-page">
      <section className="roadmap-hero">
        <span className="eyebrow">FUN GROUND RELEASE HISTORY</span>
        <h1>Past updates.<br /><em>Progress worth sharing.</em></h1>
        <p>Here you'll find the current version of Fun Ground and a record of improvements already released. Features still being developed belong on the roadmap until they're released.</p>
        <div className="roadmap-note"><span>✦</span> Current version: v{currentVersion}</div>
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
        <div><h2>See what's next.</h2><p>Check the roadmap for planned and in-progress features coming to Fun Ground.</p></div>
        <Link className="primary-button" href="/roadmap">View roadmap <span>→</span></Link>
      </section>
    </article>
  );
}
