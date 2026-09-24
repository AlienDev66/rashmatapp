import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const root = new URL("..", import.meta.url).pathname;

const SOURCES = [
  ["src/i18n/messages.ts", "const en =", "const pt"],
  ["src/i18n/catalog.ts", "const en =", "const pt"],
  ["src/i18n/catalog2.ts", "const en =", "const pt"],
  ["src/i18n/catalog3.ts", "const en =", "const pt"],
];

function sliceObject(text, startMarker) {
  const start = text.indexOf(startMarker);
  if (start < 0) return null;
  const i = text.indexOf("{", start);
  let depth = 0;
  for (let j = i; j < text.length; j++) {
    if (text[j] === "{") depth++;
    else if (text[j] === "}") {
      depth--;
      if (depth === 0) return text.slice(i, j + 1);
    }
  }
  return null;
}

function keysOf(objText) {
  const keys = new Set();
  const path = [];
  for (const line of objText.split("\n")) {
    const open = line.match(/^\s*([A-Za-z0-9_]+):\s*\{\s*$/);
    if (open) {
      path.push(open[1]);
      continue;
    }
    if (/^\s*\},?\s*$/.test(line)) {
      path.pop();
      continue;
    }
    const leaf = line.match(/^\s*([A-Za-z0-9_]+):\s*(?:"|'|`|$)/);
    if (leaf) keys.add([...path, leaf[1]].join("."));
  }
  return keys;
}

const en = new Set();
const pt = new Set();
for (const [file, enMarker, ptMarker] of SOURCES) {
  if (!existsSync(root + file)) continue;
  const text = readFileSync(root + file, "utf8");
  const enObj = sliceObject(text, enMarker);
  const ptObj = sliceObject(text, ptMarker);
  if (enObj) for (const k of keysOf(enObj)) en.add(k);
  if (ptObj) for (const k of keysOf(ptObj)) pt.add(k);
}

const grep = execSync(
  `rg -o --no-filename 't\\("([a-zA-Z0-9_]+(?:\\.[a-zA-Z0-9_]+)+)"' -r '$1' app src`,
  { cwd: root, encoding: "utf8" },
);
const used = new Set(grep.split("\n").filter(Boolean));

const report = (label, list) =>
  console.log(`\n${label} (${list.length})${list.length ? "\n  " + list.join("\n  ") : ""}`);

report("USED BUT MISSING IN EN", [...used].filter((k) => !en.has(k)).sort());
report("USED BUT MISSING IN PT", [...used].filter((k) => !pt.has(k)).sort());
report("IN EN BUT NOT PT", [...en].filter((k) => !pt.has(k)).sort());
report("IN PT BUT NOT EN", [...pt].filter((k) => !en.has(k)).sort());
