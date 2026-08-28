# Holiwork

Holiwork is an AI-powered productivity app built with Next.js, Firebase Auth, and Firestore.

## Implemented in Phase 2

- Authentication: signup/login/logout and protected app routes
- Dashboard: dynamic greeting, AI daily brief, task progress, upcoming timeline, quick actions
- Tasks: CRUD, completion toggle, filtering, search, today/upcoming/completed views
- Calendar: month/week/day filtering views with event CRUD
- Reminders: CRUD with AI-assisted natural language parsing
- Ask Holiwork: conversation history, loading/error states, clear flow, AI action architecture
- AI architecture: `lib/ai` service layer, provider abstraction, prompts/context/tools, server API routes
- Firestore user data security rules in `/home/runner/work/holiwork.app/holiwork.app/firestore.rules`

## Required environment variables

### Firebase (client)

Create `/home/runner/work/holiwork.app/holiwork.app/.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### AI provider (server only)

```bash
AI_PROVIDER=openai
AI_MODEL=gpt-4o-mini
AI_API_KEY=
```

> `AI_API_KEY` must stay server-side and must never be exposed in browser code.

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Validation

```bash
npm run lint
npm run build
```
