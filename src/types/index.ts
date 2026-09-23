export type Program = {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  weeks: number;
  daysPerWeek: number;
  minutes: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  tags: string[];
  creatorId: string;
  isPremium?: boolean;
  status?: "draft" | "published";
  creatorUserId?: string | null;
};

export type Creator = {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
  verified: boolean;
  socials: { instagram?: string; tiktok?: string; x?: string };
  programIds: string[];
};

export type WorkoutExercise = {
  id: string;
  name: string;
  thumbnailUrl: string;
  reps: string;
  /** Seconds of rest after each set */
  restSeconds?: number;
  /** Mux playback id → HLS via stream.mux.com */
  muxPlaybackId?: string;
  /** Direct MP4/HLS fallback when Mux is not set */
  videoUrl?: string;
};

export type WorkoutSession = {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  tags: string[];
  sets: number;
  exerciseCount: number;
  exercises: WorkoutExercise[];
  programId: string;
  day: number;
  minutes: number;
  muxPlaybackId?: string;
  videoUrl?: string;
};

export type UserProfile = {
  name: string;
  avatarUrl: string;
  city: string;
  country: string;
  membership: string;
  xp: number;
  age: number;
  weightKg: number;
  kcal: number;
};
