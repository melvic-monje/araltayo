-- Spacebar Race schema
-- Run this in the Supabase SQL editor.

create table if not exists public.rooms (
  code text primary key,
  host_id uuid not null,
  status text not null default 'lobby' check (status in ('lobby','racing','finished')),
  race_starts_at timestamptz,
  race_ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  room_code text not null references public.rooms(code) on delete cascade,
  name text not null,
  press_count int not null default 0 check (press_count >= 0 and press_count <= 600),
  joined_at timestamptz not null default now()
);

create index if not exists players_room_code_idx on public.players(room_code);

-- Realtime
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.players;

-- Permissive RLS — anyone with the anon key can read/write rooms+players.
-- This is fine for a casual party game; tighten if you reuse the project.
alter table public.rooms enable row level security;
alter table public.players enable row level security;

drop policy if exists "rooms_anon_all" on public.rooms;
create policy "rooms_anon_all" on public.rooms for all to anon using (true) with check (true);

drop policy if exists "players_anon_all" on public.players;
create policy "players_anon_all" on public.players for all to anon using (true) with check (true);
