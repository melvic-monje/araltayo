-- Profile builder fields
alter table public.profiles
  add column gender text check (gender in ('male', 'female', 'prefer_not_to_say')),
  add column school text,
  add column show_school boolean not null default false,
  add column grade_level text,
  add column bio text not null default '',
  add column avatar text not null default 'default';

-- Gender on study rooms for filtering + room capacity
alter table public.study_rooms
  add column host_gender text,
  add column max_members int not null default 2,
  add column members jsonb not null default '[]'::jsonb;
