import type { Metadata } from "next";
import Link from "next/link";
import GameBrowser from "@/components/GameBrowser";
import { getGames, categoriesFrom } from "@/lib/games";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{slug:string}> }): Promise<Metadata> {
  const { slug } = await params; const category = categoriesFrom(getGames()).find(c => c.slug === slug);
  return { title: category ? `${category.name} Games` : "Game Category", description: category ? `Play free ${category.name.toLowerCase()} browser games on Fun Ground. Browse the collection and find your next favorite.` : "Browse browser games on Fun Ground." };
}
export default async function CategoryPage({ params }: { params: Promise<{slug:string}> }) {
  const { slug } = await params; const games = getGames(); const categories = categoriesFrom(games); const category = categories.find(c => c.slug === slug);
  if (!category) return <div className="page-container not-found"><span>?</span><h1>Category not found</h1><p>This category is not in the current game catalog.</p><Link className="primary-button" href="/#all-games">Browse all games ↗</Link></div>;
  return <div className="page-container standard-page"><div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><strong>{category.name}</strong></div><span className="eyebrow">FIND YOUR PLAY STYLE</span><h1>{category.name} games</h1><p className="page-intro">Explore free browser games in the {category.name.toLowerCase()} category.</p><GameBrowser games={games} categories={categories} title={`${category.name} games`} subtitle="Search this category or switch to another one." initialCategory={category.slug}/></div>;
}
