-- Workout hardening: progress, set logs, day order, premium, rest, richer content

-- ---------------------------------------------------------------------------
-- Schema additions
-- ---------------------------------------------------------------------------
alter table public.programs
  add column if not exists is_premium boolean not null default false;

alter table public.exercises
  add column if not exists rest_seconds integer not null default 60;

alter table public.user_program_enrollments
  add column if not exists day_order text[] not null default '{}';

create table if not exists public.session_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id text not null references public.workout_sessions (id) on delete cascade,
  exercise_index integer not null default 0,
  set_index integer not null default 0,
  elapsed_seconds integer not null default 0,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'abandoned')),
  updated_at timestamptz not null default now(),
  primary key (user_id, session_id)
);

create table if not exists public.set_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id text not null references public.workout_sessions (id) on delete cascade,
  exercise_id text not null references public.exercises (id) on delete cascade,
  set_number integer not null,
  reps_logged integer not null,
  created_at timestamptz not null default now()
);

create index if not exists set_logs_user_exercise_idx
  on public.set_logs (user_id, exercise_id, created_at desc);

create index if not exists session_completions_user_completed_idx
  on public.session_completions (user_id, completed_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.session_progress enable row level security;
alter table public.set_logs enable row level security;

drop policy if exists "session_progress_own" on public.session_progress;
create policy "session_progress_own" on public.session_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "set_logs_own" on public.set_logs;
create policy "set_logs_own" on public.set_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.session_progress to authenticated;
grant select, insert, update, delete on public.set_logs to authenticated;

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------
create or replace function public.save_session_progress(
  p_session_id text,
  p_exercise_index integer,
  p_set_index integer,
  p_elapsed integer,
  p_status text default 'in_progress'
)
returns public.session_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  row public.session_progress;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.session_progress as sp
    (user_id, session_id, exercise_index, set_index, elapsed_seconds, status, updated_at)
  values
    (uid, p_session_id, greatest(p_exercise_index, 0), greatest(p_set_index, 0),
     greatest(coalesce(p_elapsed, 0), 0), coalesce(p_status, 'in_progress'), now())
  on conflict (user_id, session_id) do update
    set exercise_index = excluded.exercise_index,
        set_index = excluded.set_index,
        elapsed_seconds = excluded.elapsed_seconds,
        status = excluded.status,
        updated_at = now()
  returning * into row;

  return row;
end;
$$;

create or replace function public.log_set_rep(
  p_session_id text,
  p_exercise_id text,
  p_set_number integer,
  p_reps integer
)
returns public.set_logs
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  row public.set_logs;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.set_logs (user_id, session_id, exercise_id, set_number, reps_logged)
  values (uid, p_session_id, p_exercise_id, p_set_number, greatest(p_reps, 0))
  returning * into row;

  return row;
end;
$$;

create or replace function public.save_program_day_order(
  p_program_id text,
  p_session_ids text[]
)
returns public.user_program_enrollments
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  row public.user_program_enrollments;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.user_program_enrollments (user_id, program_id, day_order)
  values (uid, p_program_id, coalesce(p_session_ids, '{}'))
  on conflict (user_id, program_id) do update
    set day_order = excluded.day_order
  returning * into row;

  return row;
end;
$$;

-- XP is computed server-side; first completion only awards XP
create or replace function public.complete_session(
  p_session_id text,
  p_xp integer default null,
  p_duration integer default null
)
returns public.session_completions
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  row public.session_completions;
  sess public.workout_sessions;
  total_days integer;
  done_days integer;
  set_count integer;
  computed_xp integer;
  already boolean;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into sess from public.workout_sessions where id = p_session_id;
  if sess.id is null then
    raise exception 'Session not found';
  end if;

  select exists(
    select 1 from public.session_completions
    where user_id = uid and session_id = p_session_id
  ) into already;

  select count(*)::integer into set_count
  from public.set_logs
  where user_id = uid and session_id = p_session_id;

  computed_xp := coalesce(
    nullif(p_xp, 0),
    least(300, 40 + (set_count * 8) + least(60, coalesce(p_duration, 0) / 60))
  );

  insert into public.session_completions (user_id, session_id, xp_earned, duration_seconds)
  values (uid, p_session_id, computed_xp, p_duration)
  on conflict (user_id, session_id) do update
    set completed_at = now(),
        duration_seconds = coalesce(excluded.duration_seconds, public.session_completions.duration_seconds),
        xp_earned = public.session_completions.xp_earned
  returning * into row;

  if not already then
    insert into public.xp_events (user_id, amount, reason, meta)
    values (uid, computed_xp, 'session_complete', jsonb_build_object('session_id', p_session_id));

    update public.profiles
    set xp = xp + computed_xp
    where id = uid;
  end if;

  insert into public.user_program_enrollments (user_id, program_id, current_day)
  values (uid, sess.program_id, greatest(sess.day, 1))
  on conflict (user_id, program_id) do update
    set current_day = greatest(public.user_program_enrollments.current_day, sess.day);

  select count(*)::integer into total_days
  from public.workout_sessions where program_id = sess.program_id;

  select count(distinct sc.session_id)::integer into done_days
  from public.session_completions sc
  join public.workout_sessions ws on ws.id = sc.session_id
  where sc.user_id = uid and ws.program_id = sess.program_id;

  update public.user_program_enrollments
  set progress_pct = case
        when total_days > 0 then least(100, round((done_days::numeric / total_days) * 100)::integer)
        else 0
      end
  where user_id = uid and program_id = sess.program_id;

  update public.session_progress
  set status = 'completed', updated_at = now()
  where user_id = uid and session_id = p_session_id;

  return row;
end;
$$;

grant execute on function public.save_session_progress(text, integer, integer, integer, text) to authenticated;
grant execute on function public.log_set_rep(text, text, integer, integer) to authenticated;
grant execute on function public.save_program_day_order(text, text[]) to authenticated;
grant execute on function public.complete_session(text, integer, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Premium flags + rest defaults + mux coverage + richer exercises
-- ---------------------------------------------------------------------------
update public.programs set is_premium = false where id = 'guard';
update public.programs set is_premium = true where id in ('blue-belt', 'adcc');

update public.exercises set rest_seconds = 45 where rest_seconds is null or rest_seconds = 60;
update public.exercises set rest_seconds = 60 where id in ('e1', 'e4', 'e10', 'e14');
update public.exercises set rest_seconds = 90 where id in ('e3', 'e15');

update public.workout_sessions
set mux_playback_id = coalesce(nullif(mux_playback_id, ''), '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA')
where mux_playback_id is null or mux_playback_id = '';

update public.exercises
set mux_playback_id = coalesce(nullif(mux_playback_id, ''), '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA')
where mux_playback_id is null or mux_playback_id = '';

-- Extra exercises for thinner sessions
insert into public.exercises (id, session_id, name, thumbnail_url, reps, sort_order, mux_playback_id, video_url, rest_seconds) values
('e16', 'day-2-guard', 'Torreando Pass', 'https://images.unsplash.com/photo-1583454110551-21c2be3449f7?w=800&q=80', 'Reps: 8 8 8', 3, '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA', null, 60),
('e17', 'day-3-guard', 'Knee Shield Retention', 'https://images.unsplash.com/photo-1517963879433-6ad2b056d372?w=800&q=80', 'Reps: 10 10 10', 2, '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA', null, 45),
('e18', 'day-3-guard', 'Granby Roll', 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&q=80', 'Reps: 6 6 6', 3, '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA', null, 60),
('e19', 'day-1-blue', 'Hip Escape Series', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80', 'Reps: 8 8 8 8', 2, '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA', null, 45),
('e20', 'day-1-blue', 'Mount Control', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80', 'Reps: 6 6 6', 3, '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA', null, 60),
('e21', 'day-2-blue', 'Technical Mount', 'https://images.unsplash.com/photo-1517963879433-6ad2b056d372?w=800&q=80', 'Reps: 8 8 8', 2, '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA', null, 60),
('e22', 'day-2-blue', 'Americana Drill', 'https://images.unsplash.com/photo-1583454110551-21c2be3449f7?w=800&q=80', 'Reps: 6 6 6', 3, '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA', null, 45),
('e23', 'day-1-adcc', 'Front Headlock Snap', 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&q=80', 'Reps: 8 8 8', 2, '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA', null, 60),
('e24', 'day-1-adcc', 'Back Take Chain', 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&q=80', 'Reps: 6 6 6 6', 3, '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA', null, 90),
('e25', 'day-1-guard', 'Shin Slice Pass', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80', 'Reps: 8 8 8', 4, '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA', null, 60),
('e26', 'day-1-guard', 'Knee Cut Finish', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80', 'Reps: 6 6 6', 5, '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA', null, 45)
on conflict (id) do update set
  rest_seconds = excluded.rest_seconds,
  mux_playback_id = excluded.mux_playback_id,
  reps = excluded.reps;
