#!/usr/bin/env node
// F05 @scoresync: every score the UI renders is derived from analysis/*.json with
// NO second hand-written copy. Asserts the generated single-source module's scores
// EXACTLY equal the analysis JSON source values (matrix cells, detail cells, and
// the computed overall). Any drift → non-zero exit.
import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DIMS = ["memory", "context", "skill", "cost", "sandbox", "multiagent"];

// 1. load authoritative analysis source
const dir = resolve(ROOT, "analysis");
const analysis = {};
for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const d = JSON.parse(readFileSync(resolve(dir, f), "utf8"));
  analysis[d.id] = d;
}

// 2. load the generated single-source module (what the UI actually renders)
const genSrc = readFileSync(resolve(ROOT, "src/generated/atlas-data.ts"), "utf8");
const m = genSrc.match(/export const AGENTS[^=]*=\s*(\[[\s\S]*\]);\s*$/);
if (!m) {
  console.error("✗ @scoresync: could not parse AGENTS from generated module");
  process.exit(1);
}
const genAgents = JSON.parse(m[1]);

const overall = (cells) => {
  let sum = 0,
    n = 0;
  for (const dim of DIMS) {
    const s = cells[dim]?.score;
    if (typeof s === "number") {
      sum += s;
      n++;
    }
  }
  return n ? Math.round(sum / n) : null;
};

const problems = [];
let checked = 0;
for (const ga of genAgents) {
  const src = analysis[ga.id];
  if (!src) {
    problems.push(`generated agent ${ga.id} has no analysis source`);
    continue;
  }
  for (const dim of DIMS) {
    const a = src.cells[dim]?.score ?? null;
    const b = ga.cells[dim]?.score ?? null;
    checked++;
    if (a !== b) problems.push(`${ga.id}.${dim}: generated score ${b} != analysis ${a}`);
  }
  // overall the UI computes must equal the overall of the analysis source
  const oa = overall(src.cells);
  const ob = overall(ga.cells);
  checked++;
  if (oa !== ob) problems.push(`${ga.id}.overall: generated ${ob} != analysis ${oa}`);
}

if (problems.length) {
  console.error(`✗ @scoresync: ${problems.length} drift(s):`);
  for (const p of problems) console.error("  -", p);
  process.exit(1);
}
console.log(`✓ @scoresync: ${checked} scores (${genAgents.length} agents × 6 dims + overall) all match analysis source`);
