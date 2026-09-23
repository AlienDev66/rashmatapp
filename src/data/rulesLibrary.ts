/**
 * RASHMAT Rules Library — athlete reference content (not creator CMS).
 * Summaries for training / competition prep. Official federation rulebooks win.
 */

export type SportId = "bjj" | "boxing";

export type FederationId =
  | "ibjjf"
  | "adcc"
  | "ajp"
  | "boxing-amateur"
  | "boxing-pro";

export type RuleSection = {
  heading: string;
  body?: string;
  bullets?: string[];
};

export type RuleGuide = {
  id: string;
  sport: SportId;
  federationId: FederationId;
  title: string;
  summary: string;
  tags: string[];
  /** Adult / juvenile / kids — for filters */
  audience: ("adult" | "juvenile" | "kids" | "all")[];
  sections: RuleSection[];
};

export type Federation = {
  id: FederationId;
  sport: SportId;
  name: string;
  shortName: string;
  blurb: string;
};

export type Sport = {
  id: SportId;
  title: string;
  subtitle: string;
  blurb: string;
};

export const sports: Sport[] = [
  {
    id: "bjj",
    title: "Brazilian Jiu-Jitsu",
    subtitle: "IBJJF · ADCC · AJP",
    blurb: "Gi and no-gi rulebooks by federation — divisions, time, scoring, and illegal techniques.",
  },
  {
    id: "boxing",
    title: "Boxing",
    subtitle: "Amateur · Pro",
    blurb: "Weight classes, rounds, fouls, and how bouts are scored.",
  },
];

export const federations: Federation[] = [
  {
    id: "ibjjf",
    sport: "bjj",
    name: "IBJJF",
    shortName: "IBJJF",
    blurb: "World standard for gi (and no-gi) sport BJJ — belts, ages, points.",
  },
  {
    id: "adcc",
    sport: "bjj",
    name: "ADCC",
    shortName: "ADCC",
    blurb: "Submission-first no-gi. Different scoring window and illegal list.",
  },
  {
    id: "ajp",
    sport: "bjj",
    name: "AJP / UAEJJF",
    shortName: "AJP",
    blurb: "Abu Dhabi circuit — distinct points and youth pathways.",
  },
  {
    id: "boxing-amateur",
    sport: "boxing",
    name: "Amateur boxing",
    shortName: "Amateur",
    blurb: "Olympic-style amateur: headgear rules vary by event; 10-point must.",
  },
  {
    id: "boxing-pro",
    sport: "boxing",
    name: "Professional boxing",
    shortName: "Pro",
    blurb: "Pro rounds, gloves, and commission-governed fouls.",
  },
];

