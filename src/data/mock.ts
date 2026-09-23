import type { Creator, Program, UserProfile, WorkoutSession } from "@/src/types";
import { brand } from "@/src/lib/brand";

/**
 * __DEV__ offline fallback — IDs/titles aligned with
 * `20260331000000_catalog_reset_complete_seed.sql` (flagship: mat-foundations).
 * Videos use `rashmat://bundled/N` so playback matches production seed.
 */

/** Martial-arts imagery (Unsplash). */
const img = {
  mat1: "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1200&q=80",
  mat2: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&q=80",
  mat3: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80",
  roll: "https://images.unsplash.com/photo-1599058945522-28d272b47b3e?w=1200&q=80",
  gi: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=1200&q=80",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
  woman: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
  clinch: "https://images.unsplash.com/photo-1583454110551-21c2be3449f7?w=800&q=80",
  theo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80",
  jordi: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80",
  nina: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80",
};

const v = (n: 0 | 1 | 2) => `rashmat://bundled/${n}`;

export const currentUser: UserProfile = {
  name: "DOMINGOS CAPITANGO",
  avatarUrl: img.avatar,
  city: "Santarém",
  country: "Portugal",
  membership: "Basic member",
  xp: 17000,
  age: 24,
  weightKg: 72,
  kcal: 2200,
};

export const creators: Creator[] = [
  {
    id: "domingosmanuelcapitango",
    name: "DOMINGOS CAPITANGO",
    role: "BJJ Instructor – Black Belt",
    bio: "Portugal-based black belt. Pressure passing, guard retention, and live drilling that transfers to the mats.",
    avatarUrl: img.avatar,
    coverUrl: img.roll,
    verified: true,
    socials: {
      instagram: brand.social.instagram,
      tiktok: brand.social.tiktok,
      x: brand.social.x,
    },
    programIds: ["mat-foundations"],
  },
  {
    id: "theo-benoit",
    name: "THÉO BENOIT",
    role: "Pressure Passing",
    bio: "Knee-cut, smash, and torreando systems for athletes who want heavy top game.",
    avatarUrl: img.theo,
    coverUrl: img.gi,
    verified: true,
    socials: { instagram: brand.social.instagram },
    programIds: ["passing-pressure-pro"],
  },
  {
    id: "jordi-vila",
    name: "JORDI VILA",
    role: "Guard Retention",
    bio: "Frames, hip heists, and recovery pathways when elite passers smash your guard.",
    avatarUrl: img.jordi,
    coverUrl: img.mat1,
    verified: true,
    socials: { instagram: brand.social.instagram },
    programIds: ["guard-retention-lab"],
  },
  {
    id: "nina-okonkwo",
    name: "NINA OKONKWO",
    role: "Striking for MMA",
    bio: "Clinch entries, teeps, and pad rounds that transfer to fight week.",
    avatarUrl: img.nina,
    coverUrl: img.clinch,
    verified: true,
    socials: { instagram: brand.social.instagram },
    programIds: ["clinch-strike-camp"],
  },
];

export const programs: Program[] = [
  {
    id: "mat-foundations",
    title: "MAT FOUNDATIONS",
    description:
      "Your flagship 4-week camp: frames, pressure passing, and live retention rounds. Every drill has video.",
    coverUrl: img.mat1,
    weeks: 4,
    daysPerWeek: 3,
    minutes: 50,
    level: "Intermediate",
    tags: ["BJJ", "Gi", "Fundamentals"],
    creatorId: "domingosmanuelcapitango",
  },
  {
    id: "passing-pressure-pro",
    title: "PASSING PRESSURE PRO",
    description:
      "Knee-cut → smash → torreando. Build heavy top pressure that finishes the pass.",
    coverUrl: img.gi,
    weeks: 4,
    daysPerWeek: 3,
    minutes: 48,
    level: "Intermediate",
    tags: ["Passing", "Pressure", "Gi"],
    creatorId: "theo-benoit",
  },
  {
    id: "guard-retention-lab",
    title: "GUARD RETENTION LAB",
    description:
      "Survive elite passers. Frames, hip heists, and emergency recoveries under fatigue.",
    coverUrl: img.mat2,
    weeks: 4,
    daysPerWeek: 3,
    minutes: 50,
    level: "Advanced",
    tags: ["Guard", "Retention", "BJJ"],
    creatorId: "jordi-vila",
    isPremium: true,
  },
  {
    id: "blue-belt-blueprint",
    title: "BLUE BELT BLUEPRINT",
    description:
      "Closed guard, mount escapes, and side-control frames — the blue belt checklist.",
    coverUrl: img.mat3,
    weeks: 4,
    daysPerWeek: 3,
    minutes: 45,
    level: "Beginner",
    tags: ["Gi", "Beginner", "Fundamentals"],
    creatorId: "domingosmanuelcapitango",
  },
  {
    id: "clinch-strike-camp",
    title: "CLINCH & STRIKE CAMP",
    description: "Teeps, knees, and pad rounds that transfer to fight week.",
    coverUrl: img.clinch,
    weeks: 4,
    daysPerWeek: 3,
    minutes: 50,
    level: "Intermediate",
    tags: ["Muay Thai", "Clinch", "Striking"],
    creatorId: "nina-okonkwo",
  },
];

