# Pàdé

**Pàdé: meet someone worth meeting.** (*Pàdé* is Yoruba for "meet".)

A mobile-first web app for DevFest Ibadan. Attendees scan a QR code, enter a name and emoji, pick 3 interests, a goal and a fun pick, and get matched right away with someone in the room. Each match comes with a funny icebreaker and a **Found them!** button. `/live` is the projector view, with live counters and the QR code.

- **Stack:** Next.js 16 (App Router) + TypeScript + Tailwind v4, Supabase Postgres (supabase-js over HTTP, service role on the server only), OpenAI for icebreakers only, deployed on Vercel.
- **Matching** is plain TypeScript scoring, not AI. **Icebreakers** come from one short OpenAI call with a 6s timeout. If that call fails, a pre-written template is used, so the app never errors because of the AI.

## Screens

| Route | What |
| --- | --- |
| `/` | Onboarding (name, emoji, 3 interests, goal, "Jollof: party or smoky?") → match screen (match card, icebreaker, Found them!, Match again, "Looking for you", people you've met) |
| `/live` | Big-screen view: people joined, matches made, found in person, QR code to the app |

## Setup (about 10 minutes)

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste all of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. It's safe to re-run.
   This creates `profiles` and `matches`, the indexes and the `pade_stats()` function, and turns on row level security with no public policies. The anon key can read nothing. All access goes through the API routes using the service role.
3. Copy these from **Project Settings → API**: Project URL, `anon` key and `service_role` key.

### 2. Local env
```bash
cp .env.example .env.local   # then fill it in
npm install
```

| Variable | Where it's used |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Server (and safe for the browser) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Not needed by the current code, kept for completeness |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only.** Never prefix it with `NEXT_PUBLIC_` |
| `OPENAI_API_KEY` | Icebreakers. Optional: without it, template icebreakers are used |
| `OPENAI_MODEL` | Optional, defaults to `gpt-4o-mini` |
| `NEXT_PUBLIC_APP_URL` | Optional. The URL encoded in the `/live` QR code. Defaults to the current host |

### 3. Seed 30 demo profiles
```bash
npm run seed
```
This inserts 30 `is_demo = true` profiles with Nigerian names, so matching works even when the room is empty. Re-running it replaces them. Real people always score higher than demo profiles, so demo profiles only show up when there are few real matches. Demo matches show a "Demo profile" badge.

### 4. Run
```bash
npm run dev
```
Open http://localhost:3000 on your phone (same wifi) and http://localhost:3000/live on the projector.

**No Supabase yet?** In development the app falls back to an in-memory store that is pre-seeded with the demo profiles, so `npm run dev` works with an empty `.env.local`. Production never uses it unless you set `PADE_MEMORY_DB=1`.

## Deploy to Vercel
1. [vercel.com/new](https://vercel.com/new) → **Import** the `pade-devfest` GitHub repo (framework: Next.js, no other settings needed).
2. Add the env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`, `NEXT_PUBLIC_APP_URL`).
3. Click **Deploy**. Open `https://<your-app>.vercel.app/live` on the projector.

Or use the CLI: `npx vercel --prod`, after adding the same env vars with `npx vercel env add`.

## Load test
```bash
BASE=http://localhost:3000 npm run loadtest            # local
BASE=https://<your-app>.vercel.app npm run loadtest    # deployed
SAME_IP=1 npm run loadtest                             # everyone behind one venue IP
```
This fires about 200 concurrent requests at each step: signups, matches, an immediate re-match (expects 429), a re-match after 3s, met lists, "found" and stats. Then it sends junk input. It fails if it sees any 5xx or network error. See [LOADTEST.md](LOADTEST.md) for the latest results.

## How it holds up on bad venue wifi
- **No realtime sockets.** `/live` polls `/api/stats` every 5s. That endpoint sends `s-maxage=5, stale-while-revalidate=30`, so every viewer shares one database hit per 5s, with a per-instance memory cache and in-flight de-duplication behind it. The match screen polls its small met list every 10–14s, and only while the tab is visible.
- **Rate limits:** 1 match per 3s per profile, enforced in memory and again against the latest match time in the DB, so it holds across serverless instances. Signups are limited to 120 per 10s per IP: generous on purpose, since a whole venue may share one IP. On a 429 the client waits and retries quietly.
- **Validation:** fixed option lists checked on the server, 2 KB body cap, names cleaned (tags, control and invisible characters, URLs removed, max 24 chars). A word filter swaps abusive names for "Mystery Guest" without flagging real names like *Fagbemi* or *Dickson*.
- **Matching:** pulls the latest 300 candidates, then scores each one: +2 per shared interest, +3 for complementary goals (cofounder↔cofounder, hire↔get hired, mentor↔mentee, …), +1 for the same jollof pick, +1.5 for real people, plus a little random jitter. It skips yourself and anyone you've already matched with. If two requests race for the same pair, the unique constraint catches it and the next-best person is picked.
- **AI safety net:** OpenAI gets only first names and interest labels, with an 80-token cap and a 6s timeout. Any failure falls back to a template.
- **Client:** the profile id and current match are kept in `localStorage`, so a refresh doesn't lose anything. The UI shows loading skeletons, updates "Found" optimistically and rolls back if the server says no, and shows friendly errors with Retry. The default font is the only blocking download, and API payloads are a few hundred bytes.

## Project layout
```
app/                 pages, API routes (app/api/*), icon.svg, opengraph-image.tsx
components/          PadeApp, Onboarding, MatchScreen, LiveCounters, Logo
lib/                 constants, validation, matching, icebreakers, rate limit, db/ (supabase + memory)
supabase/schema.sql  paste into the Supabase SQL editor
scripts/             seed.mjs, demo-profiles.json, loadtest.mjs
public/logo.svg      wordmark
```
