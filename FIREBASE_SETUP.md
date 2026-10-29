# Fun Ground player accounts: Firebase setup

The account UI and Firebase client integration are prepared on the `feature/player-accounts` branch. The feature will not authenticate users until the Firebase web app configuration is added to Vercel and the Firebase services below are enabled.

## 1. Add a Firebase Web App

In Firebase Console, open project `fun-ground` (project number `658062449122`), go to Project settings → General → Your apps, and register a Web app if one does not already exist. Copy its web configuration values.

Add these variables in Vercel → project `fun-ground` → Settings → Environment Variables, for Preview and Production:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (should be `fun-ground`)
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Do not commit real credentials or private service-account keys to GitHub. Firebase web config values are intended for client apps; access must be protected by Firebase security rules.

## 2. Enable sign-in providers

Firebase Console → Authentication → Get started → Sign-in method:
- Enable Email/Password.
- Enable Google and select a support email.
- Authentication → Settings → Authorized domains: ensure `fun-ground.vercel.app` is listed.

Email/password registration sends a verification email. Email/password sign-in is blocked until the email is verified. Google sign-in creates or reuses a Firebase account.

## 3. Create Firestore and Storage

- Create a Cloud Firestore database.
- Firebase Storage is intentionally not required for the first version. Players choose from built-in emoji avatars, so no billing upgrade is needed for avatar uploads.
- Review and publish `firestore.rules` in the Firestore Rules console. These baseline rules restrict profile access to the signed-in owner. Do not loosen them to public writes.
- Custom avatar uploads can be added later if you decide to enable Firebase Storage after reviewing any billing requirements.

## 4. Deploy safely

After environment variables and Firebase services are configured, deploy a Preview first and test:
1. Email/password signup and verification.
2. Google sign-in.
3. Sign-in, profile save, built-in avatar selection, and sign-out.
4. Guest gameplay and existing catalog/navigation.

The code currently has a password-reset control still to be completed. Public profile browsing, favorites syncing, and recently played syncing are not implemented. The profile's public/private setting is stored, but profile discovery is not enabled. Premium remains “Coming Soon”; no payment flow, tokens, or tournaments are added here.