export const guides: RuleGuide[] = [
  // ─── IBJJF ───────────────────────────────────────────────
  {
    id: "ibjjf-adult-divisions",
    sport: "bjj",
    federationId: "ibjjf",
    title: "Adult weight & age divisions",
    summary: "Adult / Master brackets and gi weight classes at a glance.",
    tags: ["Divisions", "Weight", "Adult"],
    audience: ["adult"],
    sections: [
      {
        heading: "Age brackets (adult+)",
        bullets: [
          "Adult: 18–29",
          "Master 1: 30–35 · Master 2: 36–40 · Master 3: 41–45",
          "Master 4: 46–50 · Master 5: 51–55 · Master 6: 56+",
          "You may sometimes enter a younger adult bracket if the event allows — check the bracket sheet.",
        ],
      },
      {
        heading: "Gi weight classes (adult male — approx.)",
        body: "Official cutoffs change by season. Treat these as orientation; verify the event packet.",
        bullets: [
          "Rooster → Light Feather → Feather → Light → Middle",
          "Medium Heavy → Heavy → Super Heavy → Ultra Heavy",
          "Open class / absolute: usually after weight divisions at majors",
        ],
      },
      {
        heading: "Gi weight classes (adult female — approx.)",
        bullets: [
          "Rooster → Light Feather → Feather → Light → Middle",
          "Medium Heavy → Heavy → Super Heavy",
          "Absolute / open where offered",
        ],
      },
      {
        heading: "Weigh-in tip",
        body: "Gi competitors weigh in with the gi on. Make weight in the gi you will compete in, or the same model/weight class allowance.",
      },
    ],
  },
  {
    id: "ibjjf-belts-match-time",
    sport: "bjj",
    federationId: "ibjjf",
    title: "Belts & match duration",
    summary: "How long adult gi matches run by belt.",
    tags: ["Belts", "Time", "Gi"],
    audience: ["adult"],
    sections: [
      {
        heading: "Adult gi match times (typical)",
        bullets: [
          "White: 5 minutes",
          "Blue: 6 minutes",
          "Purple: 7 minutes",
          "Brown: 8 minutes",
          "Black: 10 minutes",
        ],
      },
      {
        heading: "Notes",
        bullets: [
          "Juvenile and kids brackets use shorter times — see kids/juvenile guide.",
          "Finals can differ at some events; always confirm the day-of briefing.",
          "No-gi IBJJF events use their own time table — do not assume gi times.",
        ],
      },
    ],
  },
  {
    id: "ibjjf-scoring",
    sport: "bjj",
    federationId: "ibjjf",
    title: "Points, advantages & penalties",
    summary: "How IBJJF gi matches are decided when nobody submits.",
    tags: ["Scoring", "Points", "Gi"],
    audience: ["all"],
    sections: [
      {
        heading: "Points (gi)",
        bullets: [
          "4 — mount, back control (hooks / body triangle criteria)",
          "3 — guard pass",
          "2 — takedown, sweep, knee-on-belly",
        ],
      },
      {
        heading: "Advantages",
        body: "Near-misses and dominant attempts that don’t fully score. Used to break ties after points and before referee decision in many brackets.",
      },
      {
        heading: "Penalties",
        bullets: [
          "Stalling, fleeing the mat, illegal grips, and some technical fouls accumulate.",
          "Severe / intentional illegal techniques can mean DQ.",
        ],
      },
      {
        heading: "Priority when the clock ends",
        bullets: [
          "1) Submission",
          "2) Points",
          "3) Advantages",
          "4) Penalties (fewer is better)",
          "5) Referee decision",
        ],
      },
    ],
  },
  {
    id: "ibjjf-illegal-by-belt",
    sport: "bjj",
    federationId: "ibjjf",
    title: "Illegal techniques by belt",
    summary: "What opens up as you move white → black (gi). Always check the current IBJJF PDF.",
    tags: ["Illegal", "Belts", "Safety"],
    audience: ["adult", "juvenile"],
    sections: [
      {
        heading: "Mindset",
        body: "IBJJF restricts many neck cranks, reaping, and some leg locks until higher belts. Kids/juvenile lists are stricter. This is a training cheat-sheet — the published rulebook for your event year is law.",
      },
      {
        heading: "White belt (high level)",
        bullets: [
          "No heel hooks, knee bars, toe holds, or most twisting leg locks",
          "No spinal locks / neck cranks",
          "Slam escapes and certain wrist locks restricted",
          "Straight ankle locks often limited by age/belt — verify",
        ],
      },
      {
        heading: "Blue / purple",
        bullets: [
          "More lower-body attacks unlock vs white — still no heel hooks in classic gi IBJJF",
          "Knee reaping rules remain tightly enforced",
        ],
      },
      {
        heading: "Brown / black",
        bullets: [
          "Broader legal set for adults; heel hooks still typically illegal in IBJJF gi",
          "No-gi IBJJF has a separate illegal list — do not mix rule sets in your head",
        ],
      },
      {
        heading: "Always illegal (examples)",
        bullets: [
          "Small joint manipulation",
          "Eye gouging, fish hooks, strikes",
          "Slamming from guard to escape in many contexts",
        ],
      },
    ],
  },
  {
    id: "ibjjf-kids-juvenile",
    sport: "bjj",
    federationId: "ibjjf",
    title: "Kids & juvenile",
    summary: "Shorter matches, tighter illegal lists, age-banded brackets.",
    tags: ["Kids", "Juvenile", "Divisions"],
    audience: ["kids", "juvenile"],
    sections: [
      {
        heading: "What changes",
        bullets: [
          "Age bands (e.g. Mighty Mite → Juvenile) drive brackets more than belt alone",
          "Match times are shorter than adult",
          "Many submissions that adults use are banned for safety",
        ],
      },
      {
        heading: "Coach checklist",
        bullets: [
          "Confirm birth-year bracket on the registration sheet",
          "Brief athletes on legal vs illegal the night before — not on the mat warm-up",
          "Parents: weigh-in windows are strict; arrive early",
        ],
      },
    ],
  },

  // ─── ADCC ────────────────────────────────────────────────
  {
    id: "adcc-overview",
    sport: "bjj",
    federationId: "adcc",
    title: "ADCC ruleset overview",
    summary: "Submission-first no-gi. Scoring opens late; heels are part of the game.",
    tags: ["Overview", "No-Gi"],
    audience: ["adult"],
    sections: [
      {
        heading: "Philosophy",
        body: "ADCC rewards finishes. Early match minutes often have no points — force action toward submissions and late scoring.",
      },
      {
        heading: "Format (typical)",
        bullets: [
          "No-gi only",
          "Qualifiers and Super Fights can differ slightly in time — read the event sheet",
          "Negative points / penalties for passivity appear in some windows",
        ],
      },
      {
        heading: "Vs IBJJF no-gi",
        bullets: [
          "Heel hooks and many entanglements are expected at adult ADCC levels",
          "Points are not the same 2/3/4 IBJJF table",
          "Uniforms: rash guard + shorts; check branding rules for your event",
        ],
      },
    ],
  },
  {
    id: "adcc-weights",
    sport: "bjj",
    federationId: "adcc",
    title: "ADCC weight classes",
    summary: "Men’s and women’s divisions used at Worlds / trials (confirm year).",
    tags: ["Weight", "Divisions"],
    audience: ["adult"],
    sections: [
      {
        heading: "Men (common Worlds set)",
        bullets: [
          "-66 kg · -77 kg · -88 kg · -99 kg · +99 kg",
          "Absolute / open where offered",
        ],
      },
      {
        heading: "Women (common Worlds set)",
        bullets: [
          "-60 kg · -65 kg · +65 kg (and absolute where offered)",
          "Some trials expand intermediate classes — check registration",
        ],
      },
      {
        heading: "Weigh-in",
        body: "Usually without gi (no-gi attire). Hydration cuts are culturally common — train the cut; don’t invent it the morning of.",
      },
    ],
  },
  {
    id: "adcc-scoring-illegal",
    sport: "bjj",
    federationId: "adcc",
    title: "Scoring window & illegal list",
    summary: "When points start, what scores, and what still gets you DQ’d.",
    tags: ["Scoring", "Illegal"],
    audience: ["adult"],
    sections: [
      {
        heading: "Scoring window",
        body: "Many ADCC matches award no points in the opening period, then open scoring later. Exact minutes depend on bracket stage — memorize the briefing for your tournament year.",
      },
      {
        heading: "What tends to score",
        bullets: [
          "Positional dominance and takedowns in the scoring window",
          "Passivity can cost you via negatives / referee pressure",
        ],
      },
      {
        heading: "Illegal / restricted",
        bullets: [
          "Spine locks, small joints, eye gouges, strikes — still out",
          "Some neck cranks / can openers restricted depending on year",
          "Youth ADCC-style events may ban heel hooks even if adult ADCC allows them",
        ],
      },
    ],
  },

  // ─── AJP ─────────────────────────────────────────────────
  {
    id: "ajp-overview",
    sport: "bjj",
    federationId: "ajp",
    title: "AJP ruleset overview",
    summary: "Abu Dhabi Jiu-Jitsu Pro circuit — points culture differs from IBJJF.",
    tags: ["Overview", "Gi", "No-Gi"],
    audience: ["all"],
    sections: [
      {
        heading: "Where it sits",
        body: "AJP / UAEJJF tournaments run globally with their own scoring and youth pathways. Do not assume IBJJF points mid-match.",
      },
      {
        heading: "Athlete habits that transfer",
        bullets: [
          "Guard retention under points pressure",
          "Clean takedowns that stick",
          "Knowing when a ‘near pass’ is an advantage vs nothing",
        ],
      },
    ],
  },
  {
    id: "ajp-divisions-scoring",
    sport: "bjj",
    federationId: "ajp",
    title: "Divisions & scoring differences",
    summary: "Weight bands, youth lanes, and how AJP decisions feel different.",
    tags: ["Divisions", "Scoring", "Youth"],
    audience: ["adult", "juvenile", "kids"],
    sections: [
      {
        heading: "Divisions",
        bullets: [
          "Age + weight + belt (or experience) bands — registration portal is source of truth",
          "Strong kids / juvenile ecosystems at many Grand Slams",
        ],
      },
      {
        heading: "Scoring culture",
        bullets: [
          "Point values and advantage logic are not 1:1 with IBJJF",
          "Some positions that ‘feel like 2’ in IBJJF may score differently — drill under AJP rules before a Grand Slam",
        ],
      },
      {
        heading: "Prep tip",
        body: "Watch one recent AJP final in your weight the week before. Rules click faster on video than on a PDF at 6am.",
      },
    ],
  },

  // ─── Boxing amateur ──────────────────────────────────────
  {
    id: "boxing-amateur-weights",
    sport: "boxing",
    federationId: "boxing-amateur",
    title: "Amateur weight classes",
    summary: "Olympic-style categories — names vary by federation year.",
    tags: ["Weight", "Divisions"],
    audience: ["adult", "juvenile"],
    sections: [
      {
        heading: "How to read a bracket",
        body: "Amateur federations rename classes (fly, bantam, light, welter…). Always use the kg number on your entry form, not the nickname from another country.",
      },
      {
        heading: "Typical adult ladder (orientation)",
        bullets: [
          "Lightest → fly / bantam bands",
          "Light → welter → middle",
          "Light heavy → heavy → super heavy",
        ],
      },
      {
        heading: "Youth",
        bullets: [
          "Schoolboy / junior / youth bands use different kg cuts",
          "Coaches: double-check birth year eligibility before paying entry",
        ],
      },
    ],
  },
  {
    id: "boxing-amateur-rounds-scoring",
    sport: "boxing",
    federationId: "boxing-amateur",
    title: "Rounds, headgear & scoring",
    summary: "Bout length and the 10-point must system.",
    tags: ["Rounds", "Scoring"],
    audience: ["adult", "juvenile"],
    sections: [
      {
        heading: "Rounds",
        bullets: [
          "Men’s elite often 3×3 min (event-dependent)",
          "Women’s and youth formats differ — read the tech sheet",
          "Rest between rounds is typically 1 minute",
        ],
      },
      {
        heading: "Headgear",
        body: "Some elite open-head tournaments removed headgear; many domestic / youth shows still require it. Pack both assumptions until the briefing says otherwise.",
      },
      {
        heading: "10-point must",
        bullets: [
          "Winner of the round gets 10; loser 9 or less",
          "Deductions for fouls",
          "Judges score effective aggression, defense, and clean punching — not just volume",
        ],
      },
    ],
  },
  {
    id: "boxing-amateur-fouls",
    sport: "boxing",
    federationId: "boxing-amateur",
    title: "Fouls & illegal blows",
    summary: "What gets warned, deducted, or DQ’d.",
    tags: ["Fouls", "Safety"],
    audience: ["all"],
    sections: [
      {
        heading: "Common fouls",
        bullets: [
          "Hitting below the belt",
          "Holding and hitting, hitting on the break",
          "Kidney / back of head (rabbit punch)",
          "Headbutts, elbowing, tripping",
          "Hitting a downed opponent",
        ],
      },
      {
        heading: "Referee language",
        bullets: [
          "Warning → point deduction → DQ ladder",
          "Intentional vs accidental clash — clinch resets differ by ref style; stay under control",
        ],
      },
    ],
  },

  // ─── Boxing pro ──────────────────────────────────────────
  {
    id: "boxing-pro-overview",
    sport: "boxing",
    federationId: "boxing-pro",
    title: "Pro bout structure",
    summary: "Rounds, gloves, and commission basics.",
    tags: ["Rounds", "Pro"],
    audience: ["adult"],
    sections: [
      {
        heading: "Rounds",
        bullets: [
          "Men’s championship distance often 12×3 min",
          "Non-title and women’s bouts commonly 4–10 rounds",
          "1 minute rest between rounds",
        ],
      },
      {
        heading: "Gloves & wrap",
        body: "Commission rules set glove oz by weight class. Hand wraps are inspected — don’t freestyle tape jobs on fight night.",
      },
      {
        heading: "Who governs",
        body: "State / national commissions + sanctioning bodies (WBA, WBC, IBF, WBO…) set title rules. Gym sparring rules ≠ fight night rules.",
      },
    ],
  },
  {
    id: "boxing-pro-scoring-fouls",
    sport: "boxing",
    federationId: "boxing-pro",
    title: "Pro scoring & fouls",
    summary: "Same 10-point must DNA — higher stakes on deductions.",
    tags: ["Scoring", "Fouls"],
    audience: ["adult"],
    sections: [
      {
        heading: "Scoring",
        bullets: [
          "10-point must remains the global default",
          "Knockdowns usually cost the round heavily",
          "Close rounds reward the cleaner, more effective boxer — not always the busier one",
        ],
      },
      {
        heading: "Fouls that end nights",
        bullets: [
          "Low blows, headbutts, bites, eye gouges",
          "Hitting after the bell / on a break",
          "Intentionally spitting mouthpiece",
        ],
      },
    ],
  },
];

export function getSport(id: string) {
  return sports.find((s) => s.id === id) ?? null;
}

export function getFederation(id: string) {
  return federations.find((f) => f.id === id) ?? null;
}

export function getGuide(id: string) {
  return guides.find((g) => g.id === id) ?? null;
}

export function federationsForSport(sportId: SportId) {
  return federations.filter((f) => f.sport === sportId);
}

export function guidesForFederation(federationId: FederationId) {
  return guides.filter((g) => g.federationId === federationId);
}

export function guidesForSport(sportId: SportId) {
  return guides.filter((g) => g.sport === sportId);
}

export function searchGuides(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return guides;
  return guides.filter((g) => {
    const hay = [g.title, g.summary, g.tags.join(" "), g.federationId, g.sport].join(" ").toLowerCase();
    return hay.includes(q);
  });
}
