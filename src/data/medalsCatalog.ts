/** Medal catalog + evaluation (client). Server awards via award_medal RPC. */

export type MedalCategory = "training" | "veteran" | "growth";

export type MedalDef = {
  id: string;
  /** i18n keys resolved by the screens that render medals. */
  titleKey: string;
  summaryKey: string;
  category: MedalCategory;
  xpReward: number;
  iconKey: string;
};

export const MEDAL_DEFS: MedalDef[] = [
  {
    id: "day-one",
    titleKey: "medals.defs.dayOne.title",
    summaryKey: "medals.defs.dayOne.summary",
    category: "veteran",
    xpReward: 1000,
    iconKey: "dayone",
  },
  {
    id: "first-session",
    titleKey: "medals.defs.firstSession.title",
    summaryKey: "medals.defs.firstSession.summary",
    category: "training",
    xpReward: 250,
    iconKey: "mat",
  },
  {
    id: "favorite-camp",
    titleKey: "medals.defs.favoriteCamp.title",
    summaryKey: "medals.defs.favoriteCamp.summary",
    category: "training",
    xpReward: 100,
    iconKey: "star",
  },
  {
    id: "follow-1",
    titleKey: "medals.defs.follow1.title",
    summaryKey: "medals.defs.follow1.summary",
    category: "growth",
    xpReward: 150,
    iconKey: "users",
  },
  {
    id: "week-warrior",
    titleKey: "medals.defs.weekWarrior.title",
    summaryKey: "medals.defs.weekWarrior.summary",
    category: "training",
    xpReward: 500,
    iconKey: "flame",
  },
  {
    id: "streak-3",
    titleKey: "medals.defs.streak3.title",
    summaryKey: "medals.defs.streak3.summary",
    category: "training",
    xpReward: 350,
    iconKey: "streak",
  },
  {
    id: "streak-7",
    titleKey: "medals.defs.streak7.title",
    summaryKey: "medals.defs.streak7.summary",
    category: "training",
    xpReward: 750,
    iconKey: "lock",
  },
  {
    id: "camp-complete",
    titleKey: "medals.defs.campComplete.title",
    summaryKey: "medals.defs.campComplete.summary",
    category: "training",
    xpReward: 1000,
    iconKey: "trophy",
  },
  {
    id: "sessions-10",
    titleKey: "medals.defs.sessions10.title",
    summaryKey: "medals.defs.sessions10.summary",
    category: "training",
    xpReward: 600,
    iconKey: "ten",
  },
  {
    id: "sessions-25",
    titleKey: "medals.defs.sessions25.title",
    summaryKey: "medals.defs.sessions25.summary",
    category: "training",
    xpReward: 1200,
    iconKey: "shield",
  },
  {
    id: "referral-1",
    titleKey: "medals.defs.referral1.title",
    summaryKey: "medals.defs.referral1.summary",
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
  hasFollow: boolean;
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
  tryAdd("follow-1", stats.hasFollow);
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
