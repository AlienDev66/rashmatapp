-- Full catalog reset: keep only the real creator account, wipe programs,
-- seed marketplace creators + complete programs with bundled video refs.
-- App resolves rashmat://bundled/N → local H.264 assets (always playable).

-- ---------------------------------------------------------------------------
-- 1) Wipe progress + catalog
-- ---------------------------------------------------------------------------
delete from public.set_logs;
delete from public.session_progress;
delete from public.session_completions;
delete from public.user_program_enrollments;
delete from public.exercises;
delete from public.workout_sessions;
delete from public.programs;

-- Keep the authenticated Studio creator (email: domingosmanuelcapitango@gmail.com)
delete from public.creators
where id <> 'domingosmanuelcapitango';

update public.creators set
  name = 'DOMINGOS CAPITANGO',
  role = 'BJJ Black Belt · RASHMAT Founder',
  bio = 'Portugal-based black belt. Builds structured camps that transfer to live rounds — pressure, retention, and finishing systems.',
  cover_url = 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1400&q=80',
  verified = true
where id = 'domingosmanuelcapitango';

-- ---------------------------------------------------------------------------
-- 2) Marketplace creators
-- ---------------------------------------------------------------------------
insert into public.creators (id, name, role, bio, avatar_url, cover_url, verified, socials) values
(
  'rafael-mendes', 'RAFAEL MENDES', 'BJJ Black Belt · Guard Specialist',
  'Berimbolo-to-back systems and modern open guard. Competition-tested sequences for gi athletes.',
  'https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=800&q=80',
  'https://images.unsplash.com/photo-1591117207239-788bf8de6c3b?w=1400&q=80',
  true, '{"instagram":"https://www.instagram.com/rashmatapp/"}'::jsonb
),
(
  'ana-costa', 'ANA COSTA', 'No-Gi World Medalist',
  'Leg entanglements, body locks, and high-percentage no-gi finishes for women and lightweights.',
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
  'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1400&q=80',
  true, '{"instagram":"https://www.instagram.com/rashmatapp/"}'::jsonb
),
(
  'kai-nakamura', 'KAI NAKAMURA', 'Wrestling → BJJ Coach',
  'Mat returns, front headlocks, and scramble control for athletes crossing over from wrestling.',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1400&q=80',
  true, '{"instagram":"https://www.instagram.com/rashmatapp/"}'::jsonb
),
(
  'maya-santos', 'MAYA SANTOS', 'Women''s BJJ Systems',
  'Closed guard attacks, hip mobility, and positional sparring designed for women''s divisions.',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=80',
  'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1400&q=80',
  true, '{"instagram":"https://www.instagram.com/rashmatapp/"}'::jsonb
),
(
  'lucas-ferreira', 'LUCAS FERREIRA', 'ADCC Prep Coach',
  'High-output no-gi rounds, wrestling entries, and tournament-week peaking protocols.',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80',
  'https://images.unsplash.com/photo-1623874514711-0f321325f318?w=1400&q=80',
  true, '{"instagram":"https://www.instagram.com/rashmatapp/"}'::jsonb
),
(
  'elena-volkov', 'ELENA VOLKOV', 'Sambo / BJJ Hybrid',
  'Leg locks, knee bars, and sambo-influenced top pressure for modern no-gi.',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
  'https://images.unsplash.com/photo-1583454110551-21c2be3449f7?w=1400&q=80',
  true, '{"instagram":"https://www.instagram.com/rashmatapp/"}'::jsonb
),
(
  'marcus-johnson', 'MARCUS JOHNSON', 'MMA Wrestling Coach',
  'Cage wrestling, clinch takedowns, and top control for MMA fight camps.',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80',
  'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1400&q=80',
  true, '{"instagram":"https://www.instagram.com/rashmatapp/"}'::jsonb
),
(
  'isabel-rocha', 'ISABEL ROCHA', 'Gi Fundamentals',
  'Blue-belt curriculum: grips, posture, and escapes that stick under pressure.',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=80',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1400&q=80',
  true, '{"instagram":"https://www.instagram.com/rashmatapp/"}'::jsonb
),
(
  'theo-benoit', 'THÉO BENOIT', 'Pressure Passing',
  'Knee-cut, smash, and torreando chains with head-pressure details that finish passes.',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80',
  'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=1400&q=80',
  true, '{"instagram":"https://www.instagram.com/rashmatapp/"}'::jsonb
),
(
  'priya-sharma', 'PRIYA SHARMA', 'Mobility for Grapplers',
  'Hip openers, recovery flows, and prehab that keep you training 5+ days a week.',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80',
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1400&q=80',
  true, '{"instagram":"https://www.instagram.com/rashmatapp/"}'::jsonb
),
(
  'jordi-vila', 'JORDI VILA', 'Guard Retention',
  'Frames, hip heists, and recovery pathways when elite passers smash your guard.',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80',
  'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1400&q=80',
  true, '{"instagram":"https://www.instagram.com/rashmatapp/"}'::jsonb
),
(
  'nina-okonkwo', 'NINA OKONKWO', 'Striking for MMA',
  'Clinch entries, teeps, and pad rounds that transfer to fight week.',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
  'https://images.unsplash.com/photo-1583454110551-21c2be3449f7?w=1400&q=80',
  true, '{"instagram":"https://www.instagram.com/rashmatapp/"}'::jsonb
);

