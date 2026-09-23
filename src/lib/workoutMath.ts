/** Parse "Reps: 8 8 8 8" / "10 10 10" / "Rounds: 5 × 2 min" into per-set targets. */
export function parseRepScheme(reps: string | null | undefined): number[] {
  if (!reps) return [8];

  const roundMatch = reps.match(/rounds?\s*:?\s*(\d+)/i);
  if (roundMatch) {
    const n = Math.max(1, Number(roundMatch[1]) || 1);
    // One work interval per round (label handled by formatRepsLabel)
    return Array.from({ length: n }, () => 1);
  }

  const nums = reps.match(/\d+/g)?.map((n) => Number(n)).filter((n) => n > 0) ?? [];
  return nums.length > 0 ? nums : [8];
}

export function isRoundScheme(reps: string | null | undefined) {
  return !!reps && /rounds?/i.test(reps);
}

export function formatRepsLabel(target: number, rawReps?: string | null) {
  if (isRoundScheme(rawReps)) {
    const mins = rawReps?.match(/×\s*(\d+)/)?.[1] ?? rawReps?.match(/(\d+)\s*min/i)?.[1];
    return mins ? `${mins} min` : "Round";
  }
  return `${target} Reps`;
}

/** Client-side XP estimate (server recomputes on complete). */
export function estimateSessionXp(opts: {
  setsLogged: number;
  durationSeconds: number;
}) {
  return Math.min(300, 40 + opts.setsLogged * 8 + Math.min(60, Math.floor(opts.durationSeconds / 60)));
}

export const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5] as const;
export type PlaybackSpeed = (typeof SPEED_OPTIONS)[number];

export function nextSpeed(current: PlaybackSpeed): PlaybackSpeed {
  const i = SPEED_OPTIONS.indexOf(current);
  return SPEED_OPTIONS[(i + 1) % SPEED_OPTIONS.length] ?? 1;
}

export function isProMember(membership?: string | null) {
  return !!membership && /pro/i.test(membership);
}
