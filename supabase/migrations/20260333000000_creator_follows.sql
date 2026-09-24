-- Creator follows: athletes follow creators; creators see followers

create table if not exists public.creator_follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  creator_id text not null references public.creators (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, creator_id)
);

create index if not exists creator_follows_creator_idx
  on public.creator_follows (creator_id, created_at desc);

create index if not exists creator_follows_follower_idx
  on public.creator_follows (follower_id, created_at desc);

alter table public.creator_follows enable row level security;

drop policy if exists "creator_follows_select" on public.creator_follows;
create policy "creator_follows_select" on public.creator_follows
  for select using (
    auth.uid() = follower_id
    or exists (
      select 1 from public.creators c
      where c.id = creator_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "creator_follows_insert_own" on public.creator_follows;
create policy "creator_follows_insert_own" on public.creator_follows
  for insert with check (auth.uid() = follower_id);

drop policy if exists "creator_follows_delete_own" on public.creator_follows;
create policy "creator_follows_delete_own" on public.creator_follows
  for delete using (auth.uid() = follower_id);

grant select, insert, delete on public.creator_follows to authenticated;

-- Medal: first follow
insert into public.medal_definitions (id, title, summary, category, xp_reward, sort_order, icon_key) values
  ('follow-1', 'Corner Crew', 'Follow your first creator on RASHMAT.', 'growth', 150, 18, 'users')
on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  xp_reward = excluded.xp_reward,
  sort_order = excluded.sort_order;

-- Toggle follow (cannot follow own creator row)
create or replace function public.toggle_creator_follow(p_creator_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  owner uuid;
  exists_row boolean;
begin
  if uid is null then raise exception 'Not authenticated'; end if;

  select user_id into owner from public.creators where id = p_creator_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Creator not found');
  end if;
  if owner is not null and owner = uid then
    return jsonb_build_object('ok', false, 'error', 'Cannot follow yourself');
  end if;

  select exists(
    select 1 from public.creator_follows
    where follower_id = uid and creator_id = p_creator_id
  ) into exists_row;

  if exists_row then
    delete from public.creator_follows
    where follower_id = uid and creator_id = p_creator_id;
    return jsonb_build_object(
      'ok', true,
      'following', false,
      'follower_count', (select count(*)::int from public.creator_follows where creator_id = p_creator_id)
    );
  end if;

  insert into public.creator_follows (follower_id, creator_id)
  values (uid, p_creator_id);

  return jsonb_build_object(
    'ok', true,
    'following', true,
    'follower_count', (select count(*)::int from public.creator_follows where creator_id = p_creator_id)
  );
end;
$$;

grant execute on function public.toggle_creator_follow(text) to authenticated;

-- Public-ish counts + whether current user follows
create or replace function public.creator_follow_stats(p_creator_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  cnt int;
  following boolean := false;
begin
  select count(*)::int into cnt from public.creator_follows where creator_id = p_creator_id;
  if uid is not null then
    select exists(
      select 1 from public.creator_follows
      where follower_id = uid and creator_id = p_creator_id
    ) into following;
  end if;
  return jsonb_build_object(
    'follower_count', coalesce(cnt, 0),
    'following', following
  );
end;
$$;

grant execute on function public.creator_follow_stats(text) to authenticated, anon;

-- List followers for a creator (public read of profiles for social proof)
create or replace function public.list_creator_followers(
  p_creator_id text,
  p_limit int default 50
)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  followed_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    f.follower_id,
    coalesce(nullif(trim(p.full_name), ''), 'Athlete') as full_name,
    p.avatar_url,
    f.created_at
  from public.creator_follows f
  left join public.profiles p on p.id = f.follower_id
  where f.creator_id = p_creator_id
  order by f.created_at desc
  limit greatest(1, least(coalesce(p_limit, 50), 100));
$$;

grant execute on function public.list_creator_followers(text, int) to authenticated, anon;

-- Creators the current user follows
create or replace function public.list_my_following(p_limit int default 50)
returns table (
  creator_id text,
  followed_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select f.creator_id, f.created_at
  from public.creator_follows f
  where f.follower_id = auth.uid()
  order by f.created_at desc
  limit greatest(1, least(coalesce(p_limit, 50), 100));
$$;

grant execute on function public.list_my_following(int) to authenticated;

-- Followers for the signed-in creator (owns creators.user_id)
create or replace function public.my_creator_followers(p_limit int default 100)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  followed_at timestamptz,
  creator_id text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  cid text;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select c.id into cid from public.creators c where c.user_id = uid limit 1;
  if cid is null then
    return;
  end if;
  return query
    select
      f.follower_id,
      coalesce(nullif(trim(p.full_name), ''), 'Athlete')::text,
      p.avatar_url,
      f.created_at,
      f.creator_id
    from public.creator_follows f
    left join public.profiles p on p.id = f.follower_id
    where f.creator_id = cid
    order by f.created_at desc
    limit greatest(1, least(coalesce(p_limit, 100), 200));
end;
$$;

grant execute on function public.my_creator_followers(int) to authenticated;
