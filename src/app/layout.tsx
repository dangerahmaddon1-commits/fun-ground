import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fun-ground.vercel.app";
const gaId = process.env.NEXT_PUBLIC_GA_ID;
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Fun Ground — Free Online Games", template: "%s | Fun Ground" },
  description: "Play free online games on Fun Ground. Discover browser games, arcade challenges, puzzles, action games and casual favourites on desktop or mobile.",
  applicationName: "Fun Ground",
  icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
  alternates: { canonical: "/" },
  openGraph: { title: "Fun Ground — Free Online Games", description: "Play, discover, and repeat. Find your next favourite browser game.", siteName: "Fun Ground", type: "website", url: siteUrl },
  twitter: { card: "summary_large_image", title: "Fun Ground — Free Online Games", description: "Discover and play browser games on Fun Ground." },
  robots: { index: true, follow: true },
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
};
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Fun Ground",
  alternateName: "Fun Ground Online Games",
  url: siteUrl,
  description: "Play free browser games, arcade challenges, puzzles, action games and casual games on desktop or mobile.",
  publisher: { "@type": "Organization", name: "Fun Ground", url: siteUrl, logo: `${siteUrl}/fun-ground-logo.svg` },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-theme="dark"><body><Script id="fun-ground-structured-data" type="application/ld+json" strategy="beforeInteractive">{JSON.stringify(structuredData)}</Script><Script src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8537779348532569" strategy="beforeInteractive" crossOrigin="anonymous"/><Header/><main>{children}</main><Footer/><Analytics/>{gaId ? <><Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive"/><Script id="google-analytics" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || []; function gtag(){window.dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}', { anonymize_ip: true });`}</Script></> : null}</body></html>;
}
