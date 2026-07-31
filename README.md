# MindCareAI

A calmer place to check in with yourself.

MindCareAI is an AI wellbeing companion for daily reflection, mood tracking and healthy
habits, in English or Tamil. It runs entirely on your own machine: no accounts, no cloud
database, no telemetry.

> **MindCareAI is a wellbeing companion, not a medical service.** It is not a therapist,
> doctor or emergency service, and it is not a substitute for professional help. If you are
> in immediate danger, contact your local emergency services.

## Status

All sixteen modules are built. Every route compiles, serves, and has been
exercised end to end.

| # | Module | # | Module |
|---|---|---|---|
| 1 | Project setup and data layer | 9 | Daily journal |
| 2 | Design system | 10 | Healthy habits |
| 3 | Landing page | 11 | Daily report |
| 4 | Setup wizard | 12 | Emergency support |
| 5 | AI service layer | 13 | Notifications |
| 6 | Sidebar and app layout | 14 | Settings |
| 7 | AI chat | 15 | Export and import |
| 8 | Mood tracker | 16 | Final polish |

## Routes

| Route | What it is |
|---|---|
| `/` | Landing page |
| `/setup` | First-run wizard: provider, key, model |
| `/app` | Today at a glance |
| `/app/chat` | Streaming AI conversation |
| `/app/mood` | One check-in a day, with a calendar and streak |
| `/app/journal` | Autosaving daily entry and history |
| `/app/habits` | Daily checklist, custom habits, 30-day heatmap |
| `/app/report` | How a given day went |
| `/app/support` | Crisis resources and grounding techniques |
| `/app/settings` | Provider, model, notifications, export and import |
| `/design` | Living design-system reference |

## Tech stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Lucide · Prisma ORM ·
SQLite · OpenRouter / Groq / Google Gemini APIs · Browser Notification API · localStorage

## Running the app

Requires **Node.js 20 or newer** (developed on 24.16) and npm 10+. No database server, no
Docker, no services to start — SQLite is a file on disk.

```bash
npm install
cp .env.example .env            # PowerShell: Copy-Item .env.example .env
npx prisma migrate dev          # creates prisma/dev.db and generates the client
npm run dev                     # http://localhost:3000
```

`.env` holds exactly one variable, `DATABASE_URL="file:./dev.db"`. Provider API keys are
deliberately **not** environment variables — see below.

To run the production build instead:

```bash
npm run build
npm run start                   # http://localhost:3000
PORT=3111 npm run start         # or on another port; PowerShell: $env:PORT=3111; npm run start
```

### You need an API key, and only a human can supply it

