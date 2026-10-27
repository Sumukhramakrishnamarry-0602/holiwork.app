# Holiwork

Holiwork is a Next.js workspace with Firebase Authentication, Firestore-backed tasks, and an optional server-side AI assistant.

## Local development

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` and fill in your Firebase web app configuration.
3. Add an `AI_API_KEY` for the server-side AI chat route. The key must remain server-side; do not prefix it with `NEXT_PUBLIC_`.
4. Start the app with `npm run dev`.

## Environment variables

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `AI_API_KEY` (server-only; required for Holi AI)
- `AI_MODEL` (optional; defaults to `gpt-4o-mini`)

Configure the same values in the Vercel project's Environment Variables settings for the environments you use, then redeploy.

## Firestore security rules

The repository's `firestore.rules` file scopes tasks, events, reminders, budgets, transactions, and focus sessions to the authenticated owner UID. Updating this file in GitHub does **not** publish the rules to Firebase automatically. Review and publish the rules in Firebase Console → Firestore Database → Rules before relying on collections beyond tasks.

Each user-owned document must include `uid` equal to the signed-in Firebase user's UID. Do not add broad public read/write rules.

## AI chat

The `/api/ai/chat` endpoint verifies the Firebase ID token with Firebase Authentication before calling the configured AI provider. It is advice-only: it does not create or edit Firestore records. The AI key is only read by the server route.
