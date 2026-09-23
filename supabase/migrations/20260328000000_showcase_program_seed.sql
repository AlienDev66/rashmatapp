-- Showcase program: full Guard Retention System with covers + public MP4s per drill.
-- Videos: Google public sample bucket (stable, free, CORS-friendly for mobile).

-- ---------------------------------------------------------------------------
-- Program + creator polish
-- ---------------------------------------------------------------------------
update public.creators set
  name = 'DOMINGOS',
  role = 'BJJ Black Belt · RASHMAT',
  bio = 'Pressure passing, guard retention, and live drilling that transfers to the mats.',
  avatar_url = 'https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=800&q=80',
  cover_url = 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1400&q=80',
  verified = true
where id = 'domingos';

insert into public.programs (
  id, creator_id, title, description, cover_url,
  weeks, days_per_week, minutes, level, tags, is_premium, status
) values (
  'retention-system',
  'domingos',
  'GUARD RETENTION SYSTEM',
  'A complete 4-week camp: frames, hip mobility, recovery pathways, and live rounds. Every drill has video — train end-to-end like a real mat session.',
  'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1400&q=80',
  4, 3, 50, 'Intermediate',
  array['BJJ','Guard','Retention','Gi'],
  false,
  'published'
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

-- Also refresh the classic guard program cover so the catalog looks premium
update public.programs set
  cover_url = 'https://images.unsplash.com/photo-1591117207239-788bf8de6c3b?w=1400&q=80',
  description = 'Knee-cut, smash pass, and retention counters. Drill → live → reflect.',
  status = 'published'
where id = 'guard';

-- ---------------------------------------------------------------------------
-- Helpers: public sample videos (rotate per drill)
-- ---------------------------------------------------------------------------
-- v1 ForBiggerEscapes
-- v2 ForBiggerBlazes
-- v3 ForBiggerJoyrides
-- v4 ForBiggerMeltdowns
-- v5 ForBiggerFun
-- v6 BigBuckBunny
-- v7 ElephantsDream
-- v8 Sintel

-- Wipe + reseed sessions/exercises for this showcase program
delete from public.exercises
where session_id in (
  select id from public.workout_sessions where program_id = 'retention-system'
);
delete from public.workout_sessions where program_id = 'retention-system';

insert into public.workout_sessions (
  id, program_id, title, description, cover_url, tags, sets, day, minutes, video_url
) values
-- Week 1
(
  'rs-w1d1', 'retention-system',
  'FRAMES UNDER PRESSURE',
  'Build elbow-knee frames and create space when someone is smashing your guard.',
  'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1400&q=80',
  array['Frames','Fundamentals'], 14, 1, 48,
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
),
(
  'rs-w1d2', 'retention-system',
  'HIP ESCAPE LADDER',
  'Shrimp patterns that recover closed, half, and open guard under controlled pressure.',
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1400&q=80',
  array['Hips','Escapes'], 13, 3, 50,
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
),
(
  'rs-w1d3', 'retention-system',
  'CLOSED GUARD RECOVERY',
  'From broken posture to closed guard — grips, angles, and retention under pace.',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1400&q=80',
  array['Closed Guard','Recovery'], 12, 5, 52,
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
),
-- Week 2
(
  'rs-w2d1', 'retention-system',
  'HALF GUARD RETENTION',
  'Underhooks, knee shield, and recovering when they flatten your half.',
  'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=1400&q=80',
  array['Half Guard','Shield'], 14, 8, 50,
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'
),
(
  'rs-w2d2', 'retention-system',
  'KNEE SHIELD TO SWEEP',
  'Connect retention frames to offensive sweeps so you are not only surviving.',
  'https://images.unsplash.com/photo-1599058945522-28d272b47b3e?w=1400&q=80',
  array['Sweeps','Half Guard'], 13, 10, 48,
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
),
(
  'rs-w2d3', 'retention-system',
  'LIVE — PASS VS RETAIN',
  'Positional rounds with clear win conditions. Film your frames, then reset.',
  'https://images.unsplash.com/photo-1591117207239-788bf8de6c3b?w=1400&q=80',
  array['Live','Rounds'], 10, 12, 55,
  'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
),
-- Week 3
(
  'rs-w3d1', 'retention-system',
  'OPEN GUARD DISTANCE',
  'Feet on hips, collar-sleeve control, and reclaiming space after a pass attempt.',
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1400&q=80',
  array['Open Guard','Distance'], 14, 15, 50,
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
),
(
  'rs-w3d2', 'retention-system',
  'DE LA RIVA ENTRIES',
  'Hook timing, off-balancing, and recovering when they clear your DLR.',
  'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1400&q=80',
  array['DLR','Hooks'], 13, 17, 52,
  'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
),
(
  'rs-w3d3', 'retention-system',
  'TORREANDO DEFENSE',
  'Hand fighting and hip heists when they try to toreando past your legs.',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1400&q=80',
  array['Passing Defense','Toreando'], 12, 19, 48,
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
),
-- Week 4
(
  'rs-w4d1', 'retention-system',
  'KNEE-CUT COUNTERS',
  'When the knee-cut is coming — frames, reverse half, and emergency recoveries.',
  'https://images.unsplash.com/photo-1583454110551-21c2be3449f7?w=1400&q=80',
  array['Knee Cut','Counters'], 14, 22, 50,
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
),
(
  'rs-w4d2', 'retention-system',
  'STACK PASS SURVIVAL',
  'Survive the stack, create air, and roll back to guard without panicking.',
  'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1400&q=80',
  array['Stack','Survival'], 13, 24, 50,
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
),
(
  'rs-w4d3', 'retention-system',
  'CAMP FINALE — LIVE RETENTION',
  'Cap the camp with long positional rounds. Retention under fatigue is the test.',
  'https://images.unsplash.com/photo-1623874514711-0f321325f318?w=1400&q=80',
  array['Live','Camp Finale'], 10, 26, 55,
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'
);

-- ---------------------------------------------------------------------------
-- Exercises — 4 drills per session, unique thumbs + public videos
-- ---------------------------------------------------------------------------
insert into public.exercises (
  id, session_id, name, thumbnail_url, reps, rest_seconds, sort_order, video_url
) values
-- rs-w1d1
('rs-w1d1-e1', 'rs-w1d1', 'Elbow-knee frame drill',
 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&q=80',
 'Reps: 8 8 8', 45, 0,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'),
('rs-w1d1-e2', 'rs-w1d1', 'Create space from smash',
 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
 'Reps: 8 8 8', 45, 1,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'),
('rs-w1d1-e3', 'rs-w1d1', 'Hip heist to knees',
 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
 'Reps: 6 6 6', 50, 2,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'),
('rs-w1d1-e4', 'rs-w1d1', 'Positional — retain vs smash',
 'https://images.unsplash.com/photo-1599058945522-28d272b47b3e?w=800&q=80',
 'Rounds: 4 × 2 min', 60, 3,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'),

-- rs-w1d2
('rs-w1d2-e1', 'rs-w1d2', 'Basic shrimp ladder',
 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&q=80',
 'Reps: 10 10 10', 40, 0,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'),
('rs-w1d2-e2', 'rs-w1d2', 'Shrimp to closed guard',
 'https://images.unsplash.com/photo-1591117207239-788bf8de6c3b?w=800&q=80',
 'Reps: 8 8 8', 45, 1,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'),
('rs-w1d2-e3', 'rs-w1d2', 'Technical stand-up from side',
 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
 'Reps: 6 6 6', 50, 2,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'),
('rs-w1d2-e4', 'rs-w1d2', 'Live — start in side control',
 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80',
 'Rounds: 4 × 2 min', 60, 3,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'),

-- rs-w1d3
('rs-w1d3-e1', 'rs-w1d3', 'Collar + sleeve grip reset',
 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
 'Reps: 8 8 8', 40, 0,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'),
('rs-w1d3-e2', 'rs-w1d3', 'Angle off to recover closed',
 'https://images.unsplash.com/photo-1583454110551-21c2be3449f7?w=800&q=80',
 'Reps: 8 8 8', 45, 1,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'),
('rs-w1d3-e3', 'rs-w1d3', 'Armbar threat → retain',
 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80',
 'Reps: 6 6 6', 55, 2,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'),
('rs-w1d3-e4', 'rs-w1d3', 'Positional — closed guard',
 'https://images.unsplash.com/photo-1623874514711-0f321325f318?w=800&q=80',
 'Rounds: 3 × 3 min', 75, 3,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'),

-- rs-w2d1
('rs-w2d1-e1', 'rs-w2d1', 'Knee shield posture',
 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&q=80',
 'Reps: 8 8 8', 45, 0,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'),
('rs-w2d1-e2', 'rs-w2d1', 'Underhook recovery',
 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
 'Reps: 8 8 8', 45, 1,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'),
('rs-w2d1-e3', 'rs-w2d1', 'Flattened half escape',
 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
 'Reps: 6 6 6', 50, 2,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'),
('rs-w2d1-e4', 'rs-w2d1', 'Live — half guard bottom',
 'https://images.unsplash.com/photo-1599058945522-28d272b47b3e?w=800&q=80',
 'Rounds: 4 × 2 min', 60, 3,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'),

-- rs-w2d2
('rs-w2d2-e1', 'rs-w2d2', 'Shield to old-school sweep',
 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&q=80',
 'Reps: 8 8 8', 50, 0,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'),
('rs-w2d2-e2', 'rs-w2d2', 'Waiter sweep entry',
 'https://images.unsplash.com/photo-1591117207239-788bf8de6c3b?w=800&q=80',
 'Reps: 6 6 6', 50, 1,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'),
('rs-w2d2-e3', 'rs-w2d2', 'Sweep fail → retain',
 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
 'Reps: 6 6 6', 55, 2,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'),
('rs-w2d2-e4', 'rs-w2d2', 'Positional — sweep or retain',
 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80',
 'Rounds: 4 × 2 min', 60, 3,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'),

-- rs-w2d3
('rs-w2d3-e1', 'rs-w2d3', 'Warm-up frame flow',
 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
 'Reps: 6 6 6', 40, 0,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'),
('rs-w2d3-e2', 'rs-w2d3', 'Round 1 — pass starts',
 'https://images.unsplash.com/photo-1583454110551-21c2be3449f7?w=800&q=80',
 'Rounds: 3 × 3 min', 90, 1,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'),
('rs-w2d3-e3', 'rs-w2d3', 'Round 2 — retain starts',
 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80',
 'Rounds: 3 × 3 min', 90, 2,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'),
('rs-w2d3-e4', 'rs-w2d3', 'Cool-down reflection',
 'https://images.unsplash.com/photo-1623874514711-0f321325f318?w=800&q=80',
 'Reps: 5 5 5', 30, 3,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'),

-- rs-w3d1
('rs-w3d1-e1', 'rs-w3d1', 'Feet on hips distance',
 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&q=80',
 'Reps: 8 8 8', 45, 0,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'),
('rs-w3d1-e2', 'rs-w3d1', 'Collar-sleeve circle',
 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
 'Reps: 8 8 8', 45, 1,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'),
('rs-w3d1-e3', 'rs-w3d1', 'Reclaim after pass attempt',
 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
 'Reps: 6 6 6', 50, 2,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'),
('rs-w3d1-e4', 'rs-w3d1', 'Live — open guard',
 'https://images.unsplash.com/photo-1599058945522-28d272b47b3e?w=800&q=80',
 'Rounds: 4 × 2 min', 60, 3,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'),

-- rs-w3d2
('rs-w3d2-e1', 'rs-w3d2', 'DLR hook timing',
 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&q=80',
 'Reps: 8 8 8', 45, 0,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'),
('rs-w3d2-e2', 'rs-w3d2', 'Off-balance to sweep',
 'https://images.unsplash.com/photo-1591117207239-788bf8de6c3b?w=800&q=80',
 'Reps: 6 6 6', 50, 1,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'),
('rs-w3d2-e3', 'rs-w3d2', 'Hook cleared → recover',
 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
 'Reps: 6 6 6', 55, 2,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'),
('rs-w3d2-e4', 'rs-w3d2', 'Positional — DLR',
 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80',
 'Rounds: 4 × 2 min', 60, 3,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'),

-- rs-w3d3
('rs-w3d3-e1', 'rs-w3d3', 'Hand fight vs toreando',
 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
 'Reps: 8 8 8', 40, 0,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'),
('rs-w3d3-e2', 'rs-w3d3', 'Hip heist under pass',
 'https://images.unsplash.com/photo-1583454110551-21c2be3449f7?w=800&q=80',
 'Reps: 8 8 8', 45, 1,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'),
('rs-w3d3-e3', 'rs-w3d3', 'Sit-up guard recovery',
 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80',
 'Reps: 6 6 6', 50, 2,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'),
('rs-w3d3-e4', 'rs-w3d3', 'Live — toreando pressure',
 'https://images.unsplash.com/photo-1623874514711-0f321325f318?w=800&q=80',
 'Rounds: 4 × 2 min', 60, 3,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'),

-- rs-w4d1
('rs-w4d1-e1', 'rs-w4d1', 'Frame the knee-cut early',
 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&q=80',
 'Reps: 8 8 8', 45, 0,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'),
('rs-w4d1-e2', 'rs-w4d1', 'Reverse half entry',
 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
 'Reps: 6 6 6', 50, 1,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'),
('rs-w4d1-e3', 'rs-w4d1', 'Emergency shrimp out',
 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
 'Reps: 8 8 8', 45, 2,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'),
('rs-w4d1-e4', 'rs-w4d1', 'Live — knee-cut starts',
 'https://images.unsplash.com/photo-1599058945522-28d272b47b3e?w=800&q=80',
 'Rounds: 4 × 2 min', 60, 3,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'),

-- rs-w4d2
('rs-w4d2-e1', 'rs-w4d2', 'Survive the stack posture',
 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&q=80',
 'Reps: 8 8 8', 45, 0,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'),
('rs-w4d2-e2', 'rs-w4d2', 'Create air + roll',
 'https://images.unsplash.com/photo-1591117207239-788bf8de6c3b?w=800&q=80',
 'Reps: 6 6 6', 50, 1,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'),
('rs-w4d2-e3', 'rs-w4d2', 'Back to open guard',
 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
 'Reps: 6 6 6', 55, 2,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'),
('rs-w4d2-e4', 'rs-w4d2', 'Live — stack pressure',
 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80',
 'Rounds: 4 × 2 min', 60, 3,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'),

-- rs-w4d3
('rs-w4d3-e1', 'rs-w4d3', 'Camp warm-up flow',
 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
 'Reps: 6 6 6', 35, 0,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'),
('rs-w4d3-e2', 'rs-w4d3', 'Long round — retain',
 'https://images.unsplash.com/photo-1583454110551-21c2be3449f7?w=800&q=80',
 'Rounds: 2 × 5 min', 120, 1,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'),
('rs-w4d3-e3', 'rs-w4d3', 'Long round — pass starts',
 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80',
 'Rounds: 2 × 5 min', 120, 2,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'),
('rs-w4d3-e4', 'rs-w4d3', 'Finale cool-down',
 'https://images.unsplash.com/photo-1623874514711-0f321325f318?w=800&q=80',
 'Reps: 5 5 5', 30, 3,
 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4')
on conflict (id) do update set
  session_id = excluded.session_id,
  name = excluded.name,
  thumbnail_url = excluded.thumbnail_url,
  reps = excluded.reps,
  rest_seconds = excluded.rest_seconds,
  sort_order = excluded.sort_order,
  video_url = excluded.video_url;

-- Backfill remaining incomplete sessions from older seeds so nothing feels empty
insert into public.exercises (id, session_id, name, thumbnail_url, reps, rest_seconds, sort_order, video_url) values
('bb-d3-e1', 'bb-d3', 'Frame under side control', 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&q=80', 'Reps: 8 8 8', 45, 0, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'),
('bb-d3-e2', 'bb-d3', 'Shrimp to half guard', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80', 'Reps: 8 8 8', 45, 1, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'),
('bb-d3-e3', 'bb-d3', 'Recover closed guard', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80', 'Reps: 6 6 6', 50, 2, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'),
('bb-d3-e4', 'bb-d3', 'Live — side control bottom', 'https://images.unsplash.com/photo-1599058945522-28d272b47b3e?w=800&q=80', 'Rounds: 3 × 3 min', 75, 3, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'),
('bb-d4-e1', 'bb-d4', 'Toreando entry', 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&q=80', 'Reps: 8 8 8', 45, 0, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'),
('bb-d4-e2', 'bb-d4', 'Knee-cut posture', 'https://images.unsplash.com/photo-1591117207239-788bf8de6c3b?w=800&q=80', 'Reps: 8 8 8', 45, 1, 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'),
('bb-d4-e3', 'bb-d4', 'Pass finish to side', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80', 'Reps: 6 6 6', 50, 2, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'),
('bb-d4-e4', 'bb-d4', 'Positional — pass vs retain', 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80', 'Rounds: 4 × 2 min', 60, 3, 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'),
('gp-d3-e1', 'gp-d3', 'Clear frames after recovery', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80', 'Reps: 8 8 8', 45, 0, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'),
('gp-d3-e2', 'gp-d3', 'Re-engage knee-cut', 'https://images.unsplash.com/photo-1583454110551-21c2be3449f7?w=800&q=80', 'Reps: 8 8 8', 45, 1, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'),
('gp-d3-e3', 'gp-d3', 'Body lock when they turtle', 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80', 'Reps: 6 6 6', 55, 2, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'),
('gp-d3-e4', 'gp-d3', 'Live — pass after scramble', 'https://images.unsplash.com/photo-1623874514711-0f321325f318?w=800&q=80', 'Rounds: 4 × 2 min', 60, 3, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4')
on conflict (id) do update set
  name = excluded.name,
  thumbnail_url = excluded.thumbnail_url,
  reps = excluded.reps,
  rest_seconds = excluded.rest_seconds,
  sort_order = excluded.sort_order,
  video_url = excluded.video_url;

-- Ensure day-1-guard also has solid cover
update public.workout_sessions set
  cover_url = coalesce(nullif(cover_url, ''), 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1400&q=80'),
  video_url = coalesce(nullif(video_url, ''), 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4')
where id = 'day-1-guard';
