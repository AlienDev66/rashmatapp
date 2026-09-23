-- OpenMat: creator ownership, draft/publish, student progress for creators

-- ---------------------------------------------------------------------------
-- Profiles: anyone can become a creator
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_creator boolean not null default false;

alter table public.profiles
  add column if not exists creator_slug text;

create unique index if not exists profiles_creator_slug_uidx
  on public.profiles (creator_slug)
  where creator_slug is not null;

-- ---------------------------------------------------------------------------
-- Programs: ownership + publish state
-- ---------------------------------------------------------------------------
alter table public.programs
  add column if not exists creator_user_id uuid references auth.users (id) on delete set null;

alter table public.programs
  add column if not exists status text not null default 'published'
    check (status in ('draft', 'published'));

-- Seed / legacy catalog stays published and readable
update public.programs
set status = 'published'
where status is null or status = '';

create index if not exists programs_creator_user_idx
  on public.programs (creator_user_id)
  where creator_user_id is not null;

create index if not exists programs_status_idx
  on public.programs (status);

-- ---------------------------------------------------------------------------
-- Creators catalog: link optional auth user
-- ---------------------------------------------------------------------------
alter table public.creators
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create unique index if not exists creators_user_id_uidx
  on public.creators (user_id)
  where user_id is not null;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.owns_program(p_program_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.programs
    where id = p_program_id
      and creator_user_id = auth.uid()
  );
$$;

