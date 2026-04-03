-- study_rooms
create table public.study_rooms (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  host_id uuid not null references public.profiles(id) on delete cascade,
  host_name text not null,
  partner_id uuid references public.profiles(id) on delete cascade,
  partner_name text,
  status text not null default 'waiting' check (status in ('waiting', 'active', 'ended')),
  created_at timestamptz not null default now()
);

alter table public.study_rooms enable row level security;

-- Anyone authenticated can see all rooms (needed for lobby listing)
create policy "authenticated users can view rooms"
  on public.study_rooms for select
  to authenticated
  using (true);

-- Only the host can create a room for themselves
create policy "users can create own rooms"
  on public.study_rooms for insert
  to authenticated
  with check (auth.uid() = host_id);

-- Host can always update; partner can update; anyone can join a waiting room
create policy "participants can update rooms"
  on public.study_rooms for update
  to authenticated
  using (
    auth.uid() = host_id
    or auth.uid() = partner_id
    or (status = 'waiting' and partner_id is null and auth.uid() != host_id)
  );

-- Host can delete their own room
create policy "host can delete room"
  on public.study_rooms for delete
  to authenticated
  using (auth.uid() = host_id);

-- Enable realtime on this table
alter publication supabase_realtime add table public.study_rooms;
