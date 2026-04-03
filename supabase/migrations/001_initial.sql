-- Enable UUID extension
create extension if not exists "pgcrypto";

-- profiles
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  birth_year int not null,
  is_minor boolean not null default false,
  is_active boolean not null default false,
  parent_email text,
  parent_consented_at timestamptz,
  consent_token text unique,
  role text not null default 'student' check (role in ('student', 'teacher', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- quizzes
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  source_notes text not null,
  questions jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table public.quizzes enable row level security;

create policy "Users can manage own quizzes"
  on public.quizzes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- reviewers
create table public.reviewers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  source_notes text not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.reviewers enable row level security;

create policy "Users can manage own reviewers"
  on public.reviewers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- flashcard_sets
create table public.flashcard_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  cards jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table public.flashcard_sets enable row level security;

create policy "Users can manage own flashcard sets"
  on public.flashcard_sets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ai_usage
create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tool text not null check (tool in ('quiz', 'reviewer', 'flashcards', 'explain')),
  tokens_used int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.ai_usage enable row level security;

create policy "Users can view own AI usage"
  on public.ai_usage for select
  using (auth.uid() = user_id);

create policy "Users can insert own AI usage"
  on public.ai_usage for insert
  with check (auth.uid() = user_id);

-- Function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Profile is created explicitly during signup, not here.
  -- This function exists as a hook placeholder.
  return new;
end;
$$;
