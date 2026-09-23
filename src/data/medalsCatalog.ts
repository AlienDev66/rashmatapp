/** Medal catalog + evaluation (client). Server awards via award_medal RPC. */

export type MedalCategory = "training" | "veteran" | "growth";

export type MedalDef = {
  id: string;
  title: string;
  summary: string;
  category: MedalCategory;
  xpReward: number;
  iconKey: string;
};

export const MEDAL_DEFS: MedalDef[] = [
  {
    id: "day-one",
    title: "Day One Member",
    summary: "Joined RASHMAT in the early window.",
    category: "veteran",
    xpReward: 1000,
    iconKey: "dayone",
  },
  {
    id: "first-session",
    title: "First Mat",
    summary: "Complete your first training session.",
    category: "training",
    xpReward: 250,
    iconKey: "mat",
  },
  {
    id: "favorite-camp",
    title: "Saved Camp",
    summary: "Favorite a program to train later.",
    category: "training",
    xpReward: 100,
    iconKey: "star",
  },
  {
    id: "week-warrior",
    title: "Week Warrior",
    summary: "Log 4 sessions in 7 days.",
    category: "training",
    xpReward: 500,
    iconKey: "flame",
  },
  {
    id: "streak-3",
    title: "On The Mats",
    summary: "Train 3 days in a row.",
    category: "training",
    xpReward: 350,
    iconKey: "streak",
  },
  {
    id: "streak-7",
    title: "Locked In",
    summary: "7-day training streak.",
    category: "training",
    xpReward: 750,
    iconKey: "lock",
  },
  {
    id: "camp-complete",
    title: "Camp Complete",
    summary: "Finish every session in a camp.",
    category: "training",
    xpReward: 1000,
    iconKey: "trophy",
  },
  {
    id: "sessions-10",
    title: "Ten Sessions",
    summary: "Complete 10 sessions total.",
    category: "training",
    xpReward: 600,
    iconKey: "ten",
  },
  {
    id: "sessions-25",
    title: "Mat Regular",
    summary: "Complete 25 sessions total.",
    category: "training",
    xpReward: 1200,
    iconKey: "shield",
  },
  {
    id: "referral-1",
    title: "Training Partner",
    summary: "Invite a friend who completes a session.",
    category: "growth",
    xpReward: 400,
    iconKey: "partner",
  },
];

export type TrainingStats = {
  totalSessions: number;
  campsCompleted: number;
  streakDays: number;
  weeklySessions: number;
  xp: number;
  isEarlyMember: boolean;
  hasFavorite: boolean;
  referralUnlocks: number;
};

export function medalsEarnedByStats(stats: TrainingStats, owned: Set<string>): string[] {
  const next: string[] = [];
  const tryAdd = (id: string, ok: boolean) => {
    if (ok && !owned.has(id)) next.push(id);
  };

  tryAdd("day-one", stats.isEarlyMember);
  tryAdd("first-session", stats.totalSessions >= 1);
  tryAdd("favorite-camp", stats.hasFavorite);
  tryAdd("week-warrior", stats.weeklySessions >= 4);
  tryAdd("streak-3", stats.streakDays >= 3);
  tryAdd("streak-7", stats.streakDays >= 7);
  tryAdd("camp-complete", stats.campsCompleted >= 1);
  tryAdd("sessions-10", stats.totalSessions >= 10);
  tryAdd("sessions-25", stats.totalSessions >= 25);
  tryAdd("referral-1", stats.referralUnlocks >= 1);

  return next;
}

export function getMedalDef(id: string) {
  return MEDAL_DEFS.find((m) => m.id === id) ?? null;
}
