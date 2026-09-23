-- Gamification: medals, favorites, referrals, leaderboards, restart camp

-- ---------------------------------------------------------------------------
-- Profile referral code
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists referral_code text;

alter table public.profiles
  add column if not exists referred_by uuid references public.profiles (id) on delete set null;

create unique index if not exists profiles_referral_code_uidx
  on public.profiles (referral_code)
  where referral_code is not null;

-- ---------------------------------------------------------------------------
-- Medals
-- ---------------------------------------------------------------------------
create table if not exists public.medal_definitions (
  id text primary key,
  title text not null,
  summary text not null,
  category text not null default 'training',
  xp_reward integer not null default 0,
  sort_order integer not null default 0,
  icon_key text not null default 'medal'
);

create table if not exists public.user_medals (
  user_id uuid not null references auth.users (id) on delete cascade,
  medal_id text not null references public.medal_definitions (id) on delete cascade,
  awarded_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb,
  primary key (user_id, medal_id)
);

alter table public.user_medals enable row level security;
drop policy if exists "user_medals_select_own" on public.user_medals;
create policy "user_medals_select_own" on public.user_medals
  for select using (auth.uid() = user_id);

-- Public read of medal catalog
alter table public.medal_definitions enable row level security;
drop policy if exists "medal_defs_public_read" on public.medal_definitions;
create policy "medal_defs_public_read" on public.medal_definitions
  for select using (true);

grant select on public.medal_definitions to authenticated, anon;
grant select on public.user_medals to authenticated;

insert into public.medal_definitions (id, title, summary, category, xp_reward, sort_order, icon_key) values
  ('first-session', 'First Mat', 'Complete your first training session.', 'training', 250, 10, 'mat'),
  ('week-warrior', 'Week Warrior', 'Log 4 sessions in 7 days.', 'training', 500, 20, 'flame'),
  ('streak-3', 'On The Mats', 'Train 3 days in a row.', 'training', 350, 30, 'streak'),
  ('streak-7', 'Locked In', '7-day training streak.', 'training', 750, 40, 'lock'),
  ('camp-complete', 'Camp Complete', 'Finish every session in a camp.', 'training', 1000, 50, 'trophy'),
  ('sessions-10', 'Ten Sessions', 'Complete 10 sessions total.', 'training', 600, 60, 'ten'),
  ('sessions-25', 'Mat Regular', 'Complete 25 sessions total.', 'training', 1200, 70, 'shield'),
  ('day-one', 'Day One Member', 'Joined RASHMAT in the early window.', 'veteran', 1000, 5, 'dayone'),
  ('referral-1', 'Training Partner', 'Invite a friend who completes a session.', 'growth', 400, 80, 'partner'),
  ('favorite-camp', 'Saved Camp', 'Favorite a program to train later.', 'training', 100, 15, 'star')
on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  xp_reward = excluded.xp_reward,
  sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Favorites
-- ---------------------------------------------------------------------------
create table if not exists public.user_program_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  program_id text not null references public.programs (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, program_id)
);

alter table public.user_program_favorites enable row level security;
drop policy if exists "favorites_all_own" on public.user_program_favorites;
create policy "favorites_all_own" on public.user_program_favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, delete on public.user_program_favorites to authenticated;

-- ---------------------------------------------------------------------------
-- Session notes (AM-friendly — not weight)
-- ---------------------------------------------------------------------------
alter table public.set_logs
  add column if not exists note text;

-- ---------------------------------------------------------------------------
-- Ensure referral code on profile
-- ---------------------------------------------------------------------------
create or replace function public.ensure_referral_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  code text;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select referral_code into code from public.profiles where id = uid;
  if code is not null and length(code) > 0 then
    return code;
  end if;
  code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  update public.profiles set referral_code = code where id = uid;
  return code;
end;
$$;

grant execute on function public.ensure_referral_code() to authenticated;

-- Apply a referral code (once). Awards referrer medal later via evaluate.
create or replace function public.apply_referral_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  referrer uuid;
  existing uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select referred_by into existing from public.profiles where id = uid;
  if existing is not null then
    return jsonb_build_object('ok', false, 'error', 'Already referred');
  end if;
  select id into referrer
  from public.profiles
  where upper(referral_code) = upper(trim(p_code))
  limit 1;
  if referrer is null then
    return jsonb_build_object('ok', false, 'error', 'Invalid code');
  end if;
  if referrer = uid then
    return jsonb_build_object('ok', false, 'error', 'Cannot use your own code');
  end if;
  update public.profiles set referred_by = referrer where id = uid;
  return jsonb_build_object('ok', true, 'referrer_id', referrer);
end;
$$;

grant execute on function public.apply_referral_code(text) to authenticated;

