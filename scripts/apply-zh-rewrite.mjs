#!/usr/bin/env node
// Apply Chinese-only prose rewrites to analysis/<agent>.json.
// HARD RULE: only touches verdict.zh, cells[dim].zh, cells[dim].keep.zh, cells[dim].fix.zh.
// score / citations / en / keep.en / fix.en are NEVER modified and are verified byte-identical after.
import fs from "node:fs";
import path from "node:path";

const rewriteFile = process.argv[2];
if (!rewriteFile) { console.error("usage: node apply-zh-rewrite.mjs <rewrite.json>"); process.exit(1); }

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const ANALYSIS = path.join(ROOT, "analysis");
const rewrites = JSON.parse(fs.readFileSync(rewriteFile, "utf8"));

const frozenSig = (d) => JSON.stringify({
  // everything that must NOT change
  verdict_en: d.verdict?.en,
  cells: Object.fromEntries(Object.entries(d.cells || {}).map(([k, c]) => [k, {
    score: c.score, citations: c.citations, en: c.en,
    keep_en: c.keep?.en, fix_en: c.fix?.en,
  }])),
});

let totalFields = 0;
for (const [agent, rw] of Object.entries(rewrites)) {
  const fp = path.join(ANALYSIS, `${agent}.json`);
  if (!fs.existsSync(fp)) { console.error(`!! missing ${fp}`); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(fp, "utf8"));
  const before = frozenSig(d);

  if (rw.verdict_zh != null) { d.verdict.zh = rw.verdict_zh; totalFields++; }
  for (const [dim, c] of Object.entries(rw.cells || {})) {
    if (!d.cells[dim]) { console.error(`!! ${agent}: no cell '${dim}'`); process.exit(1); }
    if (c.zh != null) { d.cells[dim].zh = c.zh; totalFields++; }
    if (c.keep_zh != null) { d.cells[dim].keep = d.cells[dim].keep || {}; d.cells[dim].keep.zh = c.keep_zh; totalFields++; }
    if (c.fix_zh != null) { d.cells[dim].fix = d.cells[dim].fix || {}; d.cells[dim].fix.zh = c.fix_zh; totalFields++; }
  }

  const after = frozenSig(d);
  if (before !== after) {
    console.error(`!! FROZEN FIELDS CHANGED for ${agent} — aborting, no write`);
    process.exit(2);
  }
  fs.writeFileSync(fp, JSON.stringify(d, null, 2) + "\n", "utf8");
  console.log(`  ✓ ${agent}: zh fields updated, score/citations/en verified unchanged`);
}
console.log(`done — ${totalFields} Chinese fields rewritten across ${Object.keys(rewrites).length} agent(s)`);
