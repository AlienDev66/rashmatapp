-- Live vs test Stripe Connect fields (Express accounts are mode-specific).
-- Existing stripe_account_id / stripe_charges_enabled / stripe_details_submitted = TEST.
-- Live columns are separate so localhost (test) and rashmat.com (live) do not clash.

alter table public.profiles
  add column if not exists stripe_account_id_live text,
  add column if not exists stripe_charges_enabled_live boolean not null default false,
  add column if not exists stripe_details_submitted_live boolean not null default false;

create unique index if not exists profiles_stripe_account_id_live_uidx
  on public.profiles (stripe_account_id_live)
  where stripe_account_id_live is not null;

comment on column public.profiles.stripe_account_id is
  'Stripe Connect Express account id (TEST / sandbox mode).';
comment on column public.profiles.stripe_account_id_live is
  'Stripe Connect Express account id (LIVE mode).';
