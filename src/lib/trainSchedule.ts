import type { Program, WorkoutSession } from "@/src/types";

const DAYS_PER_WEEK = 7;

export type DayStatus = "done" | "current" | "upcoming" | "rest";

export type ScheduleDay = {
  /** 1-based day index across the whole program calendar */
  absoluteDay: number;
  /** 0-based week */
  weekIndex: number;
  /** 1–7 within the week */
  dayInWeek: number;
  rest: boolean;
  session: WorkoutSession | null;
  status: DayStatus;
};

function sessionByDay(sessions: WorkoutSession[]): Map<number, WorkoutSession> {
  const map = new Map<number, WorkoutSession>();
  for (const s of sessions) {
    if (!map.has(s.day)) map.set(s.day, s);
  }
  return map;
}

/**
 * Build a STNDRD-style calendar: weeks of 7 days.
 * Missing session days are rest. Status uses enrollment currentDay + completions.
 */
export function buildProgramSchedule(
  sessions: WorkoutSession[],
  program: Program,
  currentDay: number,
  completedIds: Set<string> = new Set(),
): ScheduleDay[] {
  const byDay = sessionByDay(sessions);
  const maxSessionDay = sessions.reduce((m, s) => Math.max(m, s.day), 0);
  const totalDays = Math.max(
    program.weeks * DAYS_PER_WEEK,
    Math.ceil(Math.max(maxSessionDay, 1) / DAYS_PER_WEEK) * DAYS_PER_WEEK,
  );

  const days: ScheduleDay[] = [];
  for (let absoluteDay = 1; absoluteDay <= totalDays; absoluteDay++) {
    const session = byDay.get(absoluteDay) ?? null;
    const rest = !session;
    const weekIndex = Math.floor((absoluteDay - 1) / DAYS_PER_WEEK);
    const dayInWeek = ((absoluteDay - 1) % DAYS_PER_WEEK) + 1;

    let status: DayStatus = "upcoming";
    if (rest) {
      status = "rest";
    } else if (session && completedIds.has(session.id)) {
      status = "done";
    } else if (absoluteDay < currentDay) {
      status = "done";
    } else if (absoluteDay === currentDay) {
      status = "current";
    }

    days.push({
      absoluteDay,
      weekIndex,
      dayInWeek,
      rest,
      session,
      status,
    });
  }
  return days;
}

export function weekCount(schedule: ScheduleDay[]): number {
  if (schedule.length === 0) return 1;
  return Math.max(...schedule.map((d) => d.weekIndex)) + 1;
}

export function daysForWeek(schedule: ScheduleDay[], weekIndex: number): ScheduleDay[] {
  return schedule.filter((d) => d.weekIndex === weekIndex);
}

export function weekIndexForDay(absoluteDay: number): number {
  return Math.floor((Math.max(1, absoluteDay) - 1) / DAYS_PER_WEEK);
}

/** Prefer current day; if rest, next training day in same week or next. */
export function initialSelectedDay(
  schedule: ScheduleDay[],
  currentDay: number,
): ScheduleDay | null {
  if (schedule.length === 0) return null;
  const exact = schedule.find((d) => d.absoluteDay === currentDay);
  if (exact && !exact.rest) return exact;
  const nextTrain = schedule.find(
    (d) => d.absoluteDay >= currentDay && !d.rest && d.status !== "done",
  );
  if (nextTrain) return nextTrain;
  const anyTrain = schedule.find((d) => !d.rest);
  return anyTrain ?? schedule[0] ?? null;
}

export function orderedProgramSessions(
  sessions: WorkoutSession[],
  programId: string,
  dayOrder: string[] = [],
): WorkoutSession[] {
  const list = sessions
    .filter((s) => s.programId === programId)
    .sort((a, b) => a.day - b.day);
  if (!dayOrder.length) return list;
  const byId = new Map(list.map((s) => [s.id, s]));
  const ordered = dayOrder.map((id) => byId.get(id)).filter(Boolean) as WorkoutSession[];
  for (const s of list) {
    if (!ordered.some((o) => o.id === s.id)) ordered.push(s);
  }
  return ordered;
}
