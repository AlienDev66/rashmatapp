export type AssessmentOption = {
  id: string;
  label: string;
  icon?: string;
};

export type AssessmentStep =
  | {
      id: string;
      type: "single";
      question: string;
      options: AssessmentOption[];
      skippable?: boolean;
    }
  | {
      id: string;
      type: "gender";
      question: string;
      skippable?: boolean;
    }
  | {
      id: string;
      type: "multi";
      question: string;
      options: AssessmentOption[];
      skippable?: boolean;
    }
  | {
      id: string;
      type: "number";
      question: string;
      unit: string;
      min: number;
      max: number;
      defaultValue: number;
      skippable?: boolean;
    };

export const ASSESSMENT_STEPS: AssessmentStep[] = [
  {
    id: "goal",
    type: "single",
    question: "What’s your goal on the mats?",
    options: [
      { id: "technique", label: "Sharpen technique", icon: "🎯" },
      { id: "compete", label: "Prep for competition", icon: "🏆" },
      { id: "fitness", label: "Conditioning for rolling", icon: "💨" },
      { id: "belt", label: "Level up toward next belt", icon: "🥋" },
      { id: "try", label: "Just exploring RASHMAT", icon: "📱" },
    ],
  },
  {
    id: "gender",
    type: "gender",
    question: "What’s your gender?",
    skippable: true,
  },
  {
    id: "age",
    type: "number",
    question: "How old are you?",
    unit: "years",
    min: 13,
    max: 80,
    defaultValue: 24,
    skippable: true,
  },
  {
    id: "weight",
    type: "number",
    question: "What’s your weight?",
    unit: "kg",
    min: 40,
    max: 180,
    defaultValue: 70,
    skippable: true,
  },
  {
    id: "height",
    type: "number",
    question: "What’s your height?",
    unit: "cm",
    min: 140,
    max: 220,
    defaultValue: 175,
    skippable: true,
  },
  {
    id: "level",
    type: "single",
    question: "What’s your training level?",
    options: [
      { id: "beginner", label: "White / beginner", icon: "🌱" },
      { id: "intermediate", label: "Blue–purple", icon: "🔥" },
      { id: "advanced", label: "Brown–black", icon: "⚡" },
      { id: "pro", label: "Competition / pro", icon: "🏆" },
    ],
  },
  {
    id: "sport",
    type: "multi",
    question: "Which arts do you train?",
    options: [
      { id: "bjj", label: "Brazilian Jiu-Jitsu", icon: "🥋" },
      { id: "nogi", label: "No-Gi / Submission", icon: "🤼" },
      { id: "mma", label: "MMA", icon: "🥊" },
      { id: "muay", label: "Muay Thai / striking", icon: "🦵" },
      { id: "wrestling", label: "Wrestling", icon: "💪" },
      { id: "other", label: "Other", icon: "✨" },
    ],
  },
  {
    id: "experience",
    type: "single",
    question: "How long have you been training?",
    options: [
      { id: "new", label: "Just starting", icon: "1️⃣" },
      { id: "months", label: "1–6 months", icon: "📆" },
      { id: "year", label: "6–24 months", icon: "🗓️" },
      { id: "years", label: "2+ years", icon: "⏳" },
    ],
  },
  {
    id: "equipment",
    type: "multi",
    question: "What gear do you have?",
    options: [
      { id: "gi", label: "Gi", icon: "🥋" },
      { id: "nogi", label: "Rashguard / shorts", icon: "👕" },
      { id: "mats", label: "Home mats", icon: "🟦" },
      { id: "pads", label: "Pads / bag", icon: "🥊" },
      { id: "academy", label: "Academy access", icon: "🏢" },
    ],
  },
  {
    id: "location",
    type: "single",
    question: "Where do you usually train?",
    options: [
      { id: "academy", label: "Academy / dojo", icon: "🥋" },
      { id: "home", label: "At home", icon: "🏠" },
      { id: "gym", label: "Gym", icon: "🏋️" },
      { id: "outdoors", label: "Outdoors", icon: "🌳" },
    ],
  },
  {
    id: "days",
    type: "single",
    question: "How many days per week can you train?",
    options: [
      { id: "2", label: "1–2 days", icon: "2️⃣" },
      { id: "3", label: "3 days", icon: "3️⃣" },
      { id: "4", label: "4 days", icon: "4️⃣" },
      { id: "5plus", label: "5+ days", icon: "5️⃣" },
    ],
  },
  {
    id: "duration",
    type: "single",
    question: "Preferred session length?",
    options: [
      { id: "20", label: "15–25 min", icon: "⏱️" },
      { id: "45", label: "30–45 min", icon: "⌛" },
      { id: "60", label: "45–60 min", icon: "🕐" },
      { id: "90", label: "60+ min", icon: "🕒" },
    ],
  },
  {
    id: "time",
    type: "single",
    question: "When do you prefer to train?",
    options: [
      { id: "morning", label: "Morning", icon: "🌅" },
      { id: "lunch", label: "Lunch break", icon: "☀️" },
      { id: "evening", label: "Evening", icon: "🌆" },
      { id: "night", label: "Night", icon: "🌙" },
      { id: "flex", label: "Flexible", icon: "🔄" },
    ],
  },
  {
    id: "focus",
    type: "single",
    question: "What should we prioritize first?",
    options: [
      { id: "technique", label: "Technique & detail", icon: "🎯" },
      { id: "live", label: "Live rounds / sparring", icon: "🔥" },
      { id: "conditioning", label: "Conditioning", icon: "💨" },
      { id: "recovery", label: "Recovery & mobility", icon: "🧘" },
    ],
  },
  {
    id: "injuries",
    type: "single",
    question: "Any current injuries or limits?",
    skippable: true,
    options: [
      { id: "none", label: "No limitations", icon: "✅" },
      { id: "shoulder", label: "Shoulders / arms", icon: "🦴" },
      { id: "back", label: "Back / neck", icon: "🧘" },
      { id: "knees", label: "Knees / legs", icon: "🦵" },
      { id: "other", label: "Something else", icon: "🩹" },
    ],
  },
  {
    id: "coach",
    type: "single",
    question: "How do you want to train on RASHMAT?",
    options: [
      { id: "creator", label: "Follow a creator program", icon: "⭐" },
      { id: "mix", label: "Mix of creators + structure", icon: "🔀" },
      { id: "explore", label: "Browse and pick sessions", icon: "🧭" },
    ],
  },
  {
    id: "notifications",
    type: "single",
    question: "Want training reminders?",
    options: [
      { id: "yes", label: "Yes, keep me on track", icon: "🔔" },
      { id: "light", label: "Only important ones", icon: "🔕" },
      { id: "no", label: "Not right now", icon: "🚫" },
    ],
  },
];

export const ASSESSMENT_TOTAL = ASSESSMENT_STEPS.length;
