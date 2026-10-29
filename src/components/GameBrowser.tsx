"use client";
import { useMemo, useState } from "react";
import type { Game } from "@/types/game";
import GameCard from "@/components/GameCard";
type Category = { slug: string; name: string; count?: number };
export default function GameBrowser({ games, categories, title = "All games", subtitle = "Find your next favorite.", initialCategory = "all" }: { games: Game[]; categories: Category[]; title?: string; subtitle?: string; initialCategory?: string }) {
  const [query, setQuery] = useState(""); const [category, setCategory] = useState(initialCategory); const [visible, setVisible] = useState(24); const [sort, setSort] = useState("featured");
  const filtered = useMemo(() => games.filter(g => {
    const q = query.trim().toLowerCase();
    const matchesText = !q || [g.name, g.description, ...(g.tags ?? []).map(t => t.name), ...(g.categories ?? []).map(c => c.name)].join(" ").toLowerCase().includes(q);
    const matchesCategory = category === "all" || (g.categories ?? []).some(c => c.slug === category);
    return matchesText && matchesCategory;
  }), [games, query, category]);
  const selectedCategoryLabel = categories.find(c => c.slug === category)?.name;
  const sorted = useMemo(() => { const copy = [...filtered]; if (sort === "name-asc") copy.sort((a,b) => a.name.localeCompare(b.name)); else if (sort === "name-desc") copy.sort((a,b) => b.name.localeCompare(a.name)); return copy; }, [filtered, sort]);
  return <section className="catalog-section" id="all-games"><div className="section-heading"><div><span className="eyebrow">THE GAME LIBRARY</span><h2>{title}</h2><p>{subtitle}</p></div><span className="result-count">{filtered.length.toLocaleString()} games</span></div>
    <div className="catalog-tools"><label className="search-box"><span>⌕</span><input value={query} onChange={e => {setQuery(e.target.value); setVisible(24);}} placeholder="Search games, tags, categories…" aria-label="Search games"/></label><label className="category-select"><span>Category</span><select value={category} onChange={e => {setCategory(e.target.value); setVisible(24);}} aria-label="Filter by category"><option value="all">All categories</option>{categories.map(c => <option key={c.slug} value={c.slug}>{c.name}{typeof c.count === "number" ? ` (${c.count.toLocaleString()})` : ""}</option>)}</select></label><label className="category-select"><span>Sort</span><select value={sort} onChange={e => {setSort(e.target.value);setVisible(24);}} aria-label="Sort games"><option value="featured">Featured order</option><option value="name-asc">Name: A to Z</option><option value="name-desc">Name: Z to A</option></select></label></div>
    {sorted.length ? <><div className="game-grid">{sorted.slice(0, visible).map((game, i) => <GameCard key={game.id} game={game} index={i} categoryLabel={selectedCategoryLabel} />)}</div>{sorted.length > visible && <div className="load-more-wrap"><button className="secondary-button" onClick={() => setVisible(v => v + 24)}>Load more games <span>↓</span></button></div>}</> : <div className="empty-state"><span>🕹️</span><h3>No games found</h3><p>Try another search or choose a different category.</p><button className="secondary-button" onClick={() => {setQuery("");setCategory("all");setSort("featured");}}>Clear filters</button></div>}
  </section>;
}

