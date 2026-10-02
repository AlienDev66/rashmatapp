-- Stripe Connect (Express) + paid program unlocks (web checkout → enrollment).

-- Creator payout identity (on profiles — creators are auth users with is_creator)
alter table public.profiles
  add column if not exists stripe_account_id text,
  add column if not exists stripe_charges_enabled boolean not null default false,
  add column if not exists stripe_details_submitted boolean not null default false;

create unique index if not exists profiles_stripe_account_id_uidx
  on public.profiles (stripe_account_id)
  where stripe_account_id is not null;

-- Program pricing (cents; null / 0 = free even if is_premium)
alter table public.programs
  add column if not exists price_cents integer,
  add column if not exists currency text not null default 'eur';

alter table public.programs
  drop constraint if exists programs_price_cents_nonneg;
alter table public.programs
  add constraint programs_price_cents_nonneg
  check (price_cents is null or price_cents >= 0);

comment on column public.programs.price_cents is
  'Price in smallest currency unit (e.g. cents). Null/0 = free unlock path.';
comment on column public.programs.currency is
  'ISO currency for Stripe Checkout (lowercase), default eur.';

-- Purchase ledger (webhook idempotency)
create table if not exists public.program_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  program_id text not null references public.programs (id) on delete cascade,
  stripe_checkout_session_id text not null,
  stripe_payment_intent_id text,
  amount_cents integer not null,
  currency text not null default 'eur',
  status text not null default 'completed'
    check (status in ('completed', 'refunded', 'failed')),
  created_at timestamptz not null default now(),
  unique (stripe_checkout_session_id)
);

create index if not exists program_purchases_user_program_idx
  on public.program_purchases (user_id, program_id);

alter table public.program_purchases enable row level security;

drop policy if exists "purchases_select_own" on public.program_purchases;
create policy "purchases_select_own" on public.program_purchases
  for select to authenticated
  using (auth.uid() = user_id);

-- Service-role enroll after successful Stripe Checkout (bypasses client free path).
create or replace function public.enroll_after_purchase(
  p_user_id uuid,
  p_program_id text,
  p_session_id text,
  p_payment_intent text,
  p_amount_cents integer,
  p_currency text default 'eur'
)
returns public.user_program_enrollments
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.user_program_enrollments;
begin
  if p_user_id is null or p_program_id is null or p_session_id is null then
    raise exception 'Missing purchase fields';
  end if;

  insert into public.program_purchases (
    user_id,
    program_id,
    stripe_checkout_session_id,
    stripe_payment_intent_id,
    amount_cents,
    currency,
    status
  )
  values (
    p_user_id,
    p_program_id,
    p_session_id,
    p_payment_intent,
    coalesce(p_amount_cents, 0),
    lower(coalesce(p_currency, 'eur')),
    'completed'
  )
  on conflict (stripe_checkout_session_id) do nothing;

  insert into public.user_program_enrollments (user_id, program_id)
  values (p_user_id, p_program_id)
  on conflict (user_id, program_id) do update
    set enrolled_at = public.user_program_enrollments.enrolled_at
  returning * into row;

  if row is null then
    select * into row
    from public.user_program_enrollments
    where user_id = p_user_id and program_id = p_program_id;
  end if;

  return row;
end;
$$;

revoke all on function public.enroll_after_purchase(uuid, text, text, text, integer, text) from public;
-- Only service role (edge webhook) should call this — not exposed to anon/authenticated.

comment on function public.enroll_after_purchase is
  'Stripe webhook enrollment + purchase row. Call with service role only.';