AI Chat calls whichever provider you choose with **your own key** — from
[OpenRouter](https://openrouter.ai/keys), [Groq](https://console.groq.com/keys) or
[Google AI Studio](https://aistudio.google.com/apikey). The key is entered in the setup
wizard at `/setup` and lives in that browser's localStorage. It is never read from `.env`,
never written to disk and never committed, which also means **it cannot be injected by a
script or a CI job**. Everything except chat — mood, journal, habits, the daily report,
emergency support — works with no key at all.

## Notes for automated agents

Everything below is the non-obvious part. The rest of the app behaves as you would expect.

**`/app/*` redirects to `/setup` unless localStorage is seeded.** `components/layout/app-shell.tsx`
sends anyone without a provider, key *and* model to the wizard, exempting only
`/app/settings` and `/app/support`. The redirect is client-side, so `curl` reports `200` for
`/app/chat` while a real browser lands on `/setup` — a browser-driven test that skips the
seed will silently measure the wizard on every route. Seed before navigating:

```js
localStorage.setItem("mindcare.guest-id", "guest_testtest");
localStorage.setItem("mindcare.settings", JSON.stringify({
  provider: "groq", apiKey: "test-key", model: "llama-3.3-70b-versatile",
  temperature: 0.7, maxTokens: 2048, onboarded: true, language: "auto",
  voice: { cloudInput: false, speakReplies: false, voiceURI: "", rate: 0.95 },
}));
```

In Playwright use `context.addInitScript`, which runs before every navigation. Note it
re-runs on *each* page load, so it will overwrite a setting changed through the UI earlier
in the same test.

**The localStorage keys are dotted, not underscored.** They are listed in one place,
`STORAGE_KEYS` in `lib/constants.ts`: `mindcare.settings`, `mindcare.guest-id`,
`mindcare.habits`, `mindcare.notifications`, `mindcare.theme`. Guessing
`mindcare_settings` fails silently — the app just sees an unconfigured browser.

**Exercising chat without a key.** Intercept the route rather than trying to supply one.
`POST /api/chat` streams `text/plain` and signals the crisis panel with a header:

```js
await page.route("**/api/chat", (route) => route.fulfill({
  status: 200,
  headers: { "Content-Type": "text/plain; charset=utf-8", "X-MindCare-Support": "0" },
  body: "A reply, streamed as plain text.",
}));
```

Also stub `**/api/chat/history**` (both the `GET` list and the `POST` append) or the run
writes into the real `prisma/dev.db`. Return a **unique `message.id` per call** — the
read-aloud logic skips any assistant message whose id it has already spoken, so a constant
id makes the second reply look silently broken.

**Don't add dependencies.** The stack is fixed (see Tech stack). Test-only tooling such as
Playwright belongs in a scratch directory outside the repo, never in `package.json`.

**Verification, in the order worth running:**

```bash
npx tsc --noEmit                # types; must be silent
npm run lint                    # eslint; must be silent
rm -rf .next && npm run build   # a stale .next masks real breakage
```

A clean `npm run build` is the real gate — `next build --turbopack` catches server/client
boundary mistakes that `tsc` does not.

**Never commit** `.env`, `prisma/*.db` or exported `*.json` backups. They are git-ignored
already; `prisma/dev.db` contains journal entries in plain text.

**Voice and speech in headless browsers.** Chromium exposes no `speechSynthesis` voices at
all, headless or headed, so read-aloud cannot be verified end to end — inject a voice list
over `speechSynthesis.getVoices` and stub the `voice` property setter, which otherwise
rejects any object the browser did not create. For microphone work, launch with
`--use-fake-device-for-media-stream`; its default tone is steady enough that the
voice-activity detector correctly treats it as background noise and never opens a turn, so
pass `--use-file-for-fake-audio-capture=<file>.wav` with real speech-shaped audio.

## How your data is handled

- **No accounts.** A guest id such as `guest_a1b2c3d4e` is generated in your browser and
  kept in localStorage. It is the only thing scoping your data.
- **Your writing stays local.** Journal entries, moods, habits and chat history are stored
  in a SQLite file at `prisma/dev.db`, which is git-ignored and never leaves your machine.
- **API keys stay in your browser.** Your provider key lives in localStorage and is sent
  only to that provider, by way of a local route handler. It is never written to `.env`,
  never logged and never committed.
- **Nothing personal is committed.** `.gitignore` excludes `.env`, the database file and
  any exported backup.
- **Tamil, as well as English.** By default the assistant answers in whichever language
  you wrote in, including Tamil typed in English letters, and you can pin it to one
  language in Settings → Language. The interface itself stays in English. Replies are read
  aloud with a Tamil voice if the device has one; if not, the Tamil is romanised locally
  and spoken by an English voice rather than falling silent, and Settings explains how to
  install a real one.
- **Voice is opt-in, and says where it goes.** Push-to-talk dictation runs only while you
  hold the mic open, and the transcript lands in the message box for you to read and edit
  before it is sent. Live voice chat is a separate mode you enter deliberately: the
  microphone stays open and each turn sends as soon as you pause, with no review step. By
  default the browser's own recogniser does the work; turning on cloud transcription in
  Settings uploads the recording to your chosen provider instead. Either way the audio is
  never written to disk. Replies read aloud use your device's built-in voices and are
  never uploaded.

## Project structure

```
app/            routes, layouts, error boundaries, api route handlers
components/     ui/ (shadcn), shared/ (reusable primitives)
features/       one folder per feature
lib/            prisma client, ai service, guest id, dates, constants
hooks/          localStorage, guest id, mount-gating
prisma/         schema and migrations
types/          shared domain types
styles/         design tokens and global CSS
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with Turbopack, on port 3000 |
| `npm run build` | Production build (`next build --turbopack`) |
| `npm run start` | Serve the production build; honours `PORT` |
| `npm run lint` | ESLint (flat config); silent output means clean |
| `npx tsc --noEmit` | Typecheck only |
| `npx prisma migrate dev` | Apply migrations and regenerate the client |
| `npx prisma migrate status` | Check whether `dev.db` matches the schema |
| `npx prisma studio` | Browse the local database in a browser |

There is no test script. Verification is `tsc` + `lint` + a clean `build`, plus driving the
running app in a browser.

## Design system

Tokens live in `styles/globals.css`. Indigo (`primary`) marks anything the user acts on;
teal (`brand`) marks anything reflecting the user back to themselves — streaks, progress,
moods. Headings are set in Fraunces with its SOFT and WONK axes raised; Inter does all
interface work. Every token and shared component is rendered at `/design` in both themes.

## Licence

MIT
