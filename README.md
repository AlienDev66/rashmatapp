# RASHMAT app (mobile)

Expo mobile — athletes train, progress, enroll.

Sibling package: [`../web`](../web) (site + Creator Studio / platform).

## Stack

- **Expo SDK 57** + **Expo Router**
- **Supabase** (Auth + Postgres + RLS) + **Mux** (session HLS)
- Creator **Studio** — migrating toward `../web`; app still has `/studio` + `/studio/cms` for MVP

## Run

```bash
cp .env.example .env
bun install
bun run ios   # or android / web / start
```

Apply SQL migrations under `supabase/migrations/` in order (through `20260325000000_rashmat_ma_seed.sql`).

Brand: **RASHMAT** · [rashmat.app](https://rashmat.app) · [@rashmatapp](https://www.instagram.com/rashmatapp/)

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md).
