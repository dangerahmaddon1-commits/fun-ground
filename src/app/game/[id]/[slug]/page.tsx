import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import GameCard from "@/components/GameCard";
import RecentlyPlayedTracker from "@/components/RecentlyPlayedTracker";
import GamePlayer from "@/components/GamePlayer";
import AdUnit from "@/components/AdUnit";
import { getGames, plainDescription, gamePath } from "@/lib/games";
import type { Game } from "@/types/game";

function gameSeoDescription(game: Game) {
  const category = game.categories?.map(c => c.name).filter(Boolean).slice(0, 2).join(" and ");
  const source = (game.description ?? "").replace(/\s+/g, " ").trim();
  const usefulSource = source && source.toLowerCase() !== "no description available" ? source : "";
  const intro = usefulSource || (game.instructions?.trim()
    ? `Learn how to play ${game.name}: ${game.instructions.trim()}`
    : `Play ${game.name} online for free on Fun Ground.`);
  const suffix = category ? ` Play this ${category.toLowerCase()} game online on Fun Ground.` : " Play online on Fun Ground.";
  const full = intro.toLowerCase().includes("fun ground") ? intro : intro + suffix;
  return full.replace(/\s+/g, " ").slice(0, 160).trim();
}

export async function generateMetadata({ params }: { params: Promise<{id:string;slug:string}> }): Promise<Metadata> {
  const { id } = await params;
  const game = getGames().find(g => g.id === id);
  if (!game) return { title: "Game not found", robots: { index: false, follow: false } };
  const category = game.categories?.[0]?.name;
  const title = `Play ${game.name} Online Free${category ? ` – ${category} Game` : ""}`;
  const description = gameSeoDescription(game);
  const keywords = [...new Set([game.name, ...(game.categories ?? []).map(c => c.name), ...(game.tags ?? []).map(t => t.name), "free online game", "browser game"].filter(Boolean))];
  return {
    title,
    description,
    keywords,
    alternates: { canonical: gamePath(game) },
    openGraph: {
      type: "website",
      title: `${title} | Fun Ground`,
      description,
      url: gamePath(game),
      siteName: "Fun Ground",
      images: game.image ? [{ url: game.image, alt: `${game.name} game` }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Fun Ground`,
      description,
      images: game.image ? [game.image] : [],
    },
  };
}

export default async function GamePage({ params }: { params: Promise<{id:string;slug:string}> }) {
  const { id } = await params;
  const games = getGames();
  const game = games.find(g => g.id === id);
  if (!game) notFound();
  const categoryNames = [...new Set((game.categories ?? []).map(c => c.name).filter(Boolean))];
  const related = games.filter(g => g.id !== game.id && (g.categories ?? []).some(c => (game.categories ?? []).some(gc => gc.slug === c.slug))).slice(0, 4);
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://fun-ground.vercel.app";
  const canonicalUrl = `${base}${gamePath(game)}`;
  const description = gameSeoDescription(game);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.name,
    description,
    genre: categoryNames,
    gamePlatform: "Web browser",
    url: canonicalUrl,
    isAccessibleForFree: true,
    applicationCategory: "Game",
    ...(game.image ? { image: game.image } : {}),
    ...(game.developer?.public_name ? { author: { "@type": "Organization", name: game.developer.public_name } } : {}),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      ...(categoryNames.length ? [{ "@type": "ListItem", position: 2, name: categoryNames[0], item: `${base}/#all-games` }] : []),
      { "@type": "ListItem", position: categoryNames.length ? 3 : 2, name: game.name, item: canonicalUrl },
    ],
  };
  return <div className="game-page page-container"><RecentlyPlayedTracker id={game.id}/><div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><span>{categoryNames[0] || "Games"}</span><span>/</span><strong>{game.name}</strong></div><div className="game-page-heading"><div><span className="eyebrow">NOW PLAYING ON FUN GROUND</span><h1>{game.name}</h1><p>{categoryNames.join(" · ") || "Free online game"}</p></div><Link className="back-link" href="/#all-games">← All games</Link></div>
    <div className="player-shell"><div className="player-topbar"><div className="player-lights"><i/><i/><i/></div><span>{game.name}</span><span className="player-status"><b/> Browser game</span></div>{game.game_url ? <GamePlayer src={game.game_url} title={game.name}/> : <div className="embed-missing"><span>🎮</span><h2>Not playable here yet</h2><p>This game does not currently provide an embeddable game on Fun Ground.</p><Link className="secondary-button" href="/#all-games">Browse other games</Link></div>}</div>
    <div className="player-actions"><span>Having trouble? Try refreshing the game page.</span><span className="embed-attribution">Embedded content provided by WG Playground.</span><div><a className="secondary-button" href={gamePath(game)}>↻ Refresh page</a></div></div>
    <div className="ad-wrap game-ad-wrap"><AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_GAME} label="Game page advertisement"/></div>
    <div className="game-details-grid"><article className="detail-panel"><span className="eyebrow">ABOUT THIS GAME</span><h2>About {game.name}</h2><p>{plainDescription(game.description)}</p>{game.instructions && <><h3>How to play</h3><p className="instructions-text">{game.instructions}</p></>}{game.controls?.length ? <p><strong>Controls:</strong> {game.controls.map(c => c.name).join(", ")}</p> : null}{game.developer?.public_name && <p><strong>Developer:</strong> {game.developer.public_name}</p>}</article><aside className="detail-panel game-facts"><span className="eyebrow">GAME DETAILS</span><h2>Quick info</h2><div><span>Category</span><strong>{categoryNames.join(", ") || "General"}</strong></div><div><span>Game type</span><strong>{game.type || "Browser game"}</strong></div><div><span>Play mode</span><strong>{game.features?.map(f=>f.name).join(", ") || "See game instructions"}</strong></div>{game.tags?.length ? <div className="tag-list">{game.tags.slice(0, 12).map(t=><span key={t.slug || t.name}>{t.name}</span>)}</div> : null}</aside></div>
    {related.length > 0 && <section className="related-section"><div className="section-heading"><div><span className="eyebrow">KEEP THE FUN GOING</span><h2>More like this</h2></div><Link href="/#all-games" className="inline-link">Browse all ↗</Link></div><div className="game-grid">{related.map((g,i)=><GameCard key={g.id} game={g} index={i}/>)}</div></section>}
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd).replace(/</g,"\\u003c")}} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(breadcrumbJsonLd).replace(/</g,"\\u003c")}} />
  </div>;
}
