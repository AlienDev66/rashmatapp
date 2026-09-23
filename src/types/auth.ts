import type { Database } from "@/src/types/database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type AssessmentAnswers = Record<string, string | string[] | number>;
