# Firebase Admin setup for Fun Ground v0.3.0

The server-side competitive API uses the Firebase Admin SDK. It is deliberately unavailable until the project owner configures a service account and enables the server-side feature flag.

## Configure Vercel

1. Open Firebase Console for the existing `fun-ground` Firebase project.
2. Open Project settings → Service accounts.
3. Generate a new private key only if an existing secure service-account key is not already managed.
4. Store the complete JSON privately as the Vercel environment variable `FIREBASE_SERVICE_ACCOUNT_JSON` for the intended Preview environment.
5. Never commit the JSON, paste it into GitHub, or expose it in a `NEXT_PUBLIC_*` variable.
6. Keep all `FUN_GROUND_*` feature flags set to `false` until the relevant integration is reviewed and tested.

## Activity tracking requirements

- Set `FUN_GROUND_ACTIVITY_TRACKING_ENABLED=true` only after the Admin credentials and private Firestore rules are verified in Preview.
- Set `NEXT_PUBLIC_FG_ACTIVITY_TRACKING_ENABLED=true` only as a client-side request hint. It does not enable the feature; the server flag remains authoritative.
- Before enabling activity tracking for players, finalize its data-retention period and deletion process, and ensure the privacy policy accurately describes the collection. The current policy states that tracking is disabled by default and must be updated before any live activation.
- Activity sessions store only the authenticated UID, game ID, server start/end timestamps and a capped duration. They do not record scores, winners or rewards.

## Matchmaking requirements

- Set `FUN_GROUND_MATCHMAKING_ENABLED=true` only after the Admin credentials, Firestore rules, and queue API have been verified in a non-production preview.
- The game capability registry in `src/lib/competitive/capabilities.ts` is intentionally empty. No game can enter a queue until a real multiplayer integration is individually reviewed and added with evidence.
- Ranked additionally requires `FUN_GROUND_RANKED_ENABLED=true`, a Firebase-verified email on the player account, and a server-verifiable result integration for that game. Email verification is the current baseline for the verified-player gate; any stronger identity verification policy must be defined before ranked launch.
- The queue creates match records with `resultStatus: unverified`; it does not declare a winner or issue rewards.
- Client Firestore access to queue and match records is explicitly denied. All access must go through authenticated server routes.

## Not included

This setup does not enable payments, deposits, cash withdrawals, redeemable balances, tournament prize payouts, or rewarded-ad rewards. Do not configure those features through these flags.