-- ---------------------------------------------------------------------------
-- 3) Programs (complete camps)
-- ---------------------------------------------------------------------------
insert into public.programs (
  id, creator_id, title, description, cover_url,
  weeks, days_per_week, minutes, level, tags, is_premium, status, creator_user_id
)
select
  v.id, v.creator_id, v.title, v.description, v.cover_url,
  v.weeks, v.dpw, v.minutes, v.level, v.tags, v.premium, 'published',
  case when v.creator_id = 'domingosmanuelcapitango'
    then (select user_id from public.creators where id = 'domingosmanuelcapitango')
    else null
  end
from (values
  (
    'mat-foundations', 'domingosmanuelcapitango',
    'MAT FOUNDATIONS',
    'Your flagship 4-week camp: frames, pressure passing, and live retention rounds. Every drill has video.',
    'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1400&q=80',
    4, 3, 50, 'Intermediate', array['BJJ','Gi','Fundamentals']::text[], false
  ),
  (
    'passing-pressure-pro', 'theo-benoit',
    'PASSING PRESSURE PRO',
    'Knee-cut → smash → torreando. Build heavy top pressure that finishes the pass.',
    'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=1400&q=80',
    4, 3, 48, 'Intermediate', array['Passing','Pressure','Gi']::text[], false
  ),
  (
    'guard-retention-lab', 'jordi-vila',
    'GUARD RETENTION LAB',
    'Survive elite passers. Frames, hip heists, and emergency recoveries under fatigue.',
    'https://images.unsplash.com/photo-1591117207239-788bf8de6c3b?w=1400&q=80',
    4, 3, 50, 'Advanced', array['Guard','Retention','BJJ']::text[], true
  ),
  (
    'open-guard-modern', 'rafael-mendes',
    'MODERN OPEN GUARD',
    'Collar-sleeve, De La Riva, and berimbolo entries that chain into the back.',
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1400&q=80',
    4, 3, 55, 'Advanced', array['Open Guard','Gi','Competition']::text[], true
  ),
  (
    'nogi-entanglements', 'ana-costa',
    'NO-GI ENTANGLEMENTS',
    'Inside sankaku, outside ashi, and body-lock transitions for no-gi athletes.',
    'https://images.unsplash.com/photo-1623874514711-0f321325f318?w=1400&q=80',
    4, 3, 50, 'Intermediate', array['No-Gi','Legs','Women']::text[], false
  ),
  (
    'wrestle-up-system', 'kai-nakamura',
    'WRESTLE-UP SYSTEM',
    'Mat returns, front headlock chains, and scramble wins for wrestlers on the mats.',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1400&q=80',
    4, 3, 52, 'Intermediate', array['Wrestling','No-Gi','Scrambles']::text[], false
  ),
  (
    'blue-belt-blueprint', 'isabel-rocha',
    'BLUE BELT BLUEPRINT',
    'Closed guard, mount escapes, and side-control frames — the blue belt checklist.',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1400&q=80',
    4, 3, 45, 'Beginner', array['Gi','Beginner','Fundamentals']::text[], false
  ),
  (
    'adcc-peak-camp', 'lucas-ferreira',
    'ADCC PEAK CAMP',
    'Tournament-week intensity: wrestling entries, high-output rounds, and recovery.',
    'https://images.unsplash.com/photo-1599058945522-28d272b47b3e?w=1400&q=80',
    4, 4, 60, 'Advanced', array['ADCC','Competition','No-Gi']::text[], true
  ),
  (
    'sambo-leg-lock', 'elena-volkov',
    'SAMBO LEG LOCK LAB',
    'Knee bars, hip control, and entries from top half — sambo DNA for no-gi.',
    'https://images.unsplash.com/photo-1583454110551-21c2be3449f7?w=1400&q=80',
    4, 3, 48, 'Advanced', array['Leg Locks','Sambo','No-Gi']::text[], false
  ),
  (
    'cage-wrestling', 'marcus-johnson',
    'CAGE WRESTLING CAMP',
    'Clinch takedowns, fence rides, and top control for MMA fight camps.',
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1400&q=80',
    4, 3, 55, 'Intermediate', array['MMA','Wrestling','Clinch']::text[], false
  ),
  (
    'women-guard-attack', 'maya-santos',
    'WOMEN''S GUARD ATTACK',
    'Hip angles, collar chokes, and armbars from closed and half guard.',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1400&q=80',
    4, 3, 45, 'Beginner', array['Women','Gi','Guard']::text[], false
  ),
  (
    'grappler-mobility', 'priya-sharma',
    'GRAPPLER MOBILITY',
    'Hips, thoracic spine, and recovery flows so you can keep showing up.',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1400&q=80',
    4, 3, 35, 'Beginner', array['Mobility','Recovery','Prehab']::text[], false
  ),
  (
    'clinch-strike-camp', 'nina-okonkwo',
    'CLINCH & STRIKE CAMP',
    'Teeps, knees, and pad rounds that transfer to fight week.',
    'https://images.unsplash.com/photo-1583454110551-21c2be3449f7?w=1400&q=80',
    4, 3, 50, 'Intermediate', array['Muay Thai','Clinch','Striking']::text[], false
  )
) as v(id, creator_id, title, description, cover_url, weeks, dpw, minutes, level, tags, premium);

