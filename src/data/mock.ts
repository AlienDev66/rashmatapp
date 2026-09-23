import type { Creator, Program, UserProfile, WorkoutSession } from "@/src/types";
import { brand } from "@/src/lib/brand";

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
};

const sampleVideo = {
  a: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  b: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  c: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
};

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
    id: "domingos",
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
    programIds: ["guard", "nogi-pressure"],
  },
  {
    id: "mica",
    name: "MICA GALVÃO",
    role: "BJJ World Champion",
    bio: "Competition-first systems: blue belt fundamentals through ADCC-style no-gi intensity.",
    avatarUrl: img.roll,
    coverUrl: img.mat1,
    verified: true,
    socials: {
      instagram: brand.social.instagram,
      tiktok: brand.social.tiktok,
      x: brand.social.x,
    },
    programIds: ["blue-belt", "adcc"],
  },
  {
    id: "sofia",
    name: "SOFIA REIS",
    role: "Muay Thai Coach",
    bio: "Clinch, kicks, and pad work for strikers who want structured camps—not random bag rounds.",
    avatarUrl: img.woman,
    coverUrl: img.clinch,
    verified: true,
    socials: {
      instagram: brand.social.instagram,
      tiktok: brand.social.tiktok,
    },
    programIds: ["clinch-camp"],
  },
];

export const programs: Program[] = [
  {
    id: "blue-belt",
    title: "4 WEEKS TO BLUE BELT",
    description:
      "Gi fundamentals: closed guard, mount escapes, and positional sparring with a clear weekly cadence.",
    coverUrl: img.mat1,
    weeks: 4,
    daysPerWeek: 3,
    minutes: 60,
    level: "Beginner",
    tags: ["BJJ", "Gi", "Fundamentals"],
    creatorId: "mica",
  },
  {
    id: "adcc",
    title: "ADCC COMPETITION PREP",
    description:
      "No-gi chains, wrestling entries, and high-output rounds built for tournament week.",
    coverUrl: img.mat2,
    weeks: 6,
    daysPerWeek: 4,
    minutes: 75,
    level: "Advanced",
    tags: ["Competition", "No-Gi", "ADCC"],
    creatorId: "mica",
    isPremium: true,
  },
  {
    id: "guard",
    title: "GUARD PASS PRESSURE",
    description:
      "Knee-cut, smash pass, and retention counters. Drill → live → reflect.",
    coverUrl: img.mat3,
    weeks: 3,
    daysPerWeek: 3,
    minutes: 45,
    level: "Intermediate",
    tags: ["Guard", "Passing", "BJJ"],
    creatorId: "domingos",
  },
  {
    id: "nogi-pressure",
    title: "NO-GI TOP CONTROL",
    description:
      "Body locks, north-south, and pin transitions for no-gi top game.",
    coverUrl: img.gi,
    weeks: 4,
    daysPerWeek: 3,
    minutes: 50,
    level: "Intermediate",
    tags: ["No-Gi", "Control", "Pins"],
    creatorId: "domingos",
  },
  {
    id: "clinch-camp",
    title: "CLINCH & KICK CAMP",
    description:
      "Muay Thai clinch entries, knees, and teep timing over a 4-week camp.",
    coverUrl: img.clinch,
    weeks: 4,
    daysPerWeek: 3,
    minutes: 55,
    level: "Intermediate",
    tags: ["Muay Thai", "Clinch", "Striking"],
    creatorId: "sofia",
  },
];

function drill(
  id: string,
  name: string,
  thumb: string,
  reps: string,
  restSeconds: number,
  video: string,
) {
  return { id, name, thumbnailUrl: thumb, reps, restSeconds, videoUrl: video };
}

