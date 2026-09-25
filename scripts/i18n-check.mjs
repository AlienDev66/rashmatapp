/** Verifies every t("…") key exists in both locales and that en/pt stay in sync. */
import { execSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const root = new URL("..", import.meta.url).pathname;
const { messages } = await import(pathToFileURL(root + "src/i18n/messages.ts"));

function flatten(dict, path = [], out = new Set()) {
  for (const [k, v] of Object.entries(dict)) {
    if (v && typeof v === "object") flatten(v, [...path, k], out);
    else out.add([...path, k].join("."));
  }
  return out;
}

const en = flatten(messages.en);
const pt = flatten(messages.pt);

const grep = execSync(
  `rg -o --no-filename 't\\("([a-zA-Z0-9_]+(?:\\.[a-zA-Z0-9_]+)+)"' -r '$1' app src`,
  { cwd: root, encoding: "utf8" },
);
const used = new Set(grep.split("\n").filter(Boolean));

// Keys built at runtime, e.g. t(`goals.${id}`) or t(step.questionKey).
const dynamic = execSync(
  `rg -o --no-filename '"((?:assessment|medals|drillTips|goals|extra|state)\\.[a-zA-Z0-9_.]+)"' -r '$1' app src --glob '!src/i18n/**'`,
  { cwd: root, encoding: "utf8" },
);
for (const k of dynamic.split("\n").filter(Boolean)) used.add(k);

const report = (label, list) =>
  console.log(`${label}: ${list.length}${list.length ? "\n  " + list.join("\n  ") : ""}`);

const prefixOk = (set, k) => set.has(k) || [...set].some((x) => x.startsWith(k + "."));

report("used but missing in EN", [...used].filter((k) => !prefixOk(en, k)).sort());
report("used but missing in PT", [...used].filter((k) => !prefixOk(pt, k)).sort());
report("in EN but not PT", [...en].filter((k) => !pt.has(k)).sort());
report("in PT but not EN", [...pt].filter((k) => !en.has(k)).sort());
console.log(`total keys: en=${en.size} pt=${pt.size}`);
