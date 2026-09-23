/**
 * Manual smoke checklist (creator → athlete → progress visible).
 *
 * 1. Apply migrations through 20260325000000_rashmat_ma_seed.sql in Supabase.
 * 2. User A: More → Creator Studio → Become a creator → New program → Create & publish.
 * 3. Optional: Studio CMS → add session drills + Mux IDs.
 * 4. User B: open program → Unlock via demo checkout → train → complete a session.
 * 5. User A: Studio → Students (or program edit) → see B progress %.
 *
 * Automated unit coverage for this path is deferred; this file documents the e2e path.
 */
export const RASHMAT_SMOKE_PATH = [
  "activate_creator",
  "createProgram + publishProgram",
  "demoUnlockProgram (enroll)",
  "complete_session",
  "creator_student_progress",
] as const;
