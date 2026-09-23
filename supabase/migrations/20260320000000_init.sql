-- Planfity initial schema: profiles, catalog, assessment, progress, XP
-- Run via Supabase SQL editor or `supabase db push`

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  city text,
  country text,
  membership text not null default 'Basic member',
  xp integer not null default 0,
  age integer,
  weight_kg numeric(5,1),
  height_cm numeric(5,1),
  assessment_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create table if not exists public.creators (
  id text primary key,
  name text not null,
  role text,
  bio text,
  avatar_url text,
  cover_url text,
  verified boolean not null default false,
  socials jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.programs (
  id text primary key,
  creator_id text not null references public.creators (id) on delete cascade,
  title text not null,
  description text,
  cover_url text,
  weeks integer not null default 4,
  days_per_week integer not null default 3,
  minutes integer not null default 60,
  level text not null check (level in ('Beginner', 'Intermediate', 'Advanced')),
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.workout_sessions (
  id text primary key,
  program_id text not null references public.programs (id) on delete cascade,
  title text not null,
  description text,
  cover_url text,
  tags text[] not null default '{}',
  sets integer not null default 1,
  day integer not null default 1,
  minutes integer not null default 45,
  -- Mux: store playback id; app builds https://stream.mux.com/{id}.m3u8
  mux_playback_id text,
  video_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.exercises (
  id text primary key,
  session_id text not null references public.workout_sessions (id) on delete cascade,
  name text not null,
  thumbnail_url text,
  reps text,
  sort_order integer not null default 0,
  mux_playback_id text,
  video_url text
);

-- ---------------------------------------------------------------------------
-- Assessment answers (JSON blob per user)
-- ---------------------------------------------------------------------------
create table if not exists public.assessment_responses (
  user_id uuid primary key references auth.users (id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  current_step integer not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Progress / XP
-- ---------------------------------------------------------------------------
create table if not exists public.user_program_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  program_id text not null references public.programs (id) on delete cascade,
  current_day integer not null default 1,
  progress_pct integer not null default 0,
  enrolled_at timestamptz not null default now(),
  unique (user_id, program_id)
);

create table if not exists public.session_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id text not null references public.workout_sessions (id) on delete cascade,
  xp_earned integer not null default 0,
  duration_seconds integer,
  completed_at timestamptz not null default now(),
  unique (user_id, session_id)
);

create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null,
  reason text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Auto profile on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists assessment_updated_at on public.assessment_responses;
create trigger assessment_updated_at
  before update on public.assessment_responses
  for each row execute function public.touch_updated_at();

-- Award XP helper (callable from client with RLS via security definer)
create or replace function public.complete_session(p_session_id text, p_xp integer default 120, p_duration integer default null)
returns public.session_completions
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  row public.session_completions;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.session_completions (user_id, session_id, xp_earned, duration_seconds)
  values (uid, p_session_id, p_xp, p_duration)
  on conflict (user_id, session_id) do update
    set completed_at = now(),
        xp_earned = excluded.xp_earned,
        duration_seconds = coalesce(excluded.duration_seconds, public.session_completions.duration_seconds)
  returning * into row;

  insert into public.xp_events (user_id, amount, reason, meta)
  values (uid, p_xp, 'session_complete', jsonb_build_object('session_id', p_session_id));

  update public.profiles
  set xp = xp + p_xp
  where id = uid;

  return row;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.creators enable row level security;
alter table public.programs enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.exercises enable row level security;
alter table public.assessment_responses enable row level security;
alter table public.user_program_enrollments enable row level security;
alter table public.session_completions enable row level security;
alter table public.xp_events enable row level security;

-- Profiles: own row
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- Catalog: public read (authenticated)
create policy "creators_read" on public.creators for select to authenticated using (true);
create policy "programs_read" on public.programs for select to authenticated using (true);
create policy "sessions_read" on public.workout_sessions for select to authenticated using (true);
create policy "exercises_read" on public.exercises for select to authenticated using (true);

-- Also allow anon read of catalog for marketing/browse before login (optional)
create policy "creators_read_anon" on public.creators for select to anon using (true);
create policy "programs_read_anon" on public.programs for select to anon using (true);
create policy "sessions_read_anon" on public.workout_sessions for select to anon using (true);
create policy "exercises_read_anon" on public.exercises for select to anon using (true);

-- Assessment: own
create policy "assessment_all_own" on public.assessment_responses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Enrollments / completions / xp: own
create policy "enrollments_all_own" on public.user_program_enrollments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "completions_select_own" on public.session_completions
  for select using (auth.uid() = user_id);
create policy "xp_select_own" on public.xp_events
  for select using (auth.uid() = user_id);

grant usage on schema public to anon, authenticated;
grant select on public.creators, public.programs, public.workout_sessions, public.exercises to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.assessment_responses to authenticated;
grant select, insert, update, delete on public.user_program_enrollments to authenticated;
grant select on public.session_completions, public.xp_events to authenticated;
grant execute on function public.complete_session(text, integer, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Seed (matches current mock IDs)
-- ---------------------------------------------------------------------------
insert into public.creators (id, name, role, bio, avatar_url, cover_url, verified, socials) values
(
  'mica',
  'MICA GALVÃO',
  'Certified Trainer',
  'Increase your work capacity and conditioning to help prepare your body for later phases of training.',
  'https://images.unsplash.com/photo-1599058945522-28d272b47b3e?w=1200&q=80',
  'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1200&q=80',
  true,
  '{"instagram":"#","tiktok":"#","x":"#"}'::jsonb
),
(
  'domingos',
  'DOMINGOS CAPITANGO',
  'BJJ Instructor – Black Belt',
  'Increase your work capacity and conditioning to help prepare your body for later phases of training.',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
  'https://images.unsplash.com/photo-1599058945522-28d272b47b3e?w=1200&q=80',
  true,
  '{"instagram":"#","tiktok":"#","x":"#"}'::jsonb
)
on conflict (id) do nothing;

insert into public.programs (id, creator_id, title, description, cover_url, weeks, days_per_week, minutes, level, tags) values
(
  'blue-belt', 'mica', '4 WEEKS TO BLUE BELT',
  'The best way to go to blue belt, with the best practices. Learn with the best masters in planfity.',
  'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1200&q=80',
  4, 3, 60, 'Advanced', array['Agility','Muscle build']
),
(
  'adcc', 'mica', 'ADCC COMPETITION',
  'Competition prep for ADCC-style no-gi intensity and strategy.',
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&q=80',
  6, 4, 75, 'Advanced', array['Competition','No-Gi']
),
(
  'guard', 'mica', 'DRILL + GUARD PASS',
  'Increase your work capacity and conditioning to help prepare your body for later phases of training.',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80',
  4, 3, 60, 'Intermediate', array['Agility','Muscle build']
)
on conflict (id) do nothing;

insert into public.workout_sessions (id, program_id, title, description, cover_url, tags, sets, day, minutes, video_url) values
(
  'day-1-guard', 'guard', 'DRILL + GUARD PASS',
  'Increase your work capacity and conditioning to help prepare your body for later phases of training.',
  'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1200&q=80',
  array['Agility','Muscle build'], 25, 1, 60,
  -- Public sample MP4 (replace with Mux HLS in production)
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
)
on conflict (id) do nothing;

insert into public.exercises (id, session_id, name, thumbnail_url, reps, sort_order, video_url) values
('e1', 'day-1-guard', 'Bent Over Barbell Row', 'https://images.unsplash.com/photo-1517963879433-6ad2b056d372?w=800&q=80', 'Reps: 8 8 8 8', 0, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'),
('e2', 'day-1-guard', 'Burpees', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80', 'Reps: 10 10 10', 1, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'),
('e3', 'day-1-guard', 'Pullups', 'https://images.unsplash.com/photo-1583454110551-21c2be3449f7?w=800&q=80', 'Reps: 25', 2, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'),
('e4', 'day-1-guard', 'Guard Retention Drill', 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&q=80', 'Reps: 8 8 8', 3, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4')
on conflict (id) do nothing;
