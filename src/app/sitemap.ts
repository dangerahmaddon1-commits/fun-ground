import type { MetadataRoute } from "next";
import { getGames, gamePath } from "@/lib/games";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://fun-ground.vercel.app";
  const staticPages = ["", "/about", "/privacy", "/terms", "/contact", "/favorites"].map(path => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.4 }));
  const gamePages = getGames().map(game => ({ url: `${base}${gamePath(game)}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 }));
  return [...staticPages, ...gamePages];
}
