import type { Metadata } from "next";
import { getGames, categoriesFrom } from "@/lib/games";
import FavoritesClient from "@/components/FavoritesClient";
export const metadata: Metadata = { title: "Your Favorites", description: "Find the browser games you've saved on Fun Ground." };
export const dynamic = "force-dynamic";
export default function FavoritesPage() { const games = getGames(); return <div className="page-container standard-page"><span className="eyebrow">YOUR PERSONAL COLLECTION</span><h1>Your favorites <span className="heading-star">♥</span></h1><p className="page-intro">The games you save for later, all in one place on this device.</p><FavoritesClient games={games} categories={categoriesFrom(games)}/></div>; }
