# RASHMAT app (mobile)

Expo mobile — athletes train, progress, enroll.

Sibling package: [`../web`](../web) (site + Creator Studio / platform).

## Stack

- **Expo SDK 57** + **Expo Router**
- **Supabase** (Auth + Postgres + RLS) + **Mux** (session HLS)
- Creator **Studio** — primary CMS lives in [`../web`](../web) at `/studio`; app still has `/studio` for on-device editing

## Run

```bash
cp .env.example .env
bun install
bun run ios   # or android / web / start
```

Apply SQL migrations under `supabase/migrations/` in order (through `20260328000000_showcase_program_seed.sql` for the full Guard Retention showcase).

Brand: **RASHMAT** · [rashmat.app](https://rashmat.app) · [@rashmatapp](https://www.instagram.com/rashmatapp/)

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md).