export const sessions: WorkoutSession[] = [
  // —— Blue belt week 1
  {
    id: "bb-d1",
    title: "CLOSED GUARD BASICS",
    description: "Break grips, hip escape, and recover closed guard under light pressure.",
    coverUrl: img.mat1,
    tags: ["Gi", "Guard", "Fundamentals"],
    sets: 12,
    exerciseCount: 4,
    programId: "blue-belt",
    day: 1,
    minutes: 55,
    videoUrl: sampleVideo.a,
    exercises: [
      drill("bb-d1-e1", "Hip escape to closed guard", img.mat1, "Reps: 8 8 8", 45, sampleVideo.a),
      drill("bb-d1-e2", "Collar grip break", img.mat2, "Reps: 10 10 10", 40, sampleVideo.b),
      drill("bb-d1-e3", "Armbar from closed guard", img.gi, "Reps: 6 6 6", 60, sampleVideo.c),
      drill("bb-d1-e4", "Positional rounds — closed guard", img.roll, "Rounds: 3 × 3 min", 90, sampleVideo.a),
    ],
  },
  {
    id: "bb-d2",
    title: "MOUNT ESCAPES",
    description: "Elbow-knee escape and frame under mount. Live starting from bottom mount.",
    coverUrl: img.mat2,
    tags: ["Gi", "Escapes"],
    sets: 10,
    exerciseCount: 3,
    programId: "blue-belt",
    day: 2,
    minutes: 50,
    videoUrl: sampleVideo.b,
    exercises: [
      drill("bb-d2-e1", "Elbow-knee escape", img.mat2, "Reps: 8 8 8", 50, sampleVideo.b),
      drill("bb-d2-e2", "Trap and roll", img.mat3, "Reps: 6 6 6", 50, sampleVideo.c),
      drill("bb-d2-e3", "Live — start in mount", img.roll, "Rounds: 4 × 2 min", 60, sampleVideo.a),
    ],
  },
  {
    id: "bb-d3",
    title: "SIDE CONTROL FRAMES",
    description: "Frames, shrimp, and recover half guard from side control.",
    coverUrl: img.mat3,
    tags: ["Gi", "Frames"],
    sets: 11,
    exerciseCount: 3,
    programId: "blue-belt",
    day: 4,
    minutes: 55,
    videoUrl: sampleVideo.c,
    exercises: [
      drill("bb-d3-e1", "Underhook shrimp escape", img.mat3, "Reps: 8 8 8", 45, sampleVideo.c),
      drill("bb-d3-e2", "Recover half guard", img.gi, "Reps: 6 6 6", 50, sampleVideo.a),
      drill("bb-d3-e3", "Positional sparring — side", img.roll, "Rounds: 3 × 3 min", 90, sampleVideo.b),
    ],
  },
  {
    id: "bb-d4",
    title: "PASSING INTRO",
    description: "Toreando and knee-cut entries with focus on posture.",
    coverUrl: img.gi,
    tags: ["Gi", "Passing"],
    sets: 12,
    exerciseCount: 4,
    programId: "blue-belt",
    day: 5,
    minutes: 60,
    videoUrl: sampleVideo.a,
    exercises: [
      drill("bb-d4-e1", "Toreando footwork", img.gi, "Reps: 10 10 8", 40, sampleVideo.a),
      drill("bb-d4-e2", "Knee-cut entry", img.mat1, "Reps: 8 8 8", 50, sampleVideo.b),
      drill("bb-d4-e3", "Pass to side control", img.mat2, "Reps: 6 6 6", 55, sampleVideo.c),
      drill("bb-d4-e4", "Live passing rounds", img.roll, "Rounds: 4 × 2 min", 60, sampleVideo.a),
    ],
  },
  // —— Guard pass program
  {
    id: "day-1-guard",
    title: "KNEE-CUT PRESSURE",
    description: "Build the knee-cut with head pressure and hip connection.",
    coverUrl: img.mat1,
    tags: ["Passing", "Pressure"],
    sets: 14,
    exerciseCount: 4,
    programId: "guard",
    day: 1,
    minutes: 45,
    videoUrl: sampleVideo.a,
    exercises: [
      drill("e1", "Knee-cut setup from standing", img.mat1, "Reps: 8 8 8", 45, sampleVideo.a),
      drill("e2", "Head pressure + underhook", img.mat2, "Reps: 8 8 8", 45, sampleVideo.b),
      drill("e3", "Finish to mount / side", img.mat3, "Reps: 6 6 6", 50, sampleVideo.c),
      drill("e4", "Live — pass vs retain", img.roll, "Rounds: 5 × 2 min", 60, sampleVideo.a),
    ],
  },
  {
    id: "gp-d2",
    title: "SMASH PASS DAY",
    description: "Over-under and body lock smash entries.",
    coverUrl: img.mat2,
    tags: ["Passing", "Smash"],
    sets: 12,
    exerciseCount: 3,
    programId: "guard",
    day: 3,
    minutes: 45,
    videoUrl: sampleVideo.b,
    exercises: [
      drill("gp-d2-e1", "Over-under smash", img.mat2, "Reps: 8 8 8", 50, sampleVideo.b),
      drill("gp-d2-e2", "Body lock pass", img.gi, "Reps: 6 6 6", 55, sampleVideo.c),
      drill("gp-d2-e3", "Positional rounds", img.roll, "Rounds: 4 × 3 min", 75, sampleVideo.a),
    ],
  },
  {
    id: "gp-d3",
    title: "RETENTION COUNTERS",
    description: "When they recover — re-engage and clear frames.",
    coverUrl: img.mat3,
    tags: ["Retention", "Passing"],
    sets: 10,
    exerciseCount: 3,
    programId: "guard",
    day: 5,
    minutes: 40,
    videoUrl: sampleVideo.c,
    exercises: [
      drill("gp-d3-e1", "Clear frames to knee-cut", img.mat3, "Reps: 8 8 8", 45, sampleVideo.c),
      drill("gp-d3-e2", "Long-step when they invert", img.mat1, "Reps: 6 6 6", 50, sampleVideo.a),
      drill("gp-d3-e3", "Live rolling focus", img.roll, "Rounds: 3 × 4 min", 90, sampleVideo.b),
    ],
  },
  // —— ADCC
  {
    id: "adcc-d1",
    title: "WRESTLING ENTRIES",
    description: "Shot setups, level changes, and finish to body lock.",
    coverUrl: img.mat2,
    tags: ["Wrestling", "No-Gi"],
    sets: 15,
    exerciseCount: 4,
    programId: "adcc",
    day: 1,
    minutes: 70,
    videoUrl: sampleVideo.a,
    exercises: [
      drill("adcc-d1-e1", "Penetration step drill", img.mat2, "Reps: 10 10 10", 40, sampleVideo.a),
      drill("adcc-d1-e2", "High crotch to body lock", img.clinch, "Reps: 8 8 8", 50, sampleVideo.b),
      drill("adcc-d1-e3", "Mat return control", img.gi, "Reps: 6 6 6", 55, sampleVideo.c),
      drill("adcc-d1-e4", "Live wrestling rounds", img.roll, "Rounds: 5 × 3 min", 75, sampleVideo.a),
    ],
  },
  {
    id: "adcc-d2",
    title: "LEG ENTANGLEMENT INTRO",
    description: "Inside sankaku entries and safe exits.",
    coverUrl: img.mat3,
    tags: ["Legs", "No-Gi"],
    sets: 12,
    exerciseCount: 3,
    programId: "adcc",
    day: 2,
    minutes: 65,
    videoUrl: sampleVideo.b,
    exercises: [
      drill("adcc-d2-e1", "Ashi entry from scramble", img.mat3, "Reps: 8 8 8", 50, sampleVideo.b),
      drill("adcc-d2-e2", "Heel exposure drill", img.mat1, "Reps: 6 6 6", 55, sampleVideo.c),
      drill("adcc-d2-e3", "Positional — legs", img.roll, "Rounds: 4 × 3 min", 75, sampleVideo.a),
    ],
  },
  // —— Clinch camp
  {
    id: "mt-d1",
    title: "CLINCH ENTRIES",
    description: "Collar ties, plum, and off-balancing before knees.",
    coverUrl: img.clinch,
    tags: ["Muay Thai", "Clinch"],
    sets: 12,
    exerciseCount: 4,
    programId: "clinch-camp",
    day: 1,
    minutes: 50,
    videoUrl: sampleVideo.a,
    exercises: [
      drill("mt-d1-e1", "Double collar tie", img.clinch, "Reps: 10 10 10", 40, sampleVideo.a),
      drill("mt-d1-e2", "Plum grip peels", img.mat2, "Reps: 8 8 8", 45, sampleVideo.b),
      drill("mt-d1-e3", "Knee on the break", img.mat3, "Reps: 8 8 8", 45, sampleVideo.c),
      drill("mt-d1-e4", "Clinch rounds", img.roll, "Rounds: 4 × 2 min", 60, sampleVideo.a),
    ],
  },
  {
    id: "mt-d2",
    title: "TEEP & KICK TIMING",
    description: "Teep to create space, round kick behind the jab.",
    coverUrl: img.mat1,
    tags: ["Muay Thai", "Kicks"],
    sets: 14,
    exerciseCount: 3,
    programId: "clinch-camp",
    day: 3,
    minutes: 55,
    videoUrl: sampleVideo.b,
    exercises: [
      drill("mt-d2-e1", "Rear teep on pads", img.mat1, "Reps: 12 12 10", 40, sampleVideo.b),
      drill("mt-d2-e2", "Round kick after jab", img.clinch, "Reps: 10 10 8", 45, sampleVideo.c),
      drill("mt-d2-e3", "Pad rounds", img.roll, "Rounds: 5 × 3 min", 60, sampleVideo.a),
    ],
  },
  // —— No-gi pressure
  {
    id: "ng-d1",
    title: "BODY LOCK DAY",
    description: "Seatbelt to body lock and mat returns.",
    coverUrl: img.gi,
    tags: ["No-Gi", "Control"],
    sets: 11,
    exerciseCount: 3,
    programId: "nogi-pressure",
    day: 1,
    minutes: 50,
    videoUrl: sampleVideo.c,
    exercises: [
      drill("ng-d1-e1", "Seatbelt to body lock", img.gi, "Reps: 8 8 8", 50, sampleVideo.c),
      drill("ng-d1-e2", "Mat return to mount", img.mat2, "Reps: 6 6 6", 55, sampleVideo.a),
      drill("ng-d1-e3", "Live top control", img.roll, "Rounds: 4 × 3 min", 75, sampleVideo.b),
    ],
  },
];

export const resumeItems = [
  {
    id: "day-1-guard",
    title: "Knee-cut pressure",
    progress: 0,
    thumbnailUrl: img.mat1,
  },
  {
    id: "bb-d1",
    title: "Closed guard basics",
    progress: 0,
    thumbnailUrl: img.mat2,
  },
];

export const instructorPrograms = [
  { id: "guard", title: "Guard Pass Pressure", coverUrl: img.mat3, current: true },
  { id: "blue-belt", title: "4 Weeks to Blue Belt", coverUrl: img.mat1, current: true },
  { id: "clinch-camp", title: "Clinch & Kick Camp", coverUrl: img.clinch, current: true },
];

export const programDays = [
  { id: "day-1-guard", title: "Knee-cut pressure", meta: "Day 1 - 45 Mins", thumb: img.mat1, rest: false },
  { id: "gp-d2", title: "Smash pass day", meta: "Day 3 - 45 Mins", thumb: img.mat2, rest: false },
  { id: "gp-d3", title: "Retention counters", meta: "Day 5 - 40 Mins", thumb: img.mat3, rest: false },
  { id: "rest", title: "Rest Day", meta: "Day 2", thumb: "", rest: true },
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
