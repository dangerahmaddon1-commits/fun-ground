# Fun Ground player accounts: Firebase setup

Fun Ground includes email/password and Google sign-in with player profiles. The app source uses Firebase Authentication and stores each profile at `users/{authUid}`. Review and publish the repository's `firestore.rules` separately in Firebase Console before relying on profile saves.

## 1. Vercel environment variables

The Vercel project should have these values for Preview and Production:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (should be `fun-ground`)
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional; not required for authentication)

Firebase web configuration values are intended for client apps. Never commit a Firebase service-account private key or other server secret to the repository. Firestore security rules still need to be published in Firebase Console.

## 2. Enable sign-in providers

Firebase Console → Authentication → Sign-in method:
- Enable Email/Password.
- Enable Google and select a support email.
- Authentication → Settings → Authorized domains: ensure `fun-ground.vercel.app` is listed.

Email/password registration sends a verification email. Email/password sign-in is blocked until the email is verified. The sign-in page also includes a password-reset action.

## 3. Firestore and avatars

- Create a Cloud Firestore database.
- Firebase Storage is intentionally not required for the first version. Players choose from built-in emoji avatars; no billing upgrade or custom image upload is needed.
- Publish the current `firestore.rules` in Firebase Console. It permits each signed-in player to read and write only the profile document whose ID matches their Auth UID; it validates the profile fields and denies collection listing.
- The public/private visibility preference is saved, but public profile browsing is not implemented. Public visibility does not make profile data readable under these rules.

## 4. Preview test checklist

Before merging or deploying to Production, test on a Vercel Preview:
1. Email/password signup and verification email.
2. Attempting sign-in before verification is blocked and prompts for verification.
3. Password reset email.
4. Google sign-in.
5. Profile display name, bio, visibility, built-in avatar, save, and sign-out.
6. Guest gameplay, catalog, mobile categories, theme toggle, and existing Monetag integration.

Favorites syncing and recently played syncing are not part of this account foundation. Premium remains “Coming Soon”; no payment flow, tokens, or tournaments are included.

