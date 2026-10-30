# Fun Ground — production project

Fun Ground is a responsive browser-game discovery site built with Next.js, TypeScript, and React for deployment on Vercel.

## Catalog and validation

- `data/games.json` is the locally bundled catalog extracted from the user-provided dataset.
- The catalog contains **3,086 games with 3,086 unique, non-empty IDs**. Version 0.2.1 adds 22 records from the supplied WG snapshot while retaining all existing records, including 13 IDs absent from that snapshot. All entries retain their source embed URL, image URL, description, category/tag metadata, and related fields.
- The app does not fetch the WG Playground API during a Vercel build.
- Run `npm run check:catalog` to verify the expected catalog size, unique IDs, the 22 added IDs, the 13 preserved legacy IDs, new embed integrity, names, images, and descriptions before deployment.

## Local development

1. Install Node.js 20.9 or newer.
2. In this folder, run `npm install`.
3. Run `npm run check:catalog`.
4. Run `npm run dev` and open `http://localhost:3000`.
5. Run `npm run build` before deployment.

## Vercel deployment

1. Commit the contents of this project folder to the GitHub repository connected to the Fun Ground Vercel project.
2. Use the standard Next.js build command: `npm run build`.
3. Add the environment variables listed below in Vercel. The canonical site URL is set in `src/lib/site.ts`; change it only after a custom domain has been verified and assigned to this Vercel project.
4. Deploy, then test representative game pages, search, category filtering, favorites, recently played, fullscreen, mobile layout, legal pages, `sitemap.xml`, and `robots.txt`.
5. Enable Vercel Web Analytics in the Vercel project dashboard if needed. Google Analytics and Search Console require real IDs/verification values.

## Environment variables

Copy `.env.example` as a reference; do not commit private credentials.

- `NEXT_PUBLIC_GA_ID`: optional Google Analytics measurement ID. Leave blank until configured.
- `GOOGLE_SITE_VERIFICATION`: optional Search Console verification token, not a full HTML tag.
- `NEXT_PUBLIC_ADSENSE_ENABLED`: must remain `false` while the AdSense application/site review is pending.
- `NEXT_PUBLIC_ADSENSE_CLIENT`, `NEXT_PUBLIC_ADSENSE_SLOT_HOME`, `NEXT_PUBLIC_ADSENSE_SLOT_GAME`: configure only with real values from the approved AdSense account. Do not enable ads until approval, consent/privacy requirements, and ad placement have been reviewed.

## Advertising and third-party content

AdSense is deliberately **disabled by default**. An AdSense application being pending does not authorize serving ads. After approval, configure the actual publisher and slot IDs, review Google's current policies, add any required consent-management solution for the regions served, and verify that ad placements do not encourage accidental clicks.

Games are embedded from their supplied third-party `game_url` values. Fun Ground does not display an outbound “Original Game” button, but third-party content inside an iframe may still display provider UI, links, or advertising. The site owner has confirmed embedding/monetization permission; retain the supporting evidence and comply with any conditions in that permission. This project does not claim ownership of third-party games or artwork.

## SEO and analytics

The project includes page metadata, canonical URLs for game pages, Open Graph metadata, JSON-LD VideoGame data, a sitemap containing game pages, and a robots file. The domain and verification tokens must be set to real values after deployment. Search-trend data informed broad, relevant wording; it is not inserted as keyword lists or used to make unsupported claims.

## Catalog data limitations

The supplied dataset does not include verified play counts or publication dates. “Popular games” is presented as featured catalog picks, not a measured live ranking. The recently-added area uses the supplied catalog order and explicitly notes that release dates are unavailable. Add first-party play metrics or trusted timestamps before describing either as a verified ranking.

## Before public launch

- Review the privacy policy and terms for the actual deployment, applicable law, analytics, and any consent requirements.
- Verify all embeds work and that the site has the required rights/permissions for game embeds, images, descriptions, and commercial use.
- Set a custom domain only after purchasing it and completing DNS configuration.
- Test the production build and the live deployment; this source bundle alone does not mean the website is already deployed or approved by an advertising provider.

