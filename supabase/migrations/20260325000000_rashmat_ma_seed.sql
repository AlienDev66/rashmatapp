-- RASHMAT: martial-arts seed refresh (upsert copy + richer sessions/drills)

update public.creators set
  role = 'BJJ Instructor – Black Belt',
  bio = 'Portugal-based black belt. Pressure passing, guard retention, and live drilling that transfers to the mats.',
  socials = '{"instagram":"https://www.instagram.com/rashmatapp/","tiktok":"https://tiktok.com/@rashmatapp","x":"https://x.com/rashmatapp"}'::jsonb
where id = 'domingos';

update public.creators set
  role = 'BJJ World Champion',
  bio = 'Competition-first systems: blue belt fundamentals through ADCC-style no-gi intensity.',
  socials = '{"instagram":"https://www.instagram.com/rashmatapp/","tiktok":"https://tiktok.com/@rashmatapp","x":"https://x.com/rashmatapp"}'::jsonb
where id = 'mica';

insert into public.creators (id, name, role, bio, avatar_url, cover_url, verified, socials) values
(
  'sofia',
  'SOFIA REIS',
  'Muay Thai Coach',
  'Clinch, kicks, and pad work for strikers who want structured camps—not random bag rounds.',
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
  'https://images.unsplash.com/photo-1583454110551-21c2be3449f7?w=800&q=80',
  true,
  '{"instagram":"https://www.instagram.com/rashmatapp/","tiktok":"https://tiktok.com/@rashmatapp"}'::jsonb
)
on conflict (id) do update set
  name = excluded.name,
  role = excluded.role,
  bio = excluded.bio,
  avatar_url = excluded.avatar_url,
  cover_url = excluded.cover_url,
  verified = excluded.verified,
  socials = excluded.socials;

update public.programs set
  title = '4 WEEKS TO BLUE BELT',
  description = 'Gi fundamentals: closed guard, mount escapes, and positional sparring with a clear weekly cadence.',
  level = 'Beginner',
  tags = array['BJJ','Gi','Fundamentals'],
  creator_id = 'mica'
where id = 'blue-belt';

update public.programs set
  title = 'ADCC COMPETITION PREP',
  description = 'No-gi chains, wrestling entries, and high-output rounds built for tournament week.',
  tags = array['Competition','No-Gi','ADCC'],
  creator_id = 'mica',
  is_premium = true
where id = 'adcc';

update public.programs set
  title = 'GUARD PASS PRESSURE',
  description = 'Knee-cut, smash pass, and retention counters. Drill → live → reflect.',
  tags = array['Guard','Passing','BJJ'],
  creator_id = 'domingos',
  weeks = 3,
  minutes = 45
where id = 'guard';

insert into public.programs (id, creator_id, title, description, cover_url, weeks, days_per_week, minutes, level, tags, is_premium, status)
values
(
  'nogi-pressure', 'domingos', 'NO-GI TOP CONTROL',
  'Body locks, north-south, and pin transitions for no-gi top game.',
  'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=1200&q=80',
  4, 3, 50, 'Intermediate', array['No-Gi','Control','Pins'], false, 'published'
),
(
  'clinch-camp', 'sofia', 'CLINCH & KICK CAMP',
  'Muay Thai clinch entries, knees, and teep timing over a 4-week camp.',
  'https://images.unsplash.com/photo-1583454110551-21c2be3449f7?w=800&q=80',
  4, 3, 55, 'Intermediate', array['Muay Thai','Clinch','Striking'], false, 'published'
)
on conflict (id) do update set
  creator_id = excluded.creator_id,
  title = excluded.title,
  description = excluded.description,
  cover_url = excluded.cover_url,
  weeks = excluded.weeks,
  days_per_week = excluded.days_per_week,
  minutes = excluded.minutes,
  level = excluded.level,
  tags = excluded.tags,
  is_premium = excluded.is_premium,
  status = excluded.status;

-- Refresh day-1-guard session + drills (martial arts)
update public.workout_sessions set
  program_id = 'guard',
  title = 'KNEE-CUT PRESSURE',
  description = 'Build the knee-cut with head pressure and hip connection.',
  tags = array['Passing','Pressure'],
  sets = 14,
  day = 1,
  minutes = 45
where id = 'day-1-guard';

