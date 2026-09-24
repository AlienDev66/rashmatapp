/** Deep-merge message trees (later catalogs override earlier). */
export function deepMergeMessages(
  ...parts: Record<string, unknown>[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const part of parts) {
    for (const [k, v] of Object.entries(part)) {
      if (
        v &&
        typeof v === "object" &&
        !Array.isArray(v) &&
        out[k] &&
        typeof out[k] === "object" &&
        !Array.isArray(out[k])
      ) {
        out[k] = deepMergeMessages(
          out[k] as Record<string, unknown>,
          v as Record<string, unknown>,
        );
      } else {
        out[k] = v;
      }
    }
  }
  return out;
}