function drill(
  id: string,
  name: string,
  thumb: string,
  reps: string,
  restSeconds: number,
  videoIndex: 0 | 1 | 2,
) {
  return {
    id,
    name,
    thumbnailUrl: thumb,
    reps,
    restSeconds,
    videoUrl: v(videoIndex),
  };
}

export const sessions: WorkoutSession[] = [
  {
    id: "mat-foundations-w1d1",
    title: "FOUNDATION DAY · W1",
    description: "Frames under pressure — drill, rest, live.",
    coverUrl: img.mat1,
    tags: ["BJJ", "Gi", "Fundamentals"],
    sets: 12,
    exerciseCount: 4,
    programId: "mat-foundations",
    day: 1,
    minutes: 50,
    videoUrl: v(0),
    exercises: [
      drill("mat-foundations-w1d1-e1", "Elbow-knee frames", img.mat1, "Reps: 8 8 8", 45, 0),
      drill("mat-foundations-w1d1-e2", "Hip heist recovery", img.mat2, "Reps: 8 8 8", 45, 1),
      drill("mat-foundations-w1d1-e3", "Emergency shrimp", img.mat3, "Reps: 6 6 6", 45, 2),
      drill("mat-foundations-w1d1-e4", "Live retain rounds", img.roll, "Rounds: 4 × 2 min", 75, 0),
    ],
  },
  {
    id: "mat-foundations-w1d2",
    title: "PRESSURE ROUNDS · W1",
    description: "Passing pressure with controlled live rounds.",
    coverUrl: img.mat2,
    tags: ["BJJ", "Gi", "Fundamentals"],
    sets: 12,
    exerciseCount: 4,
    programId: "mat-foundations",
    day: 3,
    minutes: 50,
    videoUrl: v(1),
    exercises: [
      drill("mat-foundations-w1d2-e1", "Knee-cut setup", img.mat2, "Reps: 8 8 8", 45, 1),
      drill("mat-foundations-w1d2-e2", "Head pressure pass", img.gi, "Reps: 8 8 8", 45, 2),
      drill("mat-foundations-w1d2-e3", "Smash finish", img.mat3, "Reps: 6 6 6", 45, 0),
      drill("mat-foundations-w1d2-e4", "Live pass vs retain", img.roll, "Rounds: 4 × 2 min", 75, 1),
    ],
  },
  {
    id: "mat-foundations-w1d3",
    title: "LIVE APPLICATION · W1",
    description: "Chain drills into positional sparring.",
    coverUrl: img.mat3,
    tags: ["BJJ", "Gi", "Fundamentals"],
    sets: 12,
    exerciseCount: 4,
    programId: "mat-foundations",
    day: 5,
    minutes: 50,
    videoUrl: v(2),
    exercises: [
      drill("mat-foundations-w1d3-e1", "Technical drill A", img.mat3, "Reps: 8 8 8", 45, 2),
      drill("mat-foundations-w1d3-e2", "Technical drill B", img.mat1, "Reps: 8 8 8", 45, 0),
      drill("mat-foundations-w1d3-e3", "Chain combination", img.gi, "Reps: 6 6 6", 45, 1),
      drill("mat-foundations-w1d3-e4", "Positional live", img.roll, "Rounds: 4 × 2 min", 75, 2),
    ],
  },
  {
    id: "passing-pressure-pro-w1d1",
    title: "FOUNDATION DAY · W1",
    description: "Knee-cut entries with head pressure.",
    coverUrl: img.gi,
    tags: ["Passing", "Pressure", "Gi"],
    sets: 12,
    exerciseCount: 4,
    programId: "passing-pressure-pro",
    day: 1,
    minutes: 48,
    videoUrl: v(0),
    exercises: [
      drill("passing-pressure-pro-w1d1-e1", "Knee-cut setup", img.gi, "Reps: 8 8 8", 45, 0),
      drill("passing-pressure-pro-w1d1-e2", "Head pressure pass", img.mat1, "Reps: 8 8 8", 45, 1),
      drill("passing-pressure-pro-w1d1-e3", "Smash finish", img.mat2, "Reps: 6 6 6", 45, 2),
      drill("passing-pressure-pro-w1d1-e4", "Live pass vs retain", img.roll, "Rounds: 4 × 2 min", 75, 0),
    ],
  },
  {
    id: "blue-belt-blueprint-w1d1",
    title: "FOUNDATION DAY · W1",
    description: "Closed guard basics for the blue belt checklist.",
    coverUrl: img.mat3,
    tags: ["Gi", "Beginner", "Fundamentals"],
    sets: 12,
    exerciseCount: 4,
    programId: "blue-belt-blueprint",
    day: 1,
    minutes: 45,
    videoUrl: v(1),
    exercises: [
      drill("blue-belt-blueprint-w1d1-e1", "Hip escape to closed", img.mat3, "Reps: 8 8 8", 45, 1),
      drill("blue-belt-blueprint-w1d1-e2", "Collar grip break", img.mat1, "Reps: 10 10 10", 40, 2),
      drill("blue-belt-blueprint-w1d1-e3", "Armbar from closed", img.gi, "Reps: 6 6 6", 50, 0),
      drill("blue-belt-blueprint-w1d1-e4", "Positional — closed", img.roll, "Rounds: 3 × 3 min", 90, 1),
    ],
  },
  {
    id: "clinch-strike-camp-w1d1",
    title: "FOUNDATION DAY · W1",
    description: "Clinch entries before knees and teeps.",
    coverUrl: img.clinch,
    tags: ["Muay Thai", "Clinch", "Striking"],
    sets: 12,
    exerciseCount: 4,
    programId: "clinch-strike-camp",
    day: 1,
    minutes: 50,
    videoUrl: v(2),
    exercises: [
      drill("clinch-strike-camp-w1d1-e1", "Teep timing", img.clinch, "Reps: 12 12 10", 40, 2),
      drill("clinch-strike-camp-w1d1-e2", "Clinch pummel", img.mat2, "Reps: 8 8 8", 45, 0),
      drill("clinch-strike-camp-w1d1-e3", "Knee entries", img.mat3, "Reps: 8 8 8", 45, 1),
      drill("clinch-strike-camp-w1d1-e4", "Pad rounds", img.roll, "Rounds: 4 × 2 min", 60, 2),
    ],
  },
];

