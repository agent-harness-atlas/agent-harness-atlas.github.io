#!/usr/bin/env node
// F02 @grounding: structural validation that analysis/*.json is well-formed and
// genuinely grounded (no "evidence pending" placeholders). Data-SHAPE gate.
// (Citation REALITY against disk = F06 @citations; score-sync = F05 @scoresync.)
import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DIMS = ["memory", "context", "skill", "cost", "sandbox", "multiagent"];
const EXPECTED = ["claude-code", "codex", "pi", "opencode", "cursor", "aider", "cline", "gemini-cli"];
// Detect TRUE placeholder text only. Anchored / word-bounded so legitimate
// technical prose (e.g. the tool name `todowrite`, or describing a `{previous}`
// placeholder syntax) is NOT falsely flagged. These patterns mean "this cell was
// never filled with real analysis".
const PLACEHOLDER = [
  /证据待填/,
  /\bevidence pending\b/i,
  /待补充|待确认厂商|内容待填|结论待填/,
  /\blorem ipsum\b/i,
  /^\s*(—|-|TBD|TODO|N\/?A|\?+)\s*$/i, // a cell whose ENTIRE text is a dash/TBD/N/A
];
const isPlaceholder = (s) => PLACEHOLDER.some((re) => re.test(s));

const problems = [];
const dir = resolve(ROOT, "analysis");
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
const ids = files.map((f) => f.replace(/\.json$/, "")).sort();
if (ids.join(",") !== [...EXPECTED].sort().join(",")) {
  problems.push(`agent set mismatch: have [${ids}] want [${[...EXPECTED].sort()}]`);
}

for (const f of files) {
  const id = f.replace(/\.json$/, "");
  let d;
  try {
    d = JSON.parse(readFileSync(resolve(dir, f), "utf8"));
  } catch (e) {
    problems.push(`${f}: invalid JSON — ${e.message}`);
    continue;
  }
  if (d.id !== id) problems.push(`${f}: id "${d.id}" != filename`);
  for (const k of ["name", "vendor", "lang"]) if (!d[k]?.toString().trim()) problems.push(`${id}: empty ${k}`);
  if (!["source", "docs"].includes(d.evidenceBasis)) problems.push(`${id}: bad evidenceBasis ${d.evidenceBasis}`);
  if (!d.verdict?.zh?.trim() || !d.verdict?.en?.trim()) problems.push(`${id}: empty verdict zh/en`);

  if (d.evidenceBasis === "docs") {
    if (!d.evidenceNote?.zh?.trim() || !d.evidenceNote?.en?.trim()) problems.push(`${id}: docs basis needs evidenceNote{zh,en}`);
    if (d.repo !== null && d.repo !== undefined && d.repo !== "") problems.push(`${id}: docs basis should have repo=null`);
  } else {
    if (!d.repo?.trim()) problems.push(`${id}: source basis needs repo`);
  }

  const cellKeys = Object.keys(d.cells || {}).sort();
  if (cellKeys.join(",") !== [...DIMS].sort().join(",")) problems.push(`${id}: cells keys [${cellKeys}] != 6 dims`);

  for (const dim of DIMS) {
    const c = d.cells?.[dim];
    if (!c) continue;
    if (c.score !== null && (typeof c.score !== "number" || c.score < 1 || c.score > 100))
      problems.push(`${id}.${dim}: score ${c.score} not null|int1-100`);
    for (const fld of ["zh", "en"]) {
      if (!c[fld]?.trim()) problems.push(`${id}.${dim}: empty ${fld}`);
      else if (isPlaceholder(c[fld])) problems.push(`${id}.${dim}.${fld}: placeholder text "${c[fld].slice(0, 30)}…"`);
    }
    for (const kf of ["keep", "fix"]) {
      if (!c[kf]?.zh?.trim() || !c[kf]?.en?.trim()) problems.push(`${id}.${dim}.${kf}: empty zh/en`);
    }
    if (!Array.isArray(c.citations) || c.citations.length === 0) problems.push(`${id}.${dim}: no citations`);
    else {
      for (const cit of c.citations) {
        if (d.evidenceBasis === "docs" && !/^https?:\/\//.test(cit)) problems.push(`${id}.${dim}: docs citation not URL: ${cit}`);
        if (d.evidenceBasis === "source" && /^https?:\/\//.test(cit)) problems.push(`${id}.${dim}: source citation is URL (should be repo path): ${cit}`);
      }
    }
  }
}

if (problems.length) {
  console.error(`✗ @grounding: ${problems.length} problem(s):`);
  for (const p of problems) console.error("  -", p);
  process.exit(1);
}
console.log(`✓ @grounding: ${files.length} agents, 6 dims each, all well-formed, no placeholders, basis rules OK`);
