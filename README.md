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

## Getting started

Requires Node.js 20 or newer.

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
npx prisma migrate dev
npm run dev
```

Open <http://localhost:3000>. The design system reference lives at
<http://localhost:3000/design>.

You will need an API key from one of the supported providers
([OpenRouter](https://openrouter.ai/keys), [Groq](https://console.groq.com/keys) or
[Google AI Studio](https://aistudio.google.com/apikey)). The setup wizard walks you through
adding it.

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
  language in Settings → Language. The interface itself stays in English.
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
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Lint |
| `npx prisma studio` | Browse the local database |

## Design system

Tokens live in `styles/globals.css`. Indigo (`primary`) marks anything the user acts on;
teal (`brand`) marks anything reflecting the user back to themselves — streaks, progress,
moods. Headings are set in Fraunces with its SOFT and WONK axes raised; Inter does all
interface work. Every token and shared component is rendered at `/design` in both themes.

## Licence

MIT