export const resumeItems = [
  {
    id: "mat-foundations-w1d1",
    title: "Foundation day · W1",
    progress: 0,
    thumbnailUrl: img.mat1,
  },
  {
    id: "passing-pressure-pro-w1d1",
    title: "Foundation day · W1",
    progress: 0,
    thumbnailUrl: img.gi,
  },
];

export const instructorPrograms = [
  {
    id: "mat-foundations",
    title: "Mat Foundations",
    coverUrl: img.mat1,
    current: true,
  },
  {
    id: "passing-pressure-pro",
    title: "Passing Pressure Pro",
    coverUrl: img.gi,
    current: true,
  },
  {
    id: "clinch-strike-camp",
    title: "Clinch & Strike Camp",
    coverUrl: img.clinch,
    current: true,
  },
];

export const programDays = [
  {
    id: "mat-foundations-w1d1",
    title: "Foundation day · W1",
    meta: "Day 1 - 50 Mins",
    thumb: img.mat1,
    rest: false,
  },
  {
    id: "mat-foundations-w1d2",
    title: "Pressure rounds · W1",
    meta: "Day 3 - 50 Mins",
    thumb: img.mat2,
    rest: false,
  },
  {
    id: "mat-foundations-w1d3",
    title: "Live application · W1",
    meta: "Day 5 - 50 Mins",
    thumb: img.mat3,
    rest: false,
  },
];

export const quotes = [
  {
    text: "A black belt is a white belt who never quit.",
    author: "UNKNOWN",
    imageUrl: img.gi,
  },
  {
    text: "Drill until the move shows up under pressure.",
    author: "RASHMAT",
    imageUrl: img.mat1,
  },
];

export const images = img;

export function getProgram(id: string) {
  return programs.find((p) => p.id === id);
}

export function getCreator(id: string) {
  return creators.find((c) => c.id === id);
}

export function getSession(id: string) {
  return sessions.find((s) => s.id === id);
}