-- ---------------------------------------------------------------------------
-- 4) Sessions + drills (4 weeks × training days, 4 drills each)
--     video_url = rashmat://bundled/{0|1|2} → app local assets
-- ---------------------------------------------------------------------------
do $$
declare
  prog record;
  week int;
  day_in_week int;
  abs_day int;
  sess_id text;
  sess_title text;
  sess_desc text;
  cover text;
  drill_names text[];
  drill_reps text[];
  i int;
  ex_id text;
  thumbs text[] := array[
    'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&q=80',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
    'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&q=80',
    'https://images.unsplash.com/photo-1599058945522-28d272b47b3e?w=800&q=80',
    'https://images.unsplash.com/photo-1591117207239-788bf8de6c3b?w=800&q=80',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80'
  ];
  day_offsets int[] := array[1, 3, 5]; -- Mon / Wed / Fri within each week
  titles text[] := array[
    'FOUNDATION DAY', 'PRESSURE ROUNDS', 'LIVE APPLICATION',
    'TECHNIQUE BLOCK', 'CHAIN DRILLING', 'POSITIONAL SPARRING',
    'SPEED & TIMING', 'FINISHING SYSTEMS', 'SCRAMBLE CONTROL',
    'RECOVERY UNDER FIRE', 'HIGH OUTPUT', 'CAMP FINALE'
  ];
begin
  for prog in select * from public.programs loop
    for week in 0 .. (prog.weeks - 1) loop
      for day_in_week in 1 .. least(prog.days_per_week, 3) loop
        abs_day := week * 7 + day_offsets[day_in_week];
        sess_id := prog.id || '-w' || (week + 1) || 'd' || day_in_week;
        sess_title := titles[((week * 3 + day_in_week - 1) % array_length(titles, 1)) + 1]
          || ' · W' || (week + 1);
        sess_desc := 'Structured drilling for ' || prog.title || '. Watch · complete set · rest · next.';
        cover := thumbs[((week * 3 + day_in_week - 1) % array_length(thumbs, 1)) + 1];

        insert into public.workout_sessions (
          id, program_id, title, description, cover_url, tags, sets, day, minutes, video_url, mux_playback_id
        ) values (
          sess_id, prog.id, sess_title, sess_desc, cover,
          prog.tags, 12, abs_day, prog.minutes,
          'rashmat://bundled/' || ((week + day_in_week) % 3),
          null
        );

        -- Theme drills by program tags roughly
        if prog.tags && array['Passing'] then
          drill_names := array['Knee-cut setup', 'Head pressure pass', 'Smash finish', 'Live pass vs retain'];
        elsif prog.tags && array['Retention'] then
          drill_names := array['Elbow-knee frames', 'Hip heist recovery', 'Emergency shrimp', 'Live retain rounds'];
        elsif prog.tags && array['Wrestling'] then
          drill_names := array['Snap-down entry', 'Front headlock', 'Mat return', 'Live scramble'];
        elsif prog.tags && array['Mobility'] then
          drill_names := array['Hip opener flow', 'Thoracic rotations', 'Hamstring floss', 'Breathing cool-down'];
        elsif prog.tags && array['Striking'] then
          drill_names := array['Teep timing', 'Clinch pummel', 'Knee entries', 'Pad rounds'];
        elsif prog.tags && array['Leg Locks'] then
          drill_names := array['Outside ashi entry', 'Heel hook control', 'Knee bar finish', 'Live entangle'];
        else
          drill_names := array['Technical drill A', 'Technical drill B', 'Chain combination', 'Positional live'];
        end if;

        drill_reps := array['Reps: 8 8 8', 'Reps: 8 8 8', 'Reps: 6 6 6', 'Rounds: 4 × 2 min'];

        for i in 1 .. 4 loop
          ex_id := sess_id || '-e' || i;
          insert into public.exercises (
            id, session_id, name, thumbnail_url, reps, rest_seconds, sort_order, video_url, mux_playback_id
          ) values (
            ex_id,
            sess_id,
            drill_names[i],
            thumbs[((i + week + day_in_week) % array_length(thumbs, 1)) + 1],
            drill_reps[i],
            case when i = 4 then 75 else 45 end,
            i - 1,
            'rashmat://bundled/' || ((i - 1) % 3),
            null
          );
        end loop;
      end loop;
    end loop;
  end loop;
end $$;
