export type AssessmentOption = {
  id: string;
  /** i18n key resolved by the assessment screen. */
  labelKey: string;
  icon?: string;
};

export type AssessmentStep =
  | {
      id: string;
      type: "single";
      questionKey: string;
      options: AssessmentOption[];
      skippable?: boolean;
    }
  | {
      id: string;
      type: "gender";
      questionKey: string;
      skippable?: boolean;
    }
  | {
      id: string;
      type: "multi";
      questionKey: string;
      options: AssessmentOption[];
      skippable?: boolean;
    }
  | {
      id: string;
      type: "number";
      questionKey: string;
      unitKey: string;
      min: number;
      max: number;
      defaultValue: number;
      skippable?: boolean;
    };

const opt = (step: string, id: string, icon?: string): AssessmentOption => ({
  id,
  labelKey: `assessment.opt.${step}.${id}`,
  icon,
});

/**
 * Production onboarding — short mat profile (not a 17-step quiz).
 * Kept step ids stable so any existing drafts still map.
 */
export const ASSESSMENT_STEPS: AssessmentStep[] = [
  {
    id: "goal",
    type: "single",
    questionKey: "assessment.q.goal",
    options: [
      opt("goal", "technique", "🎯"),
      opt("goal", "compete", "🏆"),
      opt("goal", "fitness", "💨"),
      opt("goal", "belt", "🥋"),
      opt("goal", "try", "📱"),
    ],
  },
  {
    id: "sport",
    type: "multi",
    questionKey: "assessment.q.sport",
    options: [
      opt("sport", "bjj", "🥋"),
      opt("sport", "nogi", "🤼"),
      opt("sport", "mma", "🥊"),
      opt("sport", "muay", "🦵"),
      opt("sport", "wrestling", "💪"),
      opt("sport", "other", "✨"),
    ],
  },
  {
    id: "level",
    type: "single",
    questionKey: "assessment.q.level",
    options: [
      opt("level", "beginner", "🌱"),
      opt("level", "intermediate", "🔥"),
      opt("level", "advanced", "⚡"),
      opt("level", "pro", "🏆"),
    ],
  },
  {
    id: "experience",
    type: "single",
    questionKey: "assessment.q.experience",
    options: [
      opt("experience", "new", "1️⃣"),
      opt("experience", "months", "📆"),
      opt("experience", "year", "🗓️"),
      opt("experience", "years", "⏳"),
    ],
  },
  {
    id: "days",
    type: "single",
    questionKey: "assessment.q.days",
    options: [
      opt("days", "2", "2️⃣"),
      opt("days", "3", "3️⃣"),
      opt("days", "4", "4️⃣"),
      opt("days", "5plus", "5️⃣"),
    ],
  },
  {
    id: "coach",
    type: "single",
    questionKey: "assessment.q.coach",
    options: [
      opt("coach", "creator", "⭐"),
      opt("coach", "mix", "🔀"),
      opt("coach", "explore", "🧭"),
    ],
  },
];

export const ASSESSMENT_TOTAL = ASSESSMENT_STEPS.length;
