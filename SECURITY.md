# Security

MindCareAI runs entirely on the machine it is installed on. There is no hosted service, no
account system and no server that holds user data.

## What is stored, and where

| Data | Location | Committed? |
|---|---|---|
| Guest id | Browser localStorage | No |
| Provider API key | Browser localStorage | No |
| App settings (provider, model, temperature) | Browser localStorage | No |
| Journal, moods, habits, chat history | `prisma/dev.db` on the local disk | No — git-ignored |
| `DATABASE_URL` | `.env` | No — git-ignored; `.env.example` holds the template |

## Handling API keys

Your OpenRouter, Groq or Gemini key is entered in the setup wizard and kept in
localStorage. It is sent, per request, to a local Next.js route handler, which forwards it
to that provider and nothing else. Specifically, the key is:

- never written to `.env` or any file on disk,
- never logged to the server console or included in error messages,
- never sent to any host other than the provider you selected,
- never included in an exported backup unless you explicitly choose to include settings.

Treat a key as compromised if you paste it anywhere outside the app, and rotate it at your
provider's console.

## Before you commit

`.gitignore` already excludes `.env`, `prisma/*.db` and exported backups. If you fork or
extend this project, keep those rules and check `git status` before your first push —
`prisma/dev.db` contains your own journal entries in plain text.

## Reporting a vulnerability

Open an issue describing the problem and how to reproduce it. Do not include real API keys,
database files or personal journal content in the report.

## Scope note

MindCareAI is a wellbeing companion, not a medical service, and it is not designed to hold
clinical records. Do not use it to store information you would be harmed by losing or
exposing.
