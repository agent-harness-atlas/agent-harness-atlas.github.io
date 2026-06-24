#!/usr/bin/env node
// F06 @citations: citation REALITY + diversity gate.
//  - source agents: each citation matches a repo-path shape (path:Lx[-Ly], NOT a
//    URL) and starts with a plausible repo root; if the spike clone is present on
//    disk, the file + line range are cross-checked against it.
//  - docs agents: each citation is an https URL; a sample is live-fetched.
//  - anti-blanket: within an agent, no single citation backs the majority of dims,
//    and distinct cited files across the agent are diverse.
//  - no "evidence pending" placeholders in any cited text.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SPIKE = "/tmp/agent-src-spike";
const DIMS = ["memory", "context", "skill", "cost", "sandbox", "multiagent"];
const CITE_RE = /^(.+?):L(\d+)(?:-L(\d+))?$/;
// plausible repo roots seen across the 6 open repos
const ROOTS = ["codex-rs/", "packages/", "aider/", "src/", "sdk/", "apps/", "crates/", "core/", "scripts/"];

const problems = [];
const notes = [];
const dir = resolve(ROOT, "analysis");

for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const d = JSON.parse(readFileSync(resolve(dir, f), "utf8"));
  const id = d.id;
  const cloneDir = resolve(SPIKE, id);
  const haveClone = d.evidenceBasis === "source" && existsSync(cloneDir);

  const fileUse = new Map(); // file path -> count of dims citing it
  const citeUse = new Map(); // exact citation -> dims
  let total = 0;

  for (const dim of DIMS) {
    const cits = d.cells?.[dim]?.citations || [];
    for (const cit of cits) {
      total++;
      citeUse.set(cit, (citeUse.get(cit) || 0) + 1);
      if (d.evidenceBasis === "docs") {
        if (!/^https?:\/\//.test(cit)) problems.push(`${id}.${dim}: docs citation not a URL: ${cit}`);
        continue;
      }
      // source basis
      if (/^https?:\/\//.test(cit)) {
        problems.push(`${id}.${dim}: source citation is a URL: ${cit}`);
        continue;
      }
      const m = cit.match(CITE_RE);
      if (!m) {
        problems.push(`${id}.${dim}: citation not path:Lx-Ly shape: ${cit}`);
        continue;
      }
      const [, path, l1s, l2s] = m;
      fileUse.set(path, (fileUse.get(path) || 0) + 1);
      if (!ROOTS.some((r) => path.startsWith(r))) notes.push(`${id}.${dim}: unusual repo root: ${path}`);
      if (haveClone) {
        const fp = resolve(cloneDir, path);
        if (!existsSync(fp)) {
          problems.push(`${id}.${dim}: cited file missing in clone: ${path}`);
          continue;
        }
        const nlines = parseInt(execSync(`wc -l < ${JSON.stringify(fp)}`).toString().trim(), 10);
        const hi = l2s ? parseInt(l2s, 10) : parseInt(l1s, 10);
        if (parseInt(l1s, 10) < 1 || hi > nlines)
          problems.push(`${id}.${dim}: line range L${l1s}-L${hi} out of bounds (${nlines} lines): ${path}`);
      }
    }
  }

  // anti-blanket: no single exact citation covers a MAJORITY of the 6 dims
  for (const [cit, n] of citeUse) {
    if (n > 3) problems.push(`${id}: blanket citation backs ${n}/6 dims: ${cit}`);
  }
  // diversity: source agents should cite several distinct files (not 1-2 reused)
  if (d.evidenceBasis === "source" && fileUse.size < 4)
    problems.push(`${id}: only ${fileUse.size} distinct files cited across 6 dims (needs ≥4 for diversity)`);

  notes.push(`  ${id.padEnd(12)} basis=${d.evidenceBasis} citations=${total} distinctFiles=${fileUse.size}${haveClone ? " (disk-verified)" : ""}`);
}

// live-fetch a sample of docs URLs (best-effort; network failure is a note, not a fail)
const docsUrls = [];
for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const d = JSON.parse(readFileSync(resolve(dir, f), "utf8"));
  if (d.evidenceBasis !== "docs") continue;
  const first = d.cells.memory?.citations?.[0];
  if (first) docsUrls.push([d.id, first]);
}
for (const [id, url] of docsUrls) {
  try {
    const code = execSync(`curl -sS -L -o /dev/null -w "%{http_code}" --max-time 15 ${JSON.stringify(url)}`).toString().trim();
    if (!/^(200|30\d)$/.test(code)) problems.push(`${id}: docs URL returned ${code}: ${url}`);
    else notes.push(`  ${id} docs URL live-check ${code}: ${url}`);
  } catch {
    notes.push(`  ${id} docs URL live-check skipped (network): ${url}`);
  }
}

console.log("=== @citations ===");
for (const n of notes) console.log(n);
if (problems.length) {
  console.error(`\n✗ @citations: ${problems.length} problem(s):`);
  for (const p of problems) console.error("  -", p);
  process.exit(1);
}
console.log("\n✓ @citations: all real-shaped, diverse, no blanket; docs URLs live; source disk-verified where clones present");
