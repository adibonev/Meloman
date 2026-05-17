# CLAUDE.md — Meloman Project Context

> **PURPOSE OF THIS FILE**
>
> This is the **master context document** for the Meloman project. Read this entire file before generating any code, making any architectural decision, or answering any question about this project.
>
> When the developer (Adi) asks you to work on Meloman, this file contains everything you need to know: who he is, what we're building, why, all decisions made so far, what's done, what's next, and how to behave.
>
> If something is unclear, ASK — don't guess.

---

## 0. About the developer

**Name:** Adi Bonev
**GitHub:** [@adibonev](https://github.com/adibonev)
**Email:** adibonev@students.softuni.bg
**Location:** Vidin, Bulgaria
**Native language:** Bulgarian
**English:** Comfortable for technical content, prefers Bulgarian for explanations

**Skill level (CRITICAL — calibrate accordingly):**
- Beginner-to-intermediate full-stack developer
- Currently enrolled in SoftUni "Full Stack Apps with AI" course
- Has built a few small projects with heavy AI assistance (vibe coding)
- Knows React basics but not deeply
- New to Drizzle ORM, Pusher, Auth.js
- Not familiar with monorepos before this project
- Comfortable with Git basics (clone, commit, push), just learned SSH setup

**Communication preferences:**
- Reply in **Bulgarian** by default for explanations and discussions
- Code, comments, variable names, file names: **English**
- Explain **WHY**, not just **WHAT** — he's learning, not just executing
- Show small focused diffs, not 500-line code dumps
- After every significant change, suggest the next logical step
- Use analogies — "Pusher is like a radio broadcasting station: server speaks, all clients listen at once"
- Avoid jargon without definition (no "this is just basic X" if X is unfamiliar)
- Don't ask multiple questions at once when one will do
- It's okay to push back if he asks for something risky

**Schedule:**
- Variable: some days 6 hours of work, others zero
- Don't suggest "do this every day for X minutes"
- Sprint-based pacing, milestone-driven, not daily-driven

**Tools he uses:**
- **VS Code** + **GitHub Copilot Pro** (free Student account)
- Git Bash on Windows 11
- Postman for API testing
- Browser: Microsoft Edge

**Current course progress (as of project start):**
- Course topic: ~12-13 (Back-End Development & APIs, REST, Postman, Next.js basics)
- Pending: Server-Side Development (topic 14), Full-Stack with Next.js (16), Workshop (18)
- Sprint 1 of Meloman starts AFTER topic 14

---

## 1. The project

### 1.1 Elevator pitch

**Meloman** is a music quiz platform with two surfaces:

1. **Live quiz system** — replaces Canva slides + paper answer sheets at in-person trivia nights. Host runs a presentation view on a TV (HDMI from laptop), players join via QR code on their phones, real-time leaderboard, automated grading with host override for disputed answers.

2. **Daily engagement app** — Song of the Day, Mystery Artist (4 reveal stages throughout the day), streak system, badges, music history stories. Mobile-first, habit-forming.

Both surfaces share users, content, and progression.

### 1.2 The story behind it

There's a small but enthusiastic music page in Bulgaria called **Meloman** (Bulgarian: меломан = music lover) with ~1,000 followers on Facebook/Instagram. It's run by Adi's friend, who:
- Posts music history articles, song stories, artist deep-dives
- Hosts in-person music quizzes at venues in Vidin
- Currently uses Canva slides for visuals + paper sheets for answers
- Has manual scoring, no leaderboard, no engagement between events

The friend is Adi's **co-owner** in this project (full super-admin in the system). Both will use the admin panel to add content.

The project serves two purposes simultaneously:
1. **SoftUni Capstone Project** for "Full Stack Apps with AI" course (target: 100/100)
2. **Real product launch** for the Meloman brand after exam defense

### 1.3 Target audience

- **Primary:** Meloman's existing followers (~1,000 in/around Vidin)
- **Secondary:** People who attend live quiz nights (15-30 per event, 5-8 teams of 5-6 people)
- **Future:** Bulgarian music enthusiasts beyond Vidin

### 1.4 Success metrics (post-launch)

- 100+ daily active users on the app within 3 months
- 30%+ streak retention (users with 7+ day streaks)
- 1+ live quiz event per month with full attendance
- 5+ stories published per month
- Eventually: monetization through event tickets and sponsored rounds

---

## 2. Tech stack (NON-NEGOTIABLE)

These choices are **mandated by the SoftUni course curriculum** and committed. Do not suggest alternatives.

### 2.1 Required (course mandates)

| Layer | Technology | Reason |
|---|---|---|
| **Frontend framework** | Next.js App Router | Course requirement; installed version lives in `apps/web/package.json` |
| **Backend** | Next.js API routes | Course requirement (no separate backend) |
| **Language** | TypeScript (strict mode) | Course requirement |
| **Database** | Neon PostgreSQL (EU Frankfurt) | Course requirement, GDPR compliance |
| **ORM** | Drizzle | Course requirement |
| **Auth** | Auth.js v5 + JWT | Course allows custom or library — we picked Auth.js |
| **Object storage** | Cloudflare R2 | Course requirement |
| **Mobile** | Expo SDK 52+ + React Native | Course requirement |
| **Deployment** | Vercel | Course allows Netlify/Vercel/similar |
| **Email** | Resend | Adi has prior experience |
| **Architecture** | Monorepo (Turborepo + pnpm) | Course requires monorepo |

Implementation note: the current web app uses the installed Next.js version in
`apps/web/package.json` (currently Next.js 16.2.4). Follow the local Next.js
docs and deprecation notices before changing framework-specific code.

### 2.2 Added for our specific needs

| Layer | Technology | Reason |
|---|---|---|
| **Real-time** | Pusher Channels (cluster: eu) | Required for live quiz; managed WebSocket service |
| **Styling (web)** | Tailwind v4 + shadcn/ui | Industry standard for Next.js |
| **Styling (mobile)** | NativeWind | Same Tailwind classes for Expo |
| **State (server)** | TanStack Query (React Query) | API caching layer |
| **State (client)** | Zustand (only when needed) | Minimal global state |
| **Validation** | Zod (cross-app schemas) | Source of truth for types |
| **Forms** | React Hook Form + Zod resolver | Standard for complex forms |
| **Animations (web)** | Framer Motion | Podium, transitions |
| **Animations (mobile)** | Reanimated | Native performance |
| **Rich text editor** | TipTap | Stories editor in admin |
| **i18n** | next-intl | Bulgarian default, English toggle |
| **Error tracking** | Sentry (free tier) | Production debugging |
| **Analytics** | PostHog EU Cloud | GDPR-safe, free tier |
| **QR codes** | qrcode.react (web), expo-camera (mobile) | Player join flow |
| **Device fingerprinting** | FingerprintJS | Anti-cheat for teams |

### 2.3 Forbidden alternatives (do NOT suggest these)

- ❌ **Prisma** — we use Drizzle (course mandate)
- ❌ **Supabase** — we use Neon + Auth.js + R2 (course mandate)
- ❌ **Socket.io** — we use Pusher (managed service, no server to maintain)
- ❌ **Express.js** — Next.js API routes ARE the backend
- ❌ **Redux** — TanStack Query handles server state, Zustand for transient UI
- ❌ **Material UI / Chakra / Ant Design** — we use shadcn/ui
- ❌ **MongoDB / Firebase** — Postgres only
- ❌ **JavaScript** files — TypeScript everywhere
- ❌ **Pages Router** — App Router only
- ❌ **Spotify Web Playback SDK** — requires Premium per user; legal issues
- ❌ **YouTube IFrame in quiz contexts** — Spotify ToS-equivalent restrictions; allowed only in stories

---

## 3. The complete product specification

### 3.1 Live Quiz System

#### Host presentation view
- URL: `/host/session/[code]/present`
- Fullscreen, designed for TV/projector via HDMI
- **Keyboard controls:**
  - `SPACE` — next question / reveal answer (toggle)
  - `P` — pause / resume timer
  - `O` — open override panel (approve disputed open-text answers)
  - `L` — toggle leaderboard overlay
  - `ESC` — emergency pause modal
- **Layout:**
  - Top: progress indicator (Round 2/4, Q7/10) + theme branding
  - Center: visual area (vinyl animation / blurry image / question text / multiple choice)
  - Bottom: countdown timer, "Answered: 5/8 teams" counter
- **Sponsor logo** displayed in footer if quiz has sponsor assigned

#### Player phone view (PWA)
- URL: `/play/[code]`
- Players scan QR shown on TV, choose "Install app" (PWA prompt) or "Continue in browser"
- Anonymous auth (Auth.js anonymous strategy) — no signup required to play
- After choice: enter player name → join existing team OR create new team
- Captain creates team, gets 4-char team code, shouts it at tablemates
- **Captain-only submit:** Only captain has active submit button; others see UI but can't submit
- Haptic feedback (`navigator.vibrate`) on submit
- After question reveal: small toast "Your team: #3, +150 XP"

#### The 6 question types

**Type 1: Multiple Choice**
- Host: large question text + 4 options in 2x2 grid (colors: red triangle, blue diamond, yellow circle, green square)
- Player: 4 buttons with text content
- Reveal: wrong options fade to 30% opacity, correct option pulse-glows
- Default time: 20 seconds, configurable per question
- Default points: 1, configurable

**Type 2: Open Text**
- Host: large question + contextual visual (album cover, photo)
- Player: text input + Submit button
- Auto-grading:
  1. Normalize input (lowercase, trim, strip diacritics, strip punctuation)
  2. Levenshtein distance ≤ 2 against `acceptable_answers` array
  3. If match → correct
- **Host override:** host sees all submitted answers in real-time, can manually accept rejected answers via override panel
- Multi-part variant: 2 input fields (e.g., "Song name" + "Artist"), each scored separately

**Type 3: Audio Question (5-30 sec MP3 clip)**
- Host: vinyl animation + countdown ring; audio auto-plays from R2 signed URL
- Player: "Listen carefully..." message + input/options
- **Audio source:** Admin uploads 5-30 second MP3 clip to R2
- Storage path: `/quiz-audio/[uuid].mp3`
- Signed URL valid 5 minutes
- Default time: 10-15 seconds (short to discourage Shazam usage)
- Audio clip duration and answer timer are separate:
  - If the timer is shorter than the clip, playback stops when the timer ends.
  - If the timer is longer than the clip, the clip ends naturally and the remaining time is silence.
  - Do not reduce the admin audio cap back to 15 seconds; 30-second clips are intentional.

**Type 4: Image Reveal (Mystery Artist or similar)**
- Host: large image with `filter: blur(40px)` → `blur(0px)` over question duration
- Player: same blurred image (synchronized via server timestamps) + input
- Sync formula: blur amount derived from `(server_now - started_at) / (ends_at - started_at)`
- **Image source tracking:** Admin selects from `'Wikipedia' | 'PressKit' | 'AlbumCover' | 'Other'` at upload time
- Warning modal at upload reminds about copyright
- Public display includes small attribution caption
- Default time: 20 seconds

**Type 5: Lyric Fill-in-the-blank**
- Host: lyric text with blanks (`"Put a ___ ___ his ___, pull my ___, he's ___ dead"`)
- Player: series of input fields (one per blank) OR one combined input
- Scoring: 1 point per correct word (case-insensitive)
- Host override: per-blank approval

**Type 6: Decade/Year Recognition**
- Host: plays song (audio question variant) → players guess decade + specific year
- Player: dropdown for decade + numeric input for year
- Partial credit: correct decade = 1 point, exact year = 2 points (max 3 per question)

#### Round structure
- Quiz has N rounds (admin-configurable, typically 4-6)
- Each round has a theme (e.g., "Guess the song", "Who am I?")
- Each round has questions (admin-configurable count and type mix)
- Between rounds: short pause + leaderboard refresh

#### Final Round (top N teams)
- After last regular round: cut-off to top N teams (admin sets N=2-4, or 0 for no final)
- Eliminated teams enter spectator mode (see questions, can't submit)
- Finalist teams see special "You're in the finals!" UI
- Final round can be:
  - **Standard** (auto-graded like regular rounds)
  - **Guest Host** (admin uploads MP4 video clip; video plays fullscreen on TV before each question)

#### Theme system
Quiz creator selects visual theme per quiz:
- **Modern** (default) — premium warm mid-tone (bg #2A2520, gold #FFD166 accent, cream text), Playfair Display + Inter fonts
- **Vintage 70s** — brown/orange sunburst background, script fonts, cassette/microphone illustrations (matches friend's existing Canva style)
- **Neon 80s** — synthwave aesthetic, magenta/cyan gradients, retro grid background

### 3.2 Daily Engagement System

#### Streak + XP backbone
- Daily activity → accumulates XP
- ≥10 XP per day = streak continues
- **Streak Freeze:** 1 free per week, additional purchasable with 100 XP each
- **Streak badges:** 7 days (Меломан Novice), 30 (Veteran), 100 (Lifer), 365 (Legend)
- **XP values:**
  - Song of the Day completion: 10-30 XP (based on speed and correctness)
  - Mystery Artist guess: 30-100 XP (based on which reveal stage)
  - Live quiz participation: 100-500 XP (based on team performance)
- **Weekly leaderboard:** resets every Monday, top 10 get "Champion Week" badge

#### Song of the Day
- Push notification at 08:30 (configurable per user)
- Card layout:
  - Album cover image (large, top)
  - Song title + artist name
  - 150-word story about the song
  - 1 trivia question (multiple choice)
- After answer: full story unfolds + links to YouTube/Spotify
- **Audio:** optional 30-sec MP3 preview clip from R2 (admin uploads) OR YouTube IFrame embed
- Spotify deep link always present
- Shareable: 9:16 image card for Instagram Stories

#### Mystery Artist (Daily version)
- One artist per day, 4 reveal stages throughout the day:
  - **10:00** — blurry photo (100% blur) + name input. Correct guess = 100 XP
  - **14:00** — first hint revealed (year of birth + nationality). Correct guess = 60 XP
  - **18:00** — second hint (most famous song or album). Correct guess = 30 XP
  - **22:00** — answer reveal + full story (no points awarded after this)
- Reveals controlled by Vercel Cron Jobs (or client-side stage calculation based on time)

#### Mystery Artist (Live Quiz round version)
- New decision: Mystery Artist now also exists as a round type in live quizzes
- Two variants:
  - **Variant A: Progressive blur** — single image, blur 40px → 0px over question time
  - **Variant B: Snapshot reveal** — 3 images shown sequentially (childhood photo → early career → concert)
- Points decrease with each reveal stage: 3pts → 2pts → 1pt
- Friend's existing Canva quizzes have a "Кой съм аз?" round — this is the digital version

#### Weekly Clash (post-exam, COULD have)
- Sunday 20:00 push notification: "Weekly Clash active!"
- 10 questions, asynchronous play during the week
- Top 3 → special "Champion Week" badge
- Top 10 → 500 bonus XP

#### Badges system
- **Streak badges:** 7, 30, 100, 365 days
- **Genre badges:** "Beatles Expert" (20 right Beatles answers), "Bulgarian Wave 30" (30 BG songs)
- **Local badges:** "Vidin Champion" (top 3 at live event in Vidin)
- **Special badges:** "First Quiz", "First Story Read", "First Wrapped"
- Display on profile, shareable
- Shown on Wrapped cards

### 3.3 Stories & Editorial Content

#### Story structure
- `title`, `subtitle`
- `cover_image_url` + `hero_image_url`
- `body` (TipTap HTML output): paragraphs, headings, pull quotes, embeds
- `author_id`, `reading_time_minutes`
- `tags` (artist names, genres, decades)
- `youtube_url`, `spotify_uri` (deep links, NOT embeds in quiz contexts)
- `linked_question_ids[]` — for "Test your knowledge" mini-quiz at end

#### Web layouts (magazine style, Pitchfork-inspired)
- `/stories` — featured story full-bleed at top + grid of others below
- `/stories/[slug]` — full-bleed cover hero, large typography, pull quotes, embedded YouTube IFrame players (legal in story context), Spotify deep links
- Filters: artist, decade, genre, tags
- Search bar
- Related stories at bottom

#### Artist Spotlight pages
- `/artists/[slug]` — dedicated page per artist
- Hero: artist photo + bio (sourced from Wikipedia API)
- List of stories about this artist
- "Test your knowledge" quiz section (mini-quiz with this artist's questions)
- Top tracks (YouTube IFrame embeds)
- SEO-friendly URL structure

### 3.4 Admin Panel

Available at `/admin` for users with role `admin` or `super_admin`. Both Adi and friend are super_admin.

#### Section 1: Quiz Management
- List of all quizzes with status filter (draft/published/archived)
- Quiz Builder:
  - Choose theme (modern/vintage/neon)
  - Add rounds (drag-and-drop reorder)
  - Add questions per round (6 types)
  - Audio upload (drag-drop MP3 → R2 → preview player)
  - Image upload with source warning modal
  - Spotify Search helper (paste track name → autofill metadata)
  - Wikipedia Search helper (paste artist name → autofill bio + image with attribution)
  - Final Round configuration (cut-off N teams + standard/guest video)

#### Section 2: Content Editor
- Stories: TipTap rich-text editor → drafts/preview/publish workflow
- Daily Content Manager: calendar view → tap date → add Song of the Day or Mystery Artist
- Image library (R2 file browser)
- Linked quiz questions selector

#### Section 3: Sponsor Management
- Add sponsor: name, logo upload, contact email, contract dates
- Assign sponsor to specific quiz → logo shows in host presentation footer
- "Sponsored round" option: brand a single round with sponsor logo
- Analytics: impressions per sponsor per quiz

#### Section 4: User Management (super_admin only)
- List users with role / last seen / total quizzes played
- Promote to admin / Demote to player
- Ban / Unban with reason
- Reset password (sends email via Resend)
- View user activity (quizzes played, stories read, current streak)

---

## 4. Critical product invariants

These rules are non-negotiable. Any code touching these areas must respect them.

### 4.1 Roles
Three roles in the system:
1. **`player`** — default for new users, can play quizzes and read stories
2. **`admin`** — can create/edit quizzes, stories, daily content (NOT user management)
3. **`super_admin`** — full access including user management; Adi and friend both have this

Enforcement: middleware checks `session.user.role` against route requirements.

### 4.2 Game State Machine

A `game_session` can only be in one of these states:
- `lobby` — players joining, waiting for host start
- `active` — current question in progress, timer running
- `reveal` — answer shown, scores updating
- `paused` — host paused (bar break, technical issue)
- `finished` — quiz ended, podium displayed

**Transition rules:**
- `lobby` → `active` (host clicks Start)
- `active` → `reveal` (timer expires OR host clicks Reveal)
- `reveal` → `active` (next question)
- `reveal` → `finished` (last question)
- `active` / `reveal` → `paused` (host pauses)
- `paused` → `active` / `reveal` (host resumes)

**Critical:** Every API endpoint must validate current state. Example: `POST /sessions/[code]/answer` is **only valid in `active` state**. Any other state → 400 Bad Request.

### 4.3 Captain-only submit

Each team has one captain (`team.captain_user_id`). Only the captain can submit answers. Other team members see the question UI but the submit button is disabled.

Enforcement:
- API endpoint checks `team.captain_user_id === currentUser.id` before accepting submission
- UI disables submit button when current user isn't captain
- 403 Forbidden if non-captain tries to submit

### 4.4 Server-authoritative timing

NEVER trust client clocks. All timing decisions are server-side.

When sending question-started event, include:
```typescript
{
  questionId: string,
  startedAt: number,    // server timestamp (ms)
  endsAt: number,       // server timestamp (ms)
  serverNow: number,    // for offset calculation
}
```

Client computes:
```typescript
const offset = serverNow - Date.now();
const remainingMs = endsAt - (Date.now() + offset);
// Render countdown from remainingMs
```

Why: each phone has different local clock. 200ms drift × 50 phones = unfair scoring.

### 4.5 Fuzzy matching for open answers

Open text answers matched against `acceptable_answers: string[]`:
1. Normalize: lowercase, trim, strip diacritics, strip punctuation
2. Levenshtein distance ≤ 2 against any acceptable answer = correct

Example acceptable answers for "Queen": `["Queen", "Queens", "Куин", "Queen band"]`

Host override is planned for Stage 3 and is not implemented yet in the current web flow.

### 4.6 Audio clips legal compliance

**STRICT RULES:**
- Recommended **5-30 seconds** per uploaded live quiz clip; current admin cap is **30 seconds**
- Maximum **30 seconds** for daily preview
- Audio playback is bounded by the question timer: shorter timer cuts playback early; longer timer leaves silence after the clip ends.
- Stored in Cloudflare R2, served via signed URLs (5-minute expiry)
- DMCA email `dmca@meloman.bg` required (24-48h response procedure)
- Footer disclaimer on all pages with audio:
  > "Audio snippets used under fair citation rights for educational and entertainment purposes. For full songs, support artists by purchasing on Spotify, Apple Music, or YouTube."

**NEVER do these:**
- Stream full songs through our app
- Allow audio clips longer than the limits above
- Make R2 audio files publicly accessible (signed URLs only)
- Embed Spotify Player widget in quiz contexts (Spotify Widget Terms violation)

### 4.7 Image source tracking

Every image upload must record:
- `image_source`: `'Wikipedia' | 'PressKit' | 'AlbumCover' | 'Other'`
- `image_attribution`: required if source is Wikipedia or PressKit
- Public display includes small attribution caption

Warning modal at upload time:
> "Make sure you have rights to use this image. Recommended sources: Wikipedia (Creative Commons), artist press kits, or original photos."

### 4.8 Spotify API limited use

**OK to use:**
- Search API (find tracks by name)
- Track metadata (title, artist, year, album cover URL — only as autofill helper for admin)
- Artist metadata (name, ID — only as autofill helper)

**NEVER use:**
- Spotify Embed widget in quiz UI (ToS violation)
- Spotify API for displaying album art on user-facing pages (May 2025 ToS tightening)
- Spotify API for displaying artist images on user-facing pages
- Web Playback SDK (requires Premium per user)
- Any feature that focuses on a specific artist (per May 2025 SDA rules)

Treat Spotify API as a **dev-mode internal helper only**. If access is revoked, fall back to manual entry in admin.

### 4.9 Anti-cheat

- Device fingerprint (FingerprintJS) recorded for each team member
- `UNIQUE(team_id, device_fingerprint)` constraint prevents one device from joining multiple teams in same session
- Captain-only submit (above)
- Short timers on audio questions (10-15 sec) discourage Shazam
- Audio plays only on venue PA (not on player phones) so players can't capture

---

## 5. Architecture

### 5.1 Monorepo structure

```
meloman/
├── apps/
│   ├── web/                          # Next.js App Router (UI + REST API)
│   │   ├── app/
│   │   │   ├── (public)/             # Landing, About
│   │   │   ├── (auth)/               # Login, Register
│   │   │   ├── (player)/             # Player game, profile
│   │   │   ├── (host)/               # Host dashboard, presentation
│   │   │   ├── (content)/            # Stories, Artists, Daily
│   │   │   ├── admin/                # Admin Panel (super_admin only)
│   │   │   └── api/                  # 30+ REST endpoints
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui base
│   │   │   ├── host/                 # Presentation UI
│   │   │   ├── player/               # Game UI
│   │   │   ├── editorial/            # Magazine components
│   │   │   ├── daily/                # Song of Day, Mystery Artist
│   │   │   └── admin/                # Admin tools
│   │   ├── lib/
│   │   │   ├── auth.ts               # Auth.js config
│   │   │   ├── pusher.ts             # Pusher helpers
│   │   │   └── r2.ts                 # Cloudflare R2 client
│   │   └── proxy.ts                  # JWT + role checks (Next 16 middleware)
│   └── mobile/                       # Expo React Native
│       └── app/
│           ├── (tabs)/               # Home, Daily, Profile
│           ├── play/[code].tsx       # Live quiz join
│           └── story/[slug].tsx      # Story reader
├── packages/
│   ├── db/                           # Drizzle schema + migrations
│   │   ├── schema/
│   │   │   ├── users.ts
│   │   │   ├── quizzes.ts
│   │   │   ├── sessions.ts
│   │   │   ├── stories.ts
│   │   │   └── ...
│   │   ├── migrations/
│   │   ├── seed.ts
│   │   └── client.ts
│   ├── shared/                       # Cross-app code
│   │   ├── types/                    # TypeScript types
│   │   ├── schemas/                  # Zod schemas (API validation)
│   │   ├── lib/
│   │   │   ├── fuzzy-match.ts        # Levenshtein utility
│   │   │   ├── scoring.ts            # Kahoot-style scoring formula
│   │   │   └── normalize.ts          # Answer normalization
│   │   └── constants.ts
│   └── ui/                           # Optional shared components
├── docs/
│   └── ...
├── .github/
│   ├── copilot-instructions.md
│   └── pull_request_template.md
├── AGENTS.md                         # SoftUni-required AI agent doc
├── CLAUDE.md                         # This file
├── README.md
├── turbo.json                        # Turborepo config
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

### 5.2 Real-time architecture (Pusher Channels)

#### Channel naming convention
- `quiz-{CODE}` — broadcast channel for quiz events (host + players subscribe)
- `quiz-{CODE}-host` — host-only channel for future answer counts and override actions
- `presence-team-{TEAM_ID}` — presence channel for future team lobby presence

#### Event flow (live quiz)
Current Sprint 3 web implementation uses Server Actions for the lobby flow:
1. Host clicks Start → `startQuizAction(code)`
2. Backend updates DB (`current_question_id`, `question_started_at`, `question_ends_at`)
3. Backend broadcasts `question-started` on `quiz-{CODE}`
4. Host and player lobbies refresh through Pusher subscriptions
5. Captain submits → `submitAnswerAction(code, formData)`
6. Backend validates captain-only submit, timer window, duplicate answer, then writes to DB
7. Timer expiry or host click calls `revealAnswerAction(code)`
8. Backend broadcasts `question-revealed` on `quiz-{CODE}`
9. Host clicks Next question → `nextQuestionAction(code)`

#### Fallback polling
Implemented (2026-05-16). The shared `useLiveSync` hook
(`apps/web/lib/use-live-sync.ts`) keeps the Pusher subscription as the
primary path but polls the server every 5s whenever the websocket is not
`connected`, and resyncs on tab/network return. The DB stays the source
of truth, so a Pusher outage degrades to a few seconds of lag instead of
a stuck screen. The native mobile client polls unconditionally.

### 5.3 State machine

See section 4.2 above.

### 5.4 Error recovery

| Scenario | Solution |
|---|---|
| Host loses internet | Session state in DB. On reconnect → re-fetch state → resume from current question. UI shows "Reconnecting..." overlay. |
| Player loses internet | Same as host. Missed questions = 0 points. Auto re-join when reconnected. |
| Pusher service down | `useLiveSync` polls the server every 5s while the socket is down (web) and the mobile client polls unconditionally. DB stays authoritative; screens degrade to a few seconds of lag, not a stall. |
| Host closes laptop | Session stays in current state. When host returns → resumes. Players see "Host disconnected, waiting..." |
| Two hosts on same quiz | First to open `/host/[id]/present` gets write permissions. Others see read-only with notice. |
| Player cheats with second device | Device fingerprint + UNIQUE(team_id, device_fp). Captain-only submit. |
| Vercel cold start | Cron keep-alive ping at `/api/health` every 5 minutes. |
| DB connection limit | Drizzle + Neon Pooler (not direct connection). Upgrade to Pro $19/month at production scale. |

---

## 6. Database Schema (15 tables)

All tables use:
- `id: uuid` PK with `defaultRandom()`
- `created_at: timestamp` with `withTimezone: true`
- Explicit FK references via Drizzle `references()`
- Postgres enums where applicable

### 6.1 Auth & Users (3 tables)

#### `users`
- `id` (uuid, PK)
- `email` (varchar, unique, indexed)
- `password_hash` (varchar)
- `display_name` (varchar)
- `avatar_url` (text, nullable)
- `role` (enum: 'player' | 'admin' | 'super_admin', default: 'player')
- `email_verified` (boolean, default: false)
- `created_at`, `updated_at` (timestamptz)

#### `user_progress` (Streak + XP tracking)
- `user_id` (FK → users.id, part of composite PK)
- `date` (date, part of composite PK)
- `daily_xp` (int, default: 0)
- `streak_count_at_day` (int) — denormalized for fast fetch
- `activities` (jsonb) — array of activity types completed today

#### `user_badges`
- `user_id` (FK)
- `badge_id` (FK)
- `earned_at` (timestamptz)
- `context` (jsonb) — details about how earned
- PRIMARY KEY (user_id, badge_id)

### 6.2 Quiz Content (3 tables)

#### `quizzes`
- `id` (uuid, PK)
- `creator_id` (FK → users.id)
- `title`, `description` (text)
- `cover_image_url` (text)
- `theme` (enum: 'modern' | 'vintage' | 'neon', default: 'modern')
- `language` (enum: 'bg' | 'en', default: 'bg')
- `status` (enum: 'draft' | 'published' | 'archived')
- `final_round_top_n` (int, default: 0 — 0 means no final round)
- `sponsor_id` (FK → sponsors, nullable)
- `created_at`, `published_at`

#### `rounds`
- `id` (uuid, PK)
- `quiz_id` (FK → quizzes.id, indexed)
- `title` (text)
- `order_index` (int)
- `round_type` (enum: 'standard' | 'mystery_artist' | 'final')
- `intro_slide_text` (text, nullable) — e.g., "5 questions, 1 point each..."
- `guest_video_url` (text, nullable) — for guest host finals

#### `questions`
- `id` (uuid, PK)
- `round_id` (FK → rounds.id, indexed)
- `order_index` (int)
- `question_type` (enum: 'multiple_choice' | 'open_text' | 'audio' | 'image_reveal' | 'lyric_blank' | 'decade')
- `question_text` (text)
- `media_url` (text, nullable) — R2 link for audio/image
- `media_source` (text, nullable) — 'Wikipedia', 'PressKit', etc.
- `media_attribution` (text, nullable)
- `spotify_uri`, `youtube_url` (text, nullable) — fallback links
- `options` (jsonb, nullable) — array for multiple choice
- `correct_answer` (jsonb) — array for open/lyric, or int for multiple choice
- `acceptable_answers` (jsonb) — array of string variations for fuzzy match
- `time_limit_seconds` (int, default: 20)
- `points_base` (int, default: 1)
- `linked_story_id` (FK → stories, nullable) — for "Learn more" after reveal

### 6.3 Live Sessions (4 tables)

#### `game_sessions`
- `id` (uuid, PK)
- `quiz_id` (FK → quizzes.id)
- `host_id` (FK → users.id)
- `join_code` (varchar(6), unique, indexed) — 'MELO42'
- `status` (enum: 'lobby' | 'active' | 'reveal' | 'paused' | 'finished')
- `current_question_id` (FK → questions, nullable)
- `question_started_at`, `question_ends_at` (timestamptz)
- `started_at`, `finished_at` (timestamptz)

#### `teams`
- `id` (uuid, PK)
- `session_id` (FK → game_sessions.id, indexed)
- `name` (varchar)
- `captain_user_id` (FK → users.id, nullable for anonymous)
- `color` (varchar) — hex color
- `avatar_emoji` (varchar)
- `total_score` (int, default: 0) — denormalized for fast leaderboard
- `is_finalist` (boolean, default: false)

#### `team_members`
- `id` (uuid, PK)
- `team_id` (FK → teams.id, indexed)
- `user_id` (FK → users.id, nullable)
- `anonymous_name` (varchar, nullable)
- `device_fingerprint` (varchar)
- `joined_at`
- UNIQUE(team_id, device_fingerprint) — anti-cheat

#### `answers`
- `id` (uuid, PK)
- `team_id` (FK → teams.id, indexed)
- `question_id` (FK → questions.id, indexed)
- `submitted_answer` (jsonb) — text or index or array
- `is_correct` (boolean)
- `host_override` (boolean, default: false)
- `time_to_answer_ms` (int)
- `points_awarded` (int)
- `submitted_at` (timestamptz)
- UNIQUE(team_id, question_id) — one answer per team per question

### 6.4 Editorial Content (2 tables)

#### `stories`
- `id` (uuid, PK)
- `author_id` (FK → users.id)
- `slug` (varchar, unique, indexed)
- `title`, `subtitle` (text)
- `body` (text) — TipTap HTML output
- `cover_image_url`, `hero_image_url` (text)
- `artist_name` (varchar, nullable, indexed)
- `year`, `decade` (int, nullable)
- `youtube_url`, `spotify_uri` (text, nullable)
- `published_at` (timestamptz, nullable)
- `view_count` (int, default: 0)
- `reading_time_minutes` (int)
- `tags` (jsonb) — array of strings

#### `daily_content`
- `id` (uuid, PK)
- `content_date` (date, unique, indexed)
- `content_type` (enum: 'song_of_day' | 'mystery_artist')
- `payload` (jsonb) — structured per content_type
- `linked_question_id` (FK → questions, nullable)
- `linked_story_id` (FK → stories, nullable)

### 6.5 Meta tables

Full count (matches `packages/db/schema/`): users, user_progress,
user_badges (3) + quizzes, rounds, questions (3) + game_sessions, teams,
team_members, answers (4) + stories, daily_content (2) + badges,
sponsors, quiz_sponsors (3) = **15 tables**. Source of truth is the
schema directory; `docs/database-schema.md` mirrors it.

#### `badges`
- `id` (uuid, PK)
- `slug` (varchar, unique)
- `name`, `description` (text)
- `icon_url` (text)
- `criteria` (jsonb) — auto-detection logic

#### `sponsors`
- `id` (uuid, PK)
- `name` (varchar)
- `logo_url` (text)
- `contact_email` (text)
- `contract_start`, `contract_end` (date)
- `notes` (text)

---

## 7. REST API Endpoints (30+)

All endpoints prefixed with `/api`. JWT auth via `Authorization: Bearer <token>` header. Errors in standard format: `{ error: { code: string, message: string } }`.

### 7.1 Authentication
- `POST /api/auth/register` — new user (email, password, display_name)
- `POST /api/auth/login` — login (email, password) → JWT
- `POST /api/auth/logout` — invalidate session
- `POST /api/auth/anonymous` — anonymous user (for joining quiz without registration)
- `POST /api/auth/forgot-password` — sends reset email via Resend
- `POST /api/auth/reset-password` — reset with token
- `GET /api/auth/me` — current user info

### 7.2 Quizzes (admin)
- `GET /api/quizzes` — list (filtered by role)
- `POST /api/quizzes` — new quiz [admin]
- `GET /api/quizzes/[id]` — detail
- `PATCH /api/quizzes/[id]` — update [admin]
- `DELETE /api/quizzes/[id]` — soft delete [admin]
- `POST /api/quizzes/[id]/rounds` — add round
- `POST /api/rounds/[id]/questions` — add question
- `PATCH /api/questions/[id]` — update
- `DELETE /api/questions/[id]` — delete

### 7.3 Game Sessions
Current Sprint 3 web flow uses Server Actions for host/player lobby behavior.
The REST-style endpoints below are the planned public API surface unless a
future architecture decision replaces them.

- `POST /api/sessions` — host starts session [admin]
- `GET /api/sessions/[code]` — session state (poll fallback)
- `POST /api/sessions/[code]/join` — player joins (creates team OR joins existing)
- `POST /api/sessions/[code]/start` — host starts quiz [host only]
- `POST /api/sessions/[code]/next` — next question / reveal toggle [host only]
- `POST /api/sessions/[code]/pause` — pause [host only]
- `POST /api/sessions/[code]/resume` — resume [host only]
- `POST /api/sessions/[code]/answer` — submit answer [captain only]
- `POST /api/sessions/[code]/override` — host accepts disputed answer [host only]

### 7.4 Stories & Content
- `GET /api/stories` — list (paginated, filtered)
- `GET /api/stories/[slug]` — detail (increment view_count)
- `POST /api/stories` — new story [admin]
- `PATCH /api/stories/[slug]` — update [admin]
- `GET /api/artists/[slug]` — artist spotlight page data

### 7.5 Daily Engagement
- `GET /api/daily/today` — today's Song of Day + Mystery Artist
- `POST /api/daily/song/answer` — submit Song of Day answer
- `POST /api/daily/mystery/guess` — guess Mystery Artist (with stage info)
- `GET /api/users/me/progress` — streak, XP, badges
- `GET /api/users/me/wrapped/[month]` — monthly Wrapped card data

### 7.6 Admin & Helpers
- `POST /api/admin/users/[id]/ban` — ban user [super_admin]
- `POST /api/admin/users/[id]/role` — promote/demote [super_admin]
- `POST /api/admin/upload` — get signed R2 upload URL
- `GET /api/spotify/search?q=` — Spotify search proxy (autofill helper)
- `GET /api/wikipedia/search?q=` — Wikipedia search (artist images + bio)
- `GET /api/health` — health check (cron keep-alive)

---

## 8. Coding conventions

### 8.1 TypeScript
- Strict mode mandatory (`strict: true` in tsconfig)
- **Never** use `any` — use `unknown` and narrow with type guards
- Prefer `type` over `interface` for object shapes
- Use Zod schemas as source of truth, derive types via `z.infer<typeof schema>`
- Function declarations preferred over arrow functions for top-level
- Async/await over `.then()` chains
- Throw errors at API boundaries; don't return error objects

### 8.2 File naming
- React components: `PascalCase.tsx` (e.g., `QuizBuilder.tsx`)
- Utilities/hooks: `camelCase.ts` (e.g., `useQuizSession.ts`)
- API routes: `route.ts` (Next.js App Router convention)
- Drizzle schema: `kebab-case.ts` (e.g., `game-sessions.ts`)
- Constants/enums in `SCREAMING_SNAKE_CASE`

### 8.3 Imports
- Absolute imports from `@/` for app code, `@meloman/db`, `@meloman/shared` for packages
- Group order: external packages → internal modules → types
- Blank line between groups

### 8.4 React/Next.js
- **Server Components by default**. Add `'use client'` only when needed (state, effects, browser APIs)
- **Server Actions for mutations** when possible, instead of API routes
- **Suspense boundaries** around async components for streaming
- `loading.tsx` and `error.tsx` in every route group
- One component per file, default export

### 8.5 Drizzle
- Schema files in `packages/db/schema/`, one file per entity domain
- All tables: `id` uuid PK, `created_at` timestamptz with default
- All FKs explicit with `references()`
- Use `enum` columns over text + check constraint
- Migration files committed to git

### 8.6 API endpoints
- Validate every request body with Zod schemas from `@meloman/shared`
- Return `Response.json()` with explicit status codes
- JWT validation via middleware, not per-route
- Errors in standard format: `{ error: { code: string, message: string } }`
- Rate limiting on hot endpoints (login, register, submit answer)

### 8.7 Pusher
- Channel naming must be Pusher-safe: `quiz-{CODE}`, `quiz-{CODE}-host`, `presence-team-{TEAM_ID}`
- Server triggers events; clients only subscribe
- Always include `serverNow` timestamp for client clock offset calculation

### 8.8 Comments
- Comments in **English** (industry standard)
- Document **WHY**, not WHAT
- Use JSDoc for exported functions
- TODO comments format: `// TODO(adi): description`

### 8.9 i18n
- All user-facing strings in next-intl message files
- File structure: `messages/bg.json`, `messages/en.json`
- **Never** hardcode user-facing strings in components
- Bulgarian is default language

### 8.10 Repository professionalism
- Keep the repository structure clear, documented, and honest. If a folder is documented, it should exist or be explicitly marked as planned.
- Before adding a new top-level folder or broad shared package, check `docs/repository-structure.md` and update it if the structure changes.
- Prefer small, focused commits. Do not mix unrelated cleanup, docs, and feature work unless the user explicitly asks for a batch.
- Keep docs current when changing a documented flow, especially Stage 3 live quiz behavior.
- Do not leave stale TODOs, placeholder copy, dead imports, or lint warnings when the task can reasonably clean them up.
- Before handing back substantial work, run the appropriate quality gates: lint, typecheck, tests, and build.

### 8.11 Branding constants

> **SUPERSEDED — owner-approved redesign (2026-05-16).** Meloman now uses a
> **premium warm mid-tone theme**, NOT pure monochrome. Single source of
> truth: `packages/shared/design-tokens.ts` (web applies it via CSS vars in
> `apps/web/app/globals.css`; mobile mirrors it in
> `apps/mobile/src/lib/theme.ts`). Key tokens: bg `#2A2520`, cards `#3A3530`,
> hover `#4A453F`, gold accent `#FFD166`, cream text `#F5E6D3`, muted
> `#B5A88F`. Headings = **Playfair Display** (italic for hero/story titles);
> body = **Inter**. Anton is retired. The block below is history only.

```typescript
// Brand colors — SUPERSEDED by the warm theme (see note above)
export const COLORS = {
  bg: {
    primary: '#000000',     // pure black
    secondary: '#0A0A0A',   // near-black for cards
    elevated: '#141414',    // for modals
    hover: '#1F1F1F',
  },
  fg: {
    primary: '#FFFFFF',     // pure white
    secondary: '#A8A8A8',   // mid-gray for metadata
    muted: '#6B6B6B',       // dim text
  },
  border: {
    DEFAULT: '#262626',     // subtle borders
    strong: '#404040',      // emphasized dividers
  },
} as const;

// Typography
export const FONTS = {
  heading: 'Anton',         // Google Fonts, condensed sans-serif, all-caps
  body: 'Inter',            // Google Fonts, modern sans-serif
} as const;
```

---

## 9. Design system

### 9.1 Visual language

The web app's visual language is **Pitchfork-inspired editorial**, NOT Kahoot-style playful. Key principles:
- **Dark mode by default.** Music lives in the dark.
- **Premium warm mid-tone palette** (owner-approved redesign, 2026-05-16;
  supersedes the former pure-monochrome "NO accent" system). Warm `#2A2520`
  background, cream `#F5E6D3` text, **gold `#FFD166` accent**. Source of
  truth: `packages/shared/design-tokens.ts`.
- **Typography as weapon.** **Playfair Display** for headings (large serif,
  italic for hero/story titles). Inter for body. (Anton is retired.)
- **Asymmetric grids** with generous whitespace.
- **Full-bleed hero images** with parallax on scroll.
- **Magazine-style article layouts** for stories.
- **Minimal ornamentation** — restraint over decoration.

### 9.2 Logo

Two versions provided by friend:
- **Primary (light-on-dark):** White M letter inside white headphones outline, on black background. Used in dark UI.
- **Inverse (dark-on-light):** Black version for light backgrounds (rare, for print).

Logo file paths in repo: `apps/web/public/logo-light.svg`, `apps/web/public/logo-dark.svg`

### 9.3 Quiz themes

For live quizzes, admin selects per-quiz theme:

**Modern (default):**
- Warm mid-tone — the main app theme (§8.11; formerly pure monochrome)
- Playfair Display + Inter fonts
- Minimalist transitions
- Matches main app aesthetic

**Vintage 70s:**
- Brown/orange sunburst background
- Script display fonts (e.g., Pacifico)
- Cassette tape and microphone illustrations
- Watercolor textures
- Matches friend's existing Canva quiz style

**Neon 80s:**
- Magenta/cyan synthwave gradients
- Retro grid background
- Outrun-style typography
- Glowing effects

---

## 10. Six-sprint plan

Total estimated work: **130-160 hours**. Adi has variable schedule (some days 6h, others 0). Sprint-based, not daily-based.

**Sprint 1 starts when:**
1. Course topic 14 (Server-Side Development) is complete
2. All cloud accounts are set up (✅ done)
3. Friend has provided seed content (5+ stories, 5+ MP3 clips, 5+ artist images)

### Sprint 1: Foundation (~20-25h)
**Goal:** Monorepo + Auth + DB schema + Vercel deploy. Can register, login, logout. Placeholder pages visible.

Tasks:
1. Init Turborepo + pnpm workspaces + Next.js App Router scaffold
2. Tailwind v4 + shadcn/ui + dark mode + Anton/Inter fonts
3. Drizzle config + Neon connection + first migration (users table)
4. Auth.js v5 + JWT strategy + 3 roles
5. Login + Register UI
6. Protected routes middleware (admin/super_admin checks)
7. next-intl (BG default, EN toggle)
8. Vercel deploy + custom Vercel subdomain
9. AGENTS.md + README skeleton

Commits: 8-10. PRs: `feature/monorepo-setup`, `feature/auth`, `feature/deploy`.
Deliverable: Can register, login, see different pages by role.

### Sprint 2: Quiz Builder + 6 Question Types (~25-30h)
**Goal:** Admin can create complete quiz with all 6 question types. R2 upload works.

Tasks:
1. Drizzle migrations: quizzes, rounds, questions, sponsors
2. Cloudflare R2 setup + signed URL upload helper
3. Quiz Builder UI: list view + create/edit form
4. Round editor with drag-and-drop reorder
5. Question editor — Multiple Choice
6. Question editor — Open Text + acceptable_answers array
7. Question editor — Audio (MP3 upload + preview player)
8. Question editor — Image Reveal (with image source warning)
9. Question editor — Lyric Fill-in-the-blank
10. Question editor — Decade/Year
11. Spotify Search API helper (autofill metadata)
12. Wikipedia Search helper (artist bio + images)
13. Theme selector (modern/vintage/neon previews)
14. Seed: 1 demo quiz with all 6 types

Commits: 10-12. PRs: `feature/db-schema`, `feature/r2-upload`, `feature/quiz-builder`, `feature/question-types`.
Deliverable: Can create complete demo quiz with all 6 question types.

### Sprint 3: Live Game Engine + Pusher (~25-30h)
**Goal:** Real working live quiz! Can play with 5-8 friends across browsers.

Tasks:
1. Pusher Channels setup + helper module
2. game_sessions, teams, team_members, answers migrations
3. Session creation + join code generator
4. Player join flow: QR → choice modal → anonymous auth → team formation
5. Team lobby UI with Pusher presence (live roster)
6. Host Presentation route (fullscreen, keyboard controls)
7. State machine: lobby → active → reveal → paused → finished
8. Question rendering — Multiple Choice (host + player views)
9. Question rendering — Open Text
10. Question rendering — Audio (R2 signed URL playback)
11. Question rendering — Image Reveal (progressive blur sync)
12. Server-authoritative timer (offset calculation)
13. Answer submission RPC + Kahoot scoring formula
14. Fuzzy matching + host override panel
15. Reveal animation + leaderboard broadcast
16. End-of-quiz podium with Framer Motion
17. Final round logic (top N teams cut-off)

Commits: 12-15. PRs: `feature/pusher`, `feature/host-presentation`, `feature/player-game`, `feature/scoring`.
Deliverable: Real quiz playable with friends. WOW moment.

### Sprint 4: Mobile App + Daily Basics (~25-30h)
**Goal:** Expo app with 6+ screens. Daily Streak + Song of Day work.

Tasks:
1. Expo init + Expo Router + NativeWind + shared API client
2. Login + Register screens (reuse Zod schemas)
3. Secure storage for JWT (expo-secure-store)
4. Home tab — featured story + daily teaser + stats
5. Join Quiz screen (expo-camera QR scanner)
6. Live game screen (all 6 question types on mobile)
7. Daily migrations: user_progress, badges, daily_content
8. XP calculation helpers (shared package)
9. Streak system + Streak Freeze logic
10. Song of the Day screen (web + mobile)
11. Profile screen + badges showcase
12. Stories tab (mobile)
13. EAS Android APK build + test

Commits: 10-12. PRs: `feature/expo-init`, `feature/mobile-auth`, `feature/qr-scanner`, `feature/daily-streak`.
Deliverable: Android APK that works on phone. Can play quiz and do Song of Day.

### Sprint 5: Admin + Stories + Mystery Artist + Polish (~20-25h)
**Goal:** Admin tools, stories with magazine layout, Mystery Artist, polish.

Tasks:
1. stories migration + TipTap editor in admin
2. Stories list page + single story (magazine layout)
3. Artist Spotlight pages (`/artists/[slug]`)
4. Story → Quiz links ("Learn more" after reveal)
5. Daily Content Manager (calendar view)
6. Mystery Artist (4 reveal stages, daily) — cron jobs
7. Mystery Artist (live quiz round version)
8. Sponsor management UI + sponsor logo on host presentation
9. User Management (ban/promote/reset password)
10. Admin analytics dashboard (basic stats)
11. Editorial polish: full-bleed heroes, parallax, scroll animations
12. Cyrillic font QA on iOS Safari (real device test!)
13. Sentry + PostHog event tracking

Commits: 10-12. PRs: `feature/stories`, `feature/mystery-artist`, `feature/admin-panel`, `feature/editorial-polish`.
Deliverable: Polished product, not just demo.

### Sprint 6: Documentation + Demo + Real Dry-run (~10-15h)
**Goal:** Submission-ready + real test with audience.

Tasks:
1. README with architecture diagram + DB schema (Mermaid)
2. API documentation (markdown file)
3. Setup guide (local dev)
4. Folder structure description
5. Seed script: 5 stories, 7 Song of Day, 3 Mystery Artist, 1 demo quiz
6. Demo credentials in README
7. Loom walkthrough (3 minutes)
8. Screenshots for README
9. Real dry-run at venue in Vidin
10. Bug fixes from dry-run feedback
11. Final deploy + lock main branch
12. Submission with GitHub repo URL + live URL + credentials

Commits: 8-10. PRs: `feature/docs`, `feature/seed-data`, `feature/dry-run-fixes`.
Deliverable: 100/100 ready submission + video from real used quiz.

---

## 11. Things to refuse / push back on

If asked to:
- Add Prisma → **refuse**, we use Drizzle (course mandate)
- Add Socket.io → **refuse**, we use Pusher
- Add Express.js → **refuse**, Next.js API routes are the backend
- Add Material UI / Chakra → **refuse**, we use shadcn/ui
- Stream full songs in-app → **refuse**, copyright violation
- Use Spotify Embed in quiz UI → **refuse**, violates Spotify Widget Terms
- Hardcode user-facing strings → **refuse**, use i18n
- Use `any` type → **refuse**, ask for proper typing
- Skip migrations and use raw SQL → **refuse**, use Drizzle migrations
- Commit secrets → **refuse**, use `.env.local` (gitignored)
- Skip Server Components in favor of all client → **refuse**, defaults matter
- Add Redux → **refuse**, we use TanStack Query + Zustand
- Disable TypeScript strict mode → **refuse**, strict is non-negotiable
- Use JavaScript instead of TypeScript → **refuse**

---

## 12. Cloud services & credentials

| Service | URL | Account | Purpose | Tier |
|---|---|---|---|---|
| **GitHub** | github.com/adibonev/meloman | adibonev | Source control | Free |
| **Vercel** | vercel.com | adibonev | Hosting + Edge | Free (Hobby) |
| **Neon** | neon.tech | (linked) | Postgres DB | Free tier first 3 months, $19/mo Pro after |
| **Pusher** | pusher.com | (linked) | Realtime WebSockets | Sandbox (free) |
| **Cloudflare R2** | dash.cloudflare.com | (linked) | Object storage | Free 10GB/mo |
| **Sentry** | sentry.io | (pending) | Error tracking | Free tier |
| **PostHog** | eu.posthog.com | (pending) | Analytics (GDPR-safe EU) | Free tier |
| **Resend** | resend.com | adibonev (existing) | Transactional email | Free 100/day |
| **Expo / EAS** | expo.dev | (pending) | Mobile builds | Free tier (30 builds/mo) |

All credentials stored in `meloman-credentials.txt` (NOT in git).
Production env vars stored in Vercel project settings.

---

## 13. Demo credentials (for grading)

```
Super Admin (Adi):
  Email: super-admin@meloman.bg
  Password: demo123

Super Admin (friend):
  Email: friend@meloman.bg
  Password: demo123

Demo Player:
  Email: player@meloman.bg
  Password: demo123

Demo Host: created when starting quiz session
```

---

## 14. SoftUni grading criteria coverage (target: 100/100)

| Criterion | Target | How we cover it |
|---|---|---|
| GitHub Commits | 15/15 | ~50 commits across sprints (1 pt/commit, max 15) |
| Commit Days | 15/15 | 30+ active days (5 pt/day, max 15) |
| Architecture | 5/5 | Turborepo monorepo, REST between web/mobile and backend |
| Backend API | 7/7 | 30+ REST endpoints with JWT middleware |
| Database | 8/8 | 15 tables with Drizzle (3× requirement of 4) |
| Auth and Security | 5/5 | Auth.js v5, JWT, 3 roles, bcrypt, role middleware |
| Web App Screens | 10/10 | 12+ screens (login, register, home, stories, quiz builder, host presentation, player game, daily, profile, admin, artists) |
| Admin Panel | 10/10 | Full admin: users, content, daily, sponsors, analytics |
| Mobile App | 9/9 | Expo with 6+ screens, EAS Android APK build |
| Deployment | 10/10 | Vercel EU production with demo credentials |
| Documentation | 6/6 | README, AGENTS.md, CLAUDE.md, DB schema (Mermaid), API docs |

---

## 15. What's pending from friend (BLOCKING for content)

Friend is providing seed content. Status:
- [ ] 5-10 Meloman page articles (text export) → for Stories
- [ ] 5+ MP3 audio clips (~30 sec each) → for demo audio quiz
- [ ] 5+ artist photos from Wikipedia → for demo Mystery Artist
- [ ] 10-15 quiz questions (mix of types) → for demo quiz
- [ ] Decision: domain purchase (meloman.bg) or wait
- [ ] Spotify account access for Spotify API testing (he has Premium)

---

## 16. Current project status

**As of 2026-05-16 (capstone submission state):**
- ✅ Sprints 1–3 complete: monorepo, Auth.js, i18n, quiz builder with six
  question types, full live quiz engine (fullscreen host presentation,
  server-authoritative timer, grading + host override, pause/resume,
  per-round elimination, between-rounds leaderboard, podium).
- ✅ REST API surface: 30+ JSON endpoints with cookie + bearer auth guards.
- ✅ Stories + Daily: 15 DB tables, public magazine screens, profile.
- ✅ Admin: quizzes, sponsors, user management, stories editor, daily
  manager, analytics.
- ✅ Mobile: Expo SDK 55 app, 7 screens, Android APK via EAS.
- ✅ Deployed: https://meloman-web.vercel.app + seeded real content.
- ✅ Docs: README (architecture + demo creds), `docs/api.md`,
  `docs/database-schema.md`, CI green.

**Remaining (Phase 6 / 7):** Loom walkthrough (owner-recorded). The
deferred items have since shipped (TipTap editor, password reset, Framer
Motion polish, host join QR, fallback polling, NativeWind migration —
see `docs/backlog.md`). Still deliberately deferred: only the in-app
expo-camera QR scanner (EAS-build risk; the web host QR already covers
scan-to-join).

Deferred-by-design trade-offs for the deadline are logged honestly in
`docs/backlog.md` and `docs/final-10-day-plan.md`.

---

## 17. Quick decision tree for common questions

**"Should I use X library?"**
- Is it in section 2.1 or 2.2? → Yes, use it.
- Is it in section 2.3? → No, refuse.
- Not listed? → Ask Adi, then update this file.

**"How should I implement feature X?"**
- Check section 3 (product spec) for behavior
- Check section 4 (invariants) for constraints
- Check section 5 (architecture) for patterns
- Check section 6 (DB schema) for data model
- Check section 7 (API) for endpoint patterns

**"Should I add a new table?"**
- Probably not — section 6 has 15 tables covering everything
- If new entity is needed, document why in PR description
- Update DB schema diagram

**"Should I commit secrets?"**
- NEVER. Use `.env.local` (gitignored). Document required env vars in `.env.example`.

**"Adi is asking for something risky"**
- It's okay to push back. Explain the risk. Suggest safer alternative.
- He values honest feedback over compliance.

---

## 18. Communication examples

### Good response style
> "Чудесно, нека да направим това. Първо ще създадем `users` schema файла в `packages/db/schema/users.ts`. Това е базата — всичко друго (sessions, teams, etc.) реферира към user.
>
> Ето кода:
>
> ```typescript
> // packages/db/schema/users.ts
> import { pgTable, uuid, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core';
> 
> export const userRoleEnum = pgEnum('user_role', ['player', 'admin', 'super_admin']);
> 
> export const users = pgTable('users', {
>   id: uuid('id').primaryKey().defaultRandom(),
>   email: varchar('email', { length: 255 }).notNull().unique(),
>   // ...
> });
> ```
>
> Защо `pgEnum` вместо varchar? Postgres enum-ите дават type safety на DB ниво — невалидна стойност не може да се запише.
>
> Следваща стъпка: създай миграцията с `pnpm db:generate`. Това ще генерира SQL файл, който трябва да commit-неш."

### Bad response style (avoid)
> "Use Drizzle. Here's 200 lines of code." [No explanation, no context, dumps everything]

### When to ask vs. assume
- Ambiguous requirement → ASK
- Standard pattern from this doc → ASSUME
- New decision not in this doc → ASK
- Adi seems confused → SLOW DOWN, EXPLAIN

---

## 19. End notes

This file is the source of truth. If something contradicts this file, this file wins. If you find inconsistencies, flag them — Adi will resolve.

When working on this project, always:
1. Read this file first
2. Be patient with Adi — he's learning
3. Explain WHY
4. Use Bulgarian for chat, English for code
5. Make small, focused changes
6. Commit often with clear messages
7. Push back on bad ideas
8. Ask when unsure

This file is updated as the project evolves. Last updated: project kickoff phase.

---

**END OF CONTEXT FILE**