create or replace function public.program_is_readable(p_program_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.programs
    where id = p_program_id
      and (
        status = 'published'
        or creator_user_id = auth.uid()
        or creator_user_id is null
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- Activate creator + ensure creators row
-- ---------------------------------------------------------------------------
create or replace function public.activate_creator(p_slug text default null)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  row public.profiles;
  slug text;
  display_name text;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into row from public.profiles where id = uid;
  if row.id is null then
    insert into public.profiles (id) values (uid)
    returning * into row;
  end if;

  slug := lower(regexp_replace(
    coalesce(nullif(trim(p_slug), ''), nullif(row.creator_slug, ''), nullif(row.full_name, ''), 'creator-' || substr(uid::text, 1, 8)),
    '[^a-z0-9]+', '-', 'g'
  ));
  slug := trim(both '-' from slug);
  if slug = '' then
    slug := 'creator-' || substr(uid::text, 1, 8);
  end if;

  -- Ensure unique slug
  if exists (
    select 1 from public.profiles
    where creator_slug = slug and id <> uid
  ) then
    slug := slug || '-' || substr(uid::text, 1, 4);
  end if;

  display_name := coalesce(nullif(row.full_name, ''), upper(slug));

  update public.profiles
  set is_creator = true,
      creator_slug = slug
  where id = uid
  returning * into row;

  insert into public.creators (id, name, role, bio, avatar_url, verified, user_id)
  values (
    slug,
    display_name,
    'RASHMAT Creator',
    '',
    row.avatar_url,
    false,
    uid
  )
  on conflict (id) do update
    set user_id = excluded.user_id,
        name = coalesce(nullif(public.creators.name, ''), excluded.name),
        avatar_url = coalesce(excluded.avatar_url, public.creators.avatar_url);

  return row;
end;
$$;

-- ---------------------------------------------------------------------------
-- Creator student progress (enrollments on owned published/draft programs)
-- ---------------------------------------------------------------------------
create or replace function public.creator_student_progress(p_program_id text default null)
returns table (
  enrollment_id uuid,
  program_id text,
  program_title text,
  student_id uuid,
  student_name text,
  student_avatar text,
  progress_pct integer,
  current_day integer,
  enrolled_at timestamptz,
  last_completed_at timestamptz,
  sessions_done integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select
    e.id as enrollment_id,
    e.program_id,
    p.title as program_title,
    e.user_id as student_id,
    coalesce(pr.full_name, 'Athlete') as student_name,
    pr.avatar_url as student_avatar,
    e.progress_pct,
    e.current_day,
    e.enrolled_at,
    (
      select max(sc.completed_at)
      from public.session_completions sc
      join public.workout_sessions ws on ws.id = sc.session_id
      where sc.user_id = e.user_id and ws.program_id = e.program_id
    ) as last_completed_at,
    (
      select count(*)::integer
      from public.session_completions sc
      join public.workout_sessions ws on ws.id = sc.session_id
      where sc.user_id = e.user_id and ws.program_id = e.program_id
    ) as sessions_done
  from public.user_program_enrollments e
  join public.programs p on p.id = e.program_id
  left join public.profiles pr on pr.id = e.user_id
  where p.creator_user_id = uid
    and (p_program_id is null or e.program_id = p_program_id)
  order by e.enrolled_at desc;
end;
$$;

-- Allow creators to see enrollments on their programs (for dashboard; RPC is primary)
drop policy if exists "enrollments_creator_read" on public.user_program_enrollments;
create policy "enrollments_creator_read" on public.user_program_enrollments
  for select using (
    exists (
      select 1 from public.programs p
      where p.id = program_id and p.creator_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: replace open catalog read with published (+ owner) rules
-- ---------------------------------------------------------------------------
drop policy if exists "programs_read" on public.programs;
drop policy if exists "programs_read_anon" on public.programs;
drop policy if exists "sessions_read" on public.workout_sessions;
drop policy if exists "sessions_read_anon" on public.workout_sessions;
drop policy if exists "exercises_read" on public.exercises;
drop policy if exists "exercises_read_anon" on public.exercises;

create policy "programs_read" on public.programs
  for select to authenticated using (
    status = 'published'
    or creator_user_id = auth.uid()
    or creator_user_id is null
  );

create policy "programs_read_anon" on public.programs
  for select to anon using (status = 'published' or creator_user_id is null);

create policy "programs_insert_own" on public.programs
  for insert to authenticated
  with check (creator_user_id = auth.uid());

create policy "programs_update_own" on public.programs
  for update to authenticated
  using (creator_user_id = auth.uid())
  with check (creator_user_id = auth.uid());

create policy "programs_delete_own" on public.programs
  for delete to authenticated
  using (creator_user_id = auth.uid());

create policy "sessions_read" on public.workout_sessions
  for select to authenticated using (public.program_is_readable(program_id));

create policy "sessions_read_anon" on public.workout_sessions
  for select to anon using (
    exists (
      select 1 from public.programs p
      where p.id = program_id and (p.status = 'published' or p.creator_user_id is null)
    )
  );

create policy "sessions_write_own" on public.workout_sessions
  for all to authenticated
  using (public.owns_program(program_id))
  with check (public.owns_program(program_id));

create policy "exercises_read" on public.exercises
  for select to authenticated using (
    exists (
      select 1 from public.workout_sessions ws
      where ws.id = session_id and public.program_is_readable(ws.program_id)
    )
  );

create policy "exercises_read_anon" on public.exercises
  for select to anon using (
    exists (
      select 1
      from public.workout_sessions ws
      join public.programs p on p.id = ws.program_id
      where ws.id = session_id and (p.status = 'published' or p.creator_user_id is null)
    )
  );

create policy "exercises_write_own" on public.exercises
  for all to authenticated
  using (
    exists (
      select 1 from public.workout_sessions ws
      where ws.id = session_id and public.owns_program(ws.program_id)
    )
  )
  with check (
    exists (
      select 1 from public.workout_sessions ws
      where ws.id = session_id and public.owns_program(ws.program_id)
    )
  );

-- Creators row: owner can update their linked row
drop policy if exists "creators_update_own" on public.creators;
create policy "creators_update_own" on public.creators
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "creators_insert_own" on public.creators;
create policy "creators_insert_own" on public.creators
  for insert to authenticated
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.programs to authenticated;
grant select, insert, update, delete on public.workout_sessions to authenticated;
grant select, insert, update, delete on public.exercises to authenticated;
grant insert, update on public.creators to authenticated;

grant execute on function public.activate_creator(text) to authenticated;
grant execute on function public.creator_student_progress(text) to authenticated;
grant execute on function public.owns_program(text) to authenticated;
grant execute on function public.program_is_readable(text) to authenticated;

update public.programs
set tags = array['BJJ', 'Gi', 'Fundamentals']
where id = 'blue-belt';

update public.programs
set tags = array['Competition', 'No-Gi', 'ADCC']
where id = 'adcc';

update public.programs
set tags = array['Guard', 'Passing', 'BJJ']
where id = 'guard';
