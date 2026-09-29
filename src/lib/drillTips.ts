/** Short form cues for the session player (AM-focused). Returns an i18n key. */
export function tipKeyForDrill(name: string, reps?: string | null): string {
  const n = name.toLowerCase();
  if (/teep|kick|pad|clinch|knee/.test(n)) return "drillTips.striking";
  if (/pass|knee-cut|smash|torreando/.test(n)) return "drillTips.passing";
  if (/guard|retain|shrimp|frame|hip/.test(n)) return "drillTips.guard";
  if (/wrestle|takedown|snap|scramble|mat return/.test(n)) return "drillTips.wrestling";
  if (/leg|ashi|heel|entangle/.test(n)) return "drillTips.legs";
  if (/rounds?/i.test(reps ?? "")) return "drillTips.rounds";
  return "drillTips.default";
}
