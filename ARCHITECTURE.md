# RASHMAT backend architecture

**Decision (locked):** Supabase as primary backend + **Mux** for workout video streaming.

Martial arts marketplace: athletes follow programs with real progress; any user can become a creator and publish via Studio.

| Concern | Choice |
|--------|--------|
| Auth / session / password reset | Supabase Auth |
| Database | Postgres (Supabase) |
| App client | `@supabase/supabase-js` + encrypted SecureStore session |
| Assessment, progress, XP | Tables + RLS |
| Catalog (creators / programs / sessions) | Tables + RLS + AsyncStorage cache |
| Creator Studio | `activate_creator`, program ownership, `/studio` + `/studio/cms` |
| Student progress for creators | `creator_student_progress` RPC |
| Covers / avatars | Supabase Storage |
| Session video | Mux HLS (`mux_playback_id`) + `expo-video` |
| Payments (phase 2) | Stripe Connect / RevenueCat — MVP uses demo checkout + enroll |

## Local setup

1. Create a Supabase project.
2. Copy [`.env.example`](.env.example) → `.env` with URL + anon key (+ optional Mux sample ID).
3. Run SQL migrations in order under [`supabase/migrations/`](supabase/migrations/).
4. Configure Auth redirects (see Expo Go below).

## Expo Go email confirmation

`rashmat://` **does not open Expo Go**. Confirmation must redirect to an `exp://` URL.

1. Start the app and check the Metro log for:  
   `[RASHMAT] Auth redirect URI (add to Supabase): exp://…/--/auth/callback`
2. Supabase → **Authentication → URL Configuration → Redirect URLs**, add that `exp://…` URL, `exp://**`, `rashmat://auth/callback`, `rashmat://**`.
3. Open the confirmation link on the **phone** and choose **Open in Expo Go**.
4. Fastest for testing: disable **Confirm email**.

## Deep links

- Expo Go: `exp://IP:PORT/--/auth/callback`
- Builds: `rashmat://auth/callback`
- Program: `rashmat://program/{id}`

## Creator Studio (MVP)

- Activate: `activate_creator` RPC → `profiles.is_creator` + `creators` row
- Own programs: `programs.creator_user_id` + `status` draft/published
- App: `/studio` (minimal), `/studio/cms` (full session/drill editor)
- Students: `creator_student_progress` RPC
- Demo unlock: checkout → `enroll_program`

## Progress & Storage

- Migrations through [`20260325000000_rashmat_ma_seed.sql`](supabase/migrations/20260325000000_rashmat_ma_seed.sql)
- Session player hardening: sets/reps/rest/logging (prior migration)
