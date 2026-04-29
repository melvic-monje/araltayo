# Spacebar Race

Real-time multiplayer party game. Host shares the leaderboard on Zoom; everyone joins from their own device with a 4-character room code and mashes spacebar for 15 seconds.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- Supabase (Postgres + Realtime)
- `canvas-confetti` for the winner moment
- Web Audio API for countdown beeps + winner fanfare (no audio files)

## Setup

```bash
npm install
```

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Open the SQL editor and run [`supabase/schema.sql`](./supabase/schema.sql)
3. Copy `.env.local.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. `npm run dev` → http://localhost:3000

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Import the repo in Vercel
3. Add the same two env vars in **Project Settings → Environment Variables**
4. Deploy

## How it works

- **Spacebar batching**: keypresses update local React state instantly; a 200 ms `setInterval` flushes the latest count to Supabase. Other clients animate the progress bar smoothly between values.
- **Synchronized countdown**: the host writes `race_starts_at = now() + 4s` and `race_ends_at = race_starts_at + 15s`. Every client runs its own ticker against `Date.now()`, so there's no per-client drift even if someone joins mid-countdown.
- **Player identity**: a UUID is generated on first load and stored in `localStorage` so refreshes don't kick the player out. Whoever creates the room is the host.
- **Anti-cheat**: a `CHECK (press_count <= 600)` constraint at the database layer caps any single-player count at 40 presses/sec × 15 s. RLS is open for the anon key — fine for casual play, tighten if you reuse the project.
