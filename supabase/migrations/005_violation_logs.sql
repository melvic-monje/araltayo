-- Violation logs for message screening (stores hash only, never raw text)
create table public.violation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  room_id uuid not null references public.study_rooms(id),
  message_hash text not null,          -- SHA-256 of the raw message
  layer text not null,                  -- 'regex' or 'semantic'
  rule_matched text not null,           -- which rule triggered
  strike_number int not null default 1,
  action_taken text not null,           -- 'warn', 'strong_warn', 'ban_24h'
  created_at timestamptz not null default now()
);

-- Session strikes tracker (resets per room session)
create table public.session_strikes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  room_id uuid not null references public.study_rooms(id),
  strikes int not null default 0,
  banned_until timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id, room_id)
);

-- RLS
alter table public.violation_logs enable row level security;
alter table public.session_strikes enable row level security;

-- Only service role inserts; users can't read violation logs
create policy "Service role only" on public.violation_logs
  for all using (false);

create policy "Service role only" on public.session_strikes
  for all using (false);
