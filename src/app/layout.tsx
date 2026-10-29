import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE_URL } from "@/lib/site";
import "./globals.css";
import "./account.css";
const gaId = process.env.NEXT_PUBLIC_GA_ID;
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Fun Ground — Free Online Games", template: "%s | Fun Ground" },
  description: "Play free online games on Fun Ground. Discover browser games, arcade challenges, puzzles, action games and casual favourites on desktop or mobile.",
  applicationName: "Fun Ground",
  icons: {
    icon: [{ url: "/fun-ground-logo.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/fun-ground-logo.svg", type: "image/svg+xml" }],
    apple: [{ url: "/fun-ground-logo.svg", type: "image/svg+xml" }],
  },
  alternates: { canonical: "/" },
  openGraph: { title: "Fun Ground — Free Online Games", description: "Play, discover, and repeat. Find your next favourite browser game.", siteName: "Fun Ground", type: "website", url: SITE_URL, images: [{ url: "/fun-ground-logo.svg", alt: "Fun Ground logo" }] },
  twitter: { card: "summary_large_image", title: "Fun Ground — Free Online Games", description: "Discover and play browser games on Fun Ground.", images: ["/fun-ground-logo.svg"] },
  robots: { index: true, follow: true },
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
};
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Fun Ground",
  alternateName: "Fun Ground Online Games",
  url: SITE_URL,
  description: "Play free browser games, arcade challenges, puzzles, action games and casual games on desktop or mobile.",
  publisher: { "@type": "Organization", name: "Fun Ground", url: SITE_URL, logo: { "@type": "ImageObject", url: `${SITE_URL}/fun-ground-logo.svg` } },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-theme="dark"><body><Script id="fun-ground-structured-data" type="application/ld+json" strategy="beforeInteractive">{JSON.stringify(structuredData)}</Script><Script src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8537779348532569" strategy="beforeInteractive" crossOrigin="anonymous"/><Script id="monetag-inpage-push" src="https://nap5k.com/tag.min.js" data-zone="12125988" strategy="beforeInteractive"/><Script id="monetag-vignette" src="https://n6wxm.com/vignette.min.js" data-zone="12125990" strategy="beforeInteractive"/><Script src="/anti-adblock.js" strategy="afterInteractive"/><Header/><main>{children}</main><Footer/><Analytics/>{gaId ? <><Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive"/><Script id="google-analytics" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || []; function gtag(){window.dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}', { anonymize_ip: true });`}</Script></> : null}</body></html>;
}

