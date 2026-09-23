/** Short form cues for the session player (AM-focused). */
export function tipForDrill(name: string, reps?: string | null): string {
  const n = name.toLowerCase();
  if (/teep|kick|pad|clinch|knee/.test(n)) {
    return "Stay light on the lead foot. Snap the strike, then recover your guard before the next rep.";
  }
  if (/pass|knee-cut|smash|torreando/.test(n)) {
    return "Head pressure first. Keep hips heavy and clear frames before you advance the pass.";
  }
  if (/guard|retain|shrimp|frame|hip/.test(n)) {
    return "Elbows tight, frames under the hips. Create space before you recover — don’t muscle it.";
  }
  if (/wrestle|takedown|snap|scramble|mat return/.test(n)) {
    return "Level change with a straight spine. Finish through the hips, not just the arms.";
  }
  if (/leg|ashi|heel|entangle/.test(n)) {
    return "Control the hip line before you attack the foot. Escape early if the reap looks illegal for your ruleset.";
  }
  if (/rounds?/i.test(reps ?? "")) {
    return "Treat each round like live: breathe on the break, reset posture, and hunt one clean sequence.";
  }
  return "Watch once slow, then match the tempo. Quality reps beat racing the clock.";
}
