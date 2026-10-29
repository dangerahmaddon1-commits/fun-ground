import Link from "next/link";
import GameCard from "@/components/GameCard";
import GameBrowser from "@/components/GameBrowser";
import AdUnit from "@/components/AdUnit";
import { getGames, categoriesFrom } from "@/lib/games";
export default function HomePage() {
  const games = getGames(); const categories = categoriesFrom(games);
  const featured = games.slice(0, 8); const recentlyAdded = games.slice(8, 16);
  return <>
    <section className="hero"><div className="hero-glow glow-one"/><div className="hero-glow glow-two"/><div className="hero-inner"><div className="hero-copy"><div className="hero-pill"><span className="live-dot"/> YOUR NEXT BREAK STARTS HERE</div><h1>Big fun.<br/><span>No downloads.</span></h1><p>Discover games worth getting lost in. From quick arcade runs to brain-tickling puzzles, your next favorite is waiting.</p><div className="hero-actions"><Link className="primary-button" href="/#all-games">Explore all games <span>↘</span></Link><Link className="text-button" href="/#categories">Browse categories <span>→</span></Link></div><div className="hero-stats"><div><strong>{games.length.toLocaleString()}<i>+</i></strong><span>games in this catalog</span></div><div><strong>0</strong><span>downloads needed</span></div><div><strong>∞</strong><span>ways to have fun</span></div></div></div><div className="hero-visual"><div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="hero-game-tile tile-main"><div className="tile-emoji">🎮</div><span>READY TO PLAY?</span><strong>Let's go!</strong></div><div className="hero-game-tile tile-small tile-top"><span>✦</span><small>GOOD VIBES</small></div><div className="hero-game-tile tile-small tile-bottom"><span>⚡</span><small>QUICK FUN</small></div><div className="hero-spark spark-a">✳</div><div className="hero-spark spark-b">✦</div></div></div><div className="hero-bottom-line"><span>SCROLL TO EXPLORE</span><span className="scroll-line"/><span>MADE FOR PLAYERS <b>↗</b></span></div></section>
    <div className="ad-wrap"><AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME} label="Homepage advertisement"/></div>
  <div className="category-pills">
  {categories.slice(0, 10).map((c, i) => (
    <a
      href={`/category/${encodeURIComponent(c.slug)}`}
      key={c.slug}
      className={`category-pill category-${i % 5}`}
    >
      <span>{["✦", "◈", "⚡", "▦", "♟"][i % 5]}</span>
      <span className="category-pill-label">{c.name}<small>{c.count.toLocaleString()} games</small></span>
      <b>↗</b>
    </a>
  ))}
</div>
    <section className="featured-section"><div className="section-heading"><div><span className="eyebrow">POPULAR GAMES</span><h2>Popular games <span className="heading-star">✳</span></h2><p>Featured picks from our catalogue. Verified live popularity counts are not available yet.</p></div><Link href="/#all-games" className="inline-link">Explore library ↗</Link></div><div className="game-grid">{featured.map((game, i) => <GameCard key={game.id} game={game} index={i}/>)}</div></section>
    <section className="promo-strip"><div className="promo-icon">✳</div><div><span className="eyebrow">TAKE A QUICK BREAK</span><h2>One more game. <em>We get it.</em></h2><p>Jump in, find a new favorite, and make your break count.</p></div><Link className="primary-button" href="/#all-games">Find a game <span>→</span></Link></section>
    <section className="featured-section recent-section"><div className="section-heading"><div><span className="eyebrow">FRESH FROM THE CATALOG</span><h2>Recently added</h2><p>More games from the supplied catalogue. Release dates are not provided in the source data.</p></div></div><div className="game-grid">{recentlyAdded.map((game, i) => <GameCard key={game.id} game={game} index={i}/>)}</div></section>
    <section className="roadmap-preview" aria-labelledby="roadmap-preview-title"><div className="roadmap-preview-copy"><span className="eyebrow">THE NEXT LEVEL</span><h2 id="roadmap-preview-title">Fun Ground is growing. <em>Come along.</em></h2><p>Web Version 0.2 is under development, with account, profile, category-filtering, and usability improvements.</p><Link className="primary-button" href="/roadmap">Explore the roadmap <span>→</span></Link></div><div className="roadmap-preview-steps"><div><span className="roadmap-step-icon">↗</span><span><strong>Web Version 0.2</strong><small>Accounts, profiles, and game discovery in progress</small></span><b>01</b></div><div><span className="roadmap-step-icon">⚡</span><span><strong>More ways to play</strong><small>Ideas for new gaming experiences</small></span><b>02</b></div><div><span className="roadmap-step-icon">🏆</span><span><strong>Competitive events</strong><small>Tournaments as features become ready</small></span><b>03</b></div></div></section>
    <div className="catalog-wrap"><GameBrowser games={games} categories={categories} title="Find your next favorite" subtitle="Search the library or filter by category."/></div>
  </>;
}

