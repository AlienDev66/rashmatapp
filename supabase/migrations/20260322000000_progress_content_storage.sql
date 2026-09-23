-- Profiles extras, Storage buckets, richer catalog sessions, enroll helper

alter table public.profiles
  add column if not exists kcal_goal integer not null default 2000;

alter table public.profiles
  add column if not exists notification_prefs jsonb not null default '{
    "workout_reminders": true,
    "creator_updates": true,
    "marketing": false
  }'::jsonb;

-- ---------------------------------------------------------------------------
-- Storage: public covers + avatars
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('covers', 'covers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Public read
drop policy if exists "covers_public_read" on storage.objects;
create policy "covers_public_read" on storage.objects
  for select using (bucket_id = 'covers');

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

-- Authenticated users can upload/update own avatar path: {user_id}/*
drop policy if exists "avatars_own_write" on storage.objects;
create policy "avatars_own_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_own_update" on storage.objects;
create policy "avatars_own_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_own_delete" on storage.objects;
create policy "avatars_own_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Service / authenticated can manage covers (seed via dashboard or service role)
drop policy if exists "covers_auth_write" on storage.objects;
create policy "covers_auth_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'covers');

-- ---------------------------------------------------------------------------
-- Enroll in a program
-- ---------------------------------------------------------------------------
create or replace function public.enroll_program(p_program_id text)
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

  insert into public.user_program_enrollments (user_id, program_id)
  values (uid, p_program_id)
  on conflict (user_id, program_id) do update
    set enrolled_at = public.user_program_enrollments.enrolled_at
  returning * into row;

  return row;
end;
$$;

grant execute on function public.enroll_program(text) to authenticated;

-- Improve complete_session: bump enrollment progress
create or replace function public.complete_session(
  p_session_id text,
  p_xp integer default 120,
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
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into sess from public.workout_sessions where id = p_session_id;
  if sess.id is null then
    raise exception 'Session not found';
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

  -- Ensure enrolled + update progress
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

  return row;
end;
$$;

-- ---------------------------------------------------------------------------
-- Extra sessions per program (+ mux sample playback)
-- ---------------------------------------------------------------------------
insert into public.workout_sessions (id, program_id, title, description, cover_url, tags, sets, day, minutes, mux_playback_id, video_url) values
(
  'day-2-guard', 'guard', 'PASSING PRESSURE',
  'Chain passes and keep heavy top pressure through the middle.',
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&q=80',
  array['Passing','Pressure'], 20, 2, 55,
  '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
),
(
  'day-3-guard', 'guard', 'GUARD RETENTION',
  'Frames, hip escapes, and recovering closed / open guard under fire.',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80',
  array['Guard','Defense'], 18, 3, 50,
  '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
),
(
  'day-1-blue', 'blue-belt', 'FUNDAMENTALS DAY 1',
  'Positional hierarchy and basic submissions for blue belt pace.',
  'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1200&q=80',
  array['Fundamentals','Gi'], 22, 1, 60,
  '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
),
(
  'day-2-blue', 'blue-belt', 'FUNDAMENTALS DAY 2',
  'Side control escapes and mount retention drills.',
  'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=1200&q=80',
  array['Escapes','Mount'], 22, 2, 60,
  '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
),
(
  'day-1-adcc', 'adcc', 'NO-GI INTENSITY',
  'Wrestling entries and no-gi submission chains for competition pace.',
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&q=80',
  array['No-Gi','Competition'], 28, 1, 75,
  '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
)
on conflict (id) do update set
  mux_playback_id = excluded.mux_playback_id,
  cover_url = excluded.cover_url,
  title = excluded.title;

-- Keep day-1-guard mux id in sync
update public.workout_sessions
set mux_playback_id = coalesce(mux_playback_id, '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA')
where id = 'day-1-guard';

insert into public.exercises (id, session_id, name, thumbnail_url, reps, sort_order, mux_playback_id, video_url) values
('e5', 'day-2-guard', 'Knee Cut Drill', 'https://images.unsplash.com/photo-1517963879433-6ad2b056d372?w=800&q=80', 'Reps: 8 8 8', 0, '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA', null),
('e6', 'day-2-guard', 'Smash Pass', 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&q=80', 'Reps: 6 6 6', 1, '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA', null),
('e7', 'day-2-guard', 'Shoulder Pressure', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80', 'Reps: 10 10', 2, '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA', null),
('e8', 'day-3-guard', 'Hip Escape', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80', 'Reps: 12 12 12', 0, '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA', null),
('e9', 'day-3-guard', 'Frame & Recover', 'https://images.unsplash.com/photo-1583454110551-21c2be3449f7?w=800&q=80', 'Reps: 8 8 8', 1, '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA', null),
('e10', 'day-1-blue', 'Closed Guard Break', 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&q=80', 'Reps: 8 8 8', 0, '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA', null),
('e11', 'day-1-blue', 'Armbar from Mount', 'https://images.unsplash.com/photo-1517963879433-6ad2b056d372?w=800&q=80', 'Reps: 6 6 6', 1, '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA', null),
('e12', 'day-2-blue', 'Elbow Escape', 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&q=80', 'Reps: 10 10', 0, '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA', null),
('e13', 'day-2-blue', 'Trap & Roll', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80', 'Reps: 8 8 8', 1, '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA', null),
('e14', 'day-1-adcc', 'Single Leg Entry', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80', 'Reps: 8 8 8', 0, '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA', null),
('e15', 'day-1-adcc', 'Body Lock Pass', 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&q=80', 'Reps: 6 6 6', 1, '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA', null)
on conflict (id) do nothing;

-- Point program covers at stable CDN images (upload your own to Storage bucket "covers" later)
update public.programs set cover_url = 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1200&q=80' where id = 'blue-belt';
update public.programs set cover_url = 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&q=80' where id = 'adcc';
update public.programs set cover_url = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80' where id = 'guard';