delete from public.exercises where session_id = 'day-1-guard';
insert into public.exercises (id, session_id, name, thumbnail_url, reps, rest_seconds, sort_order, video_url) values
('e1', 'day-1-guard', 'Knee-cut setup from standing', 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&q=80', 'Reps: 8 8 8', 45, 0, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'),
('e2', 'day-1-guard', 'Head pressure + underhook', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80', 'Reps: 8 8 8', 45, 1, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'),
('e3', 'day-1-guard', 'Finish to mount / side', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80', 'Reps: 6 6 6', 50, 2, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'),
('e4', 'day-1-guard', 'Live — pass vs retain', 'https://images.unsplash.com/photo-1599058945522-28d272b47b3e?w=800&q=80', 'Rounds: 5 × 2 min', 60, 3, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4')
on conflict (id) do update set
  session_id = excluded.session_id,
  name = excluded.name,
  thumbnail_url = excluded.thumbnail_url,
  reps = excluded.reps,
  rest_seconds = excluded.rest_seconds,
  sort_order = excluded.sort_order,
  video_url = excluded.video_url;

-- Extra sessions for hub calendar (blue-belt + guard)
insert into public.workout_sessions (id, program_id, title, description, cover_url, tags, sets, day, minutes, video_url) values
('bb-d1', 'blue-belt', 'CLOSED GUARD BASICS', 'Break grips, hip escape, and recover closed guard under light pressure.', 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1200&q=80', array['Gi','Guard','Fundamentals'], 12, 1, 55, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'),
('bb-d2', 'blue-belt', 'MOUNT ESCAPES', 'Elbow-knee escape and frame under mount.', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&q=80', array['Gi','Escapes'], 10, 2, 50, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'),
('bb-d3', 'blue-belt', 'SIDE CONTROL FRAMES', 'Frames, shrimp, and recover half guard from side control.', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80', array['Gi','Frames'], 11, 4, 55, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'),
('bb-d4', 'blue-belt', 'PASSING INTRO', 'Toreando and knee-cut entries with focus on posture.', 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=1200&q=80', array['Gi','Passing'], 12, 5, 60, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'),
('gp-d2', 'guard', 'SMASH PASS DAY', 'Over-under and body lock smash entries.', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&q=80', array['Passing','Smash'], 12, 3, 45, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'),
('gp-d3', 'guard', 'RETENTION COUNTERS', 'When they recover — re-engage and clear frames.', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80', array['Retention','Passing'], 10, 5, 40, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4')
on conflict (id) do update set
  program_id = excluded.program_id,
  title = excluded.title,
  description = excluded.description,
  cover_url = excluded.cover_url,
  tags = excluded.tags,
  sets = excluded.sets,
  day = excluded.day,
  minutes = excluded.minutes,
  video_url = excluded.video_url;

insert into public.exercises (id, session_id, name, thumbnail_url, reps, rest_seconds, sort_order, video_url) values
('bb-d1-e1', 'bb-d1', 'Hip escape to closed guard', 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&q=80', 'Reps: 8 8 8', 45, 0, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'),
('bb-d1-e2', 'bb-d1', 'Collar grip break', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80', 'Reps: 10 10 10', 40, 1, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'),
('bb-d1-e3', 'bb-d1', 'Armbar from closed guard', 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&q=80', 'Reps: 6 6 6', 60, 2, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'),
('bb-d1-e4', 'bb-d1', 'Positional rounds — closed guard', 'https://images.unsplash.com/photo-1599058945522-28d272b47b3e?w=800&q=80', 'Rounds: 3 × 3 min', 90, 3, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'),
('bb-d2-e1', 'bb-d2', 'Elbow-knee escape', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80', 'Reps: 8 8 8', 50, 0, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'),
('bb-d2-e2', 'bb-d2', 'Trap and roll', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80', 'Reps: 6 6 6', 50, 1, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'),
('bb-d2-e3', 'bb-d2', 'Live — start in mount', 'https://images.unsplash.com/photo-1599058945522-28d272b47b3e?w=800&q=80', 'Rounds: 4 × 2 min', 60, 2, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'),
('gp-d2-e1', 'gp-d2', 'Over-under smash', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80', 'Reps: 8 8 8', 50, 0, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'),
('gp-d2-e2', 'gp-d2', 'Body lock pass', 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&q=80', 'Reps: 6 6 6', 55, 1, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'),
('gp-d2-e3', 'gp-d2', 'Positional rounds', 'https://images.unsplash.com/photo-1599058945522-28d272b47b3e?w=800&q=80', 'Rounds: 4 × 3 min', 75, 2, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4')
on conflict (id) do nothing;

-- Keep existing activate_creator(returns profiles) from prior migration.
-- Only refresh role labels on creator rows if any still say OpenMat.
update public.creators
set role = 'RASHMAT Creator'
where role ilike '%openmat%';
