# Meloman — Mobile app

Expo (SDK 55) React Native client for **Meloman**, the author-led live
music quiz. It is the companion to the web app: players join live quiz
nights from their phone and follow the daily music content between
events. The web app remains the backend and the host/admin surface —
this app talks to it over the same JSON API.

## Live links

| | URL |
| --- | --- |
| Mobile web client (Expo export) | https://meloman-mobile.vercel.app |
| Android APK + Expo project | https://expo.dev/accounts/adibonevs-organization/projects/meloman |
| Web app / API | https://meloman-web.vercel.app |

## What this app is

- A **player + reader** client, not an admin/host tool.
- Live quiz: join a session, pick/create a team, answer in real time,
  watch the leaderboard.
- Daily content: Song of the Day, Mystery Artist, stories, profile
  (points, streak, badges).

## Main screens

- `(tabs)/index` — home: featured story, daily teaser, socials.
- `(tabs)/daily` — Song of the Day / Mystery Artist with reveal stages.
- `(tabs)/stories` + `story/[slug]` — editorial stories.
- `(tabs)/profile` — points, streak, badges (signed in).
- `play` — join + live quiz screen.
- `login` — sign in.

## Quiz code join flow

`play` screen → type the 6-char join code shown on the venue screen →
**Продължи**. The app polls the play-state endpoint (no Pusher client
in RN) and walks: choose/create team → lobby → question → reveal →
finished. The server stays the source of truth.

## QR join flow

`play` screen → **Сканирай QR** → `expo-camera` reads the host
`/present` QR. `parseJoinCode()` extracts the code from the join URL
(or accepts a pasted raw code), then the same join flow runs. All three
camera-permission states are handled; the camera needs a real device or
dev build (Expo Go on SDK 55 / `expo export` can't exercise it).

## Auth and guest player flow

- Auth is JWT-based, stored with `expo-secure-store` (in-memory cache
  fallback so the token survives in-app browsers).
- Reading content and the daily screens work signed out.
- Live quiz currently requires a signed-in user; the **guest-friendly
  entry** (anonymous throwaway user → name → team → play) lives on the
  web `/play/[code]` flow. The mobile client reuses the same API and
  token; full in-app anonymous join is a documented follow-up.

## How it talks to the web API

All data goes through `src/lib/api.ts` over the shared JSON REST API.
Base URL resolution order:

1. `EXPO_PUBLIC_API_BASE_URL` env var
2. `app.json` → `expo.extra.apiBaseUrl` (LAN IP in dev, Vercel URL in
   prod)
3. `http://localhost:3000` fallback

The web app sends permissive CORS headers for `/api/*` so the exported
web build and native client can call it cross-origin.

## Run locally

```bash
pnpm install                       # from the repo root
# point the app at your dev machine's LAN IP:
#   app.json -> expo.extra.apiBaseUrl, or EXPO_PUBLIC_API_BASE_URL
pnpm --filter mobile start         # Expo dev server
pnpm --filter mobile web           # run as a web client
pnpm --filter mobile typecheck     # tsc --noEmit
pnpm --filter mobile test          # jest (pure logic)
```

Expo Go on the App/Play store only supports the latest stable SDK, so
SDK 55 needs a dev build or the web client for on-device testing.

## Build the Android APK

EAS is configured in `eas.json`:

```bash
npm i -g eas-cli
eas login
eas build -p android --profile preview   # APK artifact
```

Set `expo.extra.apiBaseUrl` to the production Vercel URL before a
release build. The static web client is produced with
`pnpm --filter mobile build:web` (`expo export -p web`).
