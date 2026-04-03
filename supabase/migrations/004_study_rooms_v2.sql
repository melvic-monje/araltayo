-- Add subject, private room, shared notes support to study_rooms
alter table public.study_rooms
  add column subject text,
  add column is_private boolean not null default false,
  add column room_code text,
  add column shared_notes text not null default '';

-- Unique index on room_code (only for non-null values)
create unique index study_rooms_room_code_idx
  on public.study_rooms(room_code)
  where room_code is not null;