-- Award a medal (+ XP) if not already owned
create or replace function public.award_medal(p_medal_id text, p_meta jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  def public.medal_definitions;
  already boolean;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into def from public.medal_definitions where id = p_medal_id;
  if def.id is null then
    return jsonb_build_object('ok', false, 'error', 'Unknown medal');
  end if;
  select exists(
    select 1 from public.user_medals where user_id = uid and medal_id = p_medal_id
  ) into already;
  if already then
    return jsonb_build_object('ok', true, 'already', true, 'xp', 0);
  end if;

  insert into public.user_medals (user_id, medal_id, meta)
  values (uid, p_medal_id, coalesce(p_meta, '{}'::jsonb));

  if def.xp_reward > 0 then
    insert into public.xp_events (user_id, amount, reason, meta)
    values (uid, def.xp_reward, 'medal', jsonb_build_object('medal_id', p_medal_id));
    update public.profiles set xp = xp + def.xp_reward where id = uid;
  end if;

  return jsonb_build_object('ok', true, 'already', false, 'xp', def.xp_reward, 'title', def.title);
end;
$$;

grant execute on function public.award_medal(text, jsonb) to authenticated;

-- Internal award for another user (referrer) — only from security definer helpers
create or replace function public.award_medal_to(p_user_id uuid, p_medal_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  def public.medal_definitions;
  already boolean;
begin
  select * into def from public.medal_definitions where id = p_medal_id;
  if def.id is null then return; end if;
  select exists(
    select 1 from public.user_medals where user_id = p_user_id and medal_id = p_medal_id
  ) into already;
  if already then return; end if;
  insert into public.user_medals (user_id, medal_id) values (p_user_id, p_medal_id);
  if def.xp_reward > 0 then
    insert into public.xp_events (user_id, amount, reason, meta)
    values (p_user_id, def.xp_reward, 'medal', jsonb_build_object('medal_id', p_medal_id));
    update public.profiles set xp = xp + def.xp_reward where id = p_user_id;
  end if;
end;
$$;

-- Restart a camp: clear completions for that program, reset enrollment
create or replace function public.restart_program(p_program_id text)
returns public.user_program_enrollments
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  row public.user_program_enrollments;
begin
  if uid is null then raise exception 'Not authenticated'; end if;

  delete from public.session_completions sc
  using public.workout_sessions ws
  where sc.user_id = uid
    and sc.session_id = ws.id
    and ws.program_id = p_program_id;

  delete from public.session_progress sp
  using public.workout_sessions ws
  where sp.user_id = uid
    and sp.session_id = ws.id
    and ws.program_id = p_program_id;

  insert into public.user_program_enrollments (user_id, program_id, current_day, progress_pct)
  values (uid, p_program_id, 1, 0)
  on conflict (user_id, program_id) do update
    set current_day = 1, progress_pct = 0
  returning * into row;

  return row;
end;
$$;

grant execute on function public.restart_program(text) to authenticated;

-- Global leaderboard
create or replace function public.leaderboard_global(p_period text default 'all_time', p_limit integer default 50)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  xp integer,
  rank bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_period = 'monthly' then
    return query
    with month_xp as (
      select e.user_id, coalesce(sum(e.amount), 0)::integer as xp
      from public.xp_events e
      where e.created_at >= date_trunc('month', now())
      group by e.user_id
    )
    select
      m.user_id,
      coalesce(p.full_name, 'Athlete')::text,
      p.avatar_url,
      m.xp,
      rank() over (order by m.xp desc, m.user_id)::bigint
    from month_xp m
    join public.profiles p on p.id = m.user_id
    order by m.xp desc
    limit greatest(1, least(p_limit, 100));
  else
    return query
    select
      p.id,
      coalesce(p.full_name, 'Athlete')::text,
      p.avatar_url,
      p.xp,
      rank() over (order by p.xp desc, p.id)::bigint
    from public.profiles p
    where p.xp > 0
    order by p.xp desc
    limit greatest(1, least(p_limit, 100));
  end if;
end;
$$;

grant execute on function public.leaderboard_global(text, integer) to authenticated, anon;

-- Program / camp leaderboard
create or replace function public.leaderboard_program(p_program_id text, p_limit integer default 50)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  xp integer,
  sessions_done integer,
  rank bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with camp as (
    select
      sc.user_id,
      coalesce(sum(sc.xp_earned), 0)::integer as xp,
      count(*)::integer as sessions_done
    from public.session_completions sc
    join public.workout_sessions ws on ws.id = sc.session_id
    where ws.program_id = p_program_id
    group by sc.user_id
  )
  select
    c.user_id,
    coalesce(p.full_name, 'Athlete')::text,
    p.avatar_url,
    c.xp,
    c.sessions_done,
    rank() over (order by c.xp desc, c.sessions_done desc, c.user_id)::bigint
  from camp c
  join public.profiles p on p.id = c.user_id
  order by c.xp desc
  limit greatest(1, least(p_limit, 100));
end;
$$;

grant execute on function public.leaderboard_program(text, integer) to authenticated, anon;

-- After first session of a referred user, award referrer
create or replace function public.maybe_award_referral_on_complete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  referrer uuid;
  prior_count integer;
begin
  select count(*)::integer into prior_count
  from public.session_completions
  where user_id = new.user_id and session_id <> new.session_id;

  if prior_count > 0 then
    return new;
  end if;

  select referred_by into referrer from public.profiles where id = new.user_id;
  if referrer is not null then
    perform public.award_medal_to(referrer, 'referral-1');
  end if;
  return new;
end;
$$;

drop trigger if exists session_completions_referral on public.session_completions;
create trigger session_completions_referral
  after insert on public.session_completions
  for each row execute function public.maybe_award_referral_on_complete();
