import type { MetadataRoute } from "next";
import { getGames, gamePath } from "@/lib/games";
import { SITE_URL } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = ["", "/about", "/roadmap", "/privacy", "/terms", "/contact", "/favorites"].map(path => ({ url: `${SITE_URL}${path}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.4 }));
  const gamePages = getGames().map(game => ({ url: `${SITE_URL}${gamePath(game)}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 }));
  return [...staticPages, ...gamePages];
}

