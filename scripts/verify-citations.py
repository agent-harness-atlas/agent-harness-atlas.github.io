#!/usr/bin/env python3
"""PM post-return verification: independently disk-check every analysis/*.json
citation before trusting it as frozen truth. Subagent summaries are self-reports."""
import json, re, os, glob, sys

SPIKE = "/tmp/agent-src-spike"
DIMS = {"memory", "context", "skill", "cost", "sandbox", "multiagent"}
REPO_ROOTS = {  # id -> clone dir name
    "codex": "codex", "pi": "pi", "opencode": "opencode",
    "aider": "aider", "cline": "cline", "gemini-cli": "gemini-cli",
}
CITE_RE = re.compile(r"^(.+?):L(\d+)(?:-L(\d+))?$")

problems, stats = [], []
for path in sorted(glob.glob("analysis/*.json")):
    d = json.load(open(path))
    aid = d["id"]
    basis = d["evidenceBasis"]
    # shape
    if set(d["cells"]) != DIMS:
        problems.append(f"{aid}: cells keys {set(d['cells'])} != {DIMS}")
    n_cite = 0
    bad_here = 0
    for dim, c in d["cells"].items():
        if not isinstance(c.get("score"), int) or not (1 <= c["score"] <= 100):
            problems.append(f"{aid}.{dim}: score {c.get('score')} not int 1-100")
        for fld in ("zh", "en"):
            if not c.get(fld, "").strip():
                problems.append(f"{aid}.{dim}: empty {fld}")
        for kf in ("keep", "fix"):
            if not c.get(kf, {}).get("zh", "").strip() or not c.get(kf, {}).get("en", "").strip():
                problems.append(f"{aid}.{dim}.{kf}: empty zh/en")
        cites = c.get("citations", [])
        if not cites:
            problems.append(f"{aid}.{dim}: no citations")
        for cit in cites:
            n_cite += 1
            if basis == "docs":
                if not cit.startswith("http"):
                    problems.append(f"{aid}.{dim}: docs-basis citation not URL: {cit}")
            else:  # source
                if cit.startswith("http"):
                    problems.append(f"{aid}.{dim}: source-basis citation is URL: {cit}")
                    bad_here += 1; continue
                m = CITE_RE.match(cit)
                if not m:
                    problems.append(f"{aid}.{dim}: citation not path:Lx-Ly shape: {cit}")
                    bad_here += 1; continue
                relpath, l1, l2 = m.group(1), int(m.group(2)), m.group(3)
                fp = os.path.join(SPIKE, REPO_ROOTS[aid], relpath)
                if not os.path.isfile(fp):
                    problems.append(f"{aid}.{dim}: cited file MISSING ON DISK: {relpath}")
                    bad_here += 1; continue
                with open(fp, "rb") as fh:
                    nlines = sum(1 for _ in fh)
                hi = int(l2) if l2 else l1
                if l1 < 1 or hi > nlines:
                    problems.append(f"{aid}.{dim}: line range L{l1}-L{hi} out of bounds (file has {nlines} lines): {relpath}")
                    bad_here += 1
    # docs-basis must have evidenceNote
    if basis == "docs" and not d.get("evidenceNote", {}).get("zh"):
        problems.append(f"{aid}: docs-basis missing evidenceNote")
    if basis == "source" and not d.get("repo"):
        problems.append(f"{aid}: source-basis missing repo")
    stats.append(f"  {aid:12s} basis={basis:6s} citations={n_cite:3d} bad={bad_here}")

print("=== citation disk cross-check ===")
print("\n".join(stats))
print(f"\n=== {len(problems)} problem(s) ===")
for p in problems:
    print("  ✗", p)
sys.exit(1 if problems else 0)
