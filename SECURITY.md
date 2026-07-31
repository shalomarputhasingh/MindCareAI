# Security

MindCareAI runs entirely on the machine it is installed on. There is no hosted service, no
account system and no server that holds user data.

## What is stored, and where

| Data | Location | Committed? |
|---|---|---|
| Guest id | Browser localStorage | No |
| Provider API key | Browser localStorage | No |
| App settings (provider, model, temperature, language) | Browser localStorage | No |
| Journal, moods, habits, chat history | `prisma/dev.db` on the local disk | No — git-ignored |
| `DATABASE_URL` | `.env` | No — git-ignored; `.env.example` holds the template |
| Voice recordings | Nowhere — held in memory only, for the length of one request | No |

## Handling API keys

Your OpenRouter, Groq or Gemini key is entered in the setup wizard and kept in
localStorage. It is sent, per request, to a local Next.js route handler, which forwards it
to that provider and nothing else. Specifically, the key is:

- never written to `.env` or any file on disk,
- never logged to the server console or included in error messages,
- never sent to any host other than the provider you selected,
- never written into an exported backup. Backups carry your provider, model,
  temperature and token settings, but the key is deliberately left out, because
  a backup file is the one artefact here meant to be copied and moved around.
  Importing a backup likewise never overwrites the key already in your browser.

Treat a key as compromised if you paste it anywhere outside the app, and rotate it at your
provider's console.

## Voice, and the audio it produces

Voice is the one feature that can put your own recorded speech on the network, so it is
off until you turn it on and the app states where the audio goes at the moment it is
recording.

**Push-to-talk dictation (speech to text).** The microphone only opens while you
deliberately start a recording, a recording indicator is shown for as long as it is open,
and the resulting transcript is placed in the message box for you to read and correct — it
is never sent automatically. There are two backends:

- *Browser recogniser* (the default). Handled by the Web Speech API. Note that this is not
  automatically on-device: Chrome and Edge send the audio to their vendor's speech service,
  while Safari and Firefox process it locally. That choice belongs to your browser, not to
  MindCareAI.
- *Cloud transcription* (opt-in, Settings → Voice; Groq and Gemini only). The recording is
  posted to `/api/transcribe` on your local server, forwarded once to the provider you
  selected with your own key, and discarded. **The audio does leave your machine** and is
  then subject to that provider's retention policy. Nothing else in the app sends audio
  anywhere.

If you have chosen a language rather than leaving it on automatic, a two-letter code —
`ta` or `en`, nothing more — travels with the recording so the provider does not have to
guess. On the Gemini path that code is placed into a prompt, so the route handler accepts
it only if it is exactly two letters and drops anything else.

**Live voice chat.** A separate, explicitly entered mode in which the conversation runs
hands-free. It differs from push-to-talk in two ways that matter:

- **The microphone stays open** for the whole session, not just while a button is held.
  The panel says so continuously, and ending the session releases the microphone track
  immediately. It is also released if you navigate away.
- **Each turn sends as soon as you stop speaking.** Nothing is reviewed first — that is
  what hands-free means, and it is the trade-off you accept by entering the mode. The
  panel shows the text of every turn it heard, so a mishearing is at least visible after
  the fact, and the session can be ended mid-sentence.

Turn boundaries are detected locally, by measuring loudness against the room's own noise
floor; the audio itself is only sent once a turn has ended, and only in cloud mode. While
the assistant is speaking, capture is suspended so its own voice is never transcribed, and
the detector watches only for a much louder sound so you can interrupt it.

In every case the recording is held in memory only. It is never written to `prisma/dev.db`,
never written to a temporary file, and never included in an exported backup. As with
`/api/chat`, the transcription route never logs the request, because it carries your key.

**Read aloud (text to speech).** Uses the operating system's own `speechSynthesis` voices.
No key, no network request, and nothing uploaded — including for Tamil, which is read by
whatever Tamil voice the device already has, not by a service. If it has none, the reply is
shown but not spoken; nothing is fetched to make up the difference. Auto-read is suppressed while the crisis
support screen is showing — a support message spoken by a synthetic voice is not something
to hand someone unprompted. This holds in live voice chat too: the reply appears on screen
but is not read out, and the session is left running rather than cut off mid-conversation.

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
