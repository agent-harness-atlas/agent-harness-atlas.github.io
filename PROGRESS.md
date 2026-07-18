# PROGRESS — agent-harness-atlas

> The cross-session diary. Every session reads this at the start
> and stamps it at the end. Based on L05.
>
> Format: append new sessions at the bottom. Keep the **Current state** block
> updated so the next agent doesn't have to re-derive it.

## Current state

- **Last commit**: _(see git log — F03 passing + session checkpoint)_
- **Branch**: `main`
- **Build**: passing (`npm run build` green; tsc + vite multi-page)
- **Tests**: F01/F02/F03 auto_verify green. matrix.spec 7/7. F04/F07/F08/F09 e2e specs WRITTEN but not yet run/validated.
- **Active feature**: (none) — F03 just marked passing; next session activates F04.

## Open blockers

- _(nothing — no human-gated blockers)_

## Next steps (priority order)

1. **F04** detail page e2e — `e2e/detail.spec.ts` already written; activate F04, run `bash scripts/validate-feature.sh F04`, mark passing.
2. **F05 scoresync / F06 citations** — check scripts already written & independently green (`node scripts/checks/scoresync.mjs`, `citations.mjs`). Activate each, run validate-feature, mark passing.
3. **F07 evidence-basis** — `e2e/evidence-basis.spec.ts` written; validate + pass.
4. **F08 i18n** — write `tests/i18n-parity.test.ts` (vitest, zh/en key parity over UI+DIMENSIONS+cells), `e2e/i18n.spec.ts` written; validate + pass.
5. **F09 theme** — `e2e/theme.spec.ts` written; validate + pass.
6. **F10 svg-only** — write `e2e/svg-only.spec.ts` (runtime DOM emoji scan = 0 hits; key symbol slots have <svg>).
7. **F11 responsive** — write `e2e/responsive.spec.ts` (390px/720px: matrix horizontal scroll not clipped, masthead reflow).
8. **F12 weekly** — write `scripts/checks/weekly.mjs --check/--stamp` + CHANGELOG.md + idempotence.
9. Then: `make check` full bar + `bash scripts/exit-clean.sh`, relaunch `vite preview` + single-owner cloudflared for Bojun's interactive acceptance.

### Reusable infra already in place (don't rebuild)
- Source clones: `/tmp/agent-src-spike/<id>` for 6 open repos (may be GC'd — `bash scripts/clone-spike.sh` re-clones).
- `analysis/*.json` = PM-frozen grounding truth (180 citations, all disk-verified 0 bad). DO NOT hand-edit scores/citations to pass a gate.
- `scripts/verify-citations.py` re-runs the disk cross-check; `scripts/build-data.mjs` regenerates the single-source module.
- Public preview pattern: `npx vite preview --port 4173 --strictPort` (allowedHosts:true) + `cloudflared tunnel --url http://localhost:4173`. PM single-owner.

---

## Session 2026-06-24 — initial setup

- Adopted [harness-kit](https://github.com/Bojun-Vvibe/harness-kit) as the agent harness.
- Generated initial AGENTS.md / CONSTRAINTS.md / FEATURES.md / features.json / Makefile / scripts.
- TODO: replace all `> **TODO**:` markers with project-specific content.
- TODO: add the first real feature in `features.json` per the rules in `FEATURES.md`.

## Session 2026-07-04T21:15:00+08:00 — weekly refresh 2026-W27 (automated cron)

- **Version sweep** (gh releases for 6 source agents + docs changelogs for claude-code/cursor):
  - Bumped: codex v0.137.0→**v0.142.5**, pi v0.74.0→**v0.80.3**, opencode v1.17.4→**v1.17.13**,
    gemini-cli v0.47.0→**v0.49.0**, claude-code v2.1.187→**v2.1.201**, cline v3.86.0→**v4.0.6**.
  - Unchanged: aider (v0.86.0), cursor (v3.9) — left untouched.
- **No score/rank/band changes.** Reviewed the deltas for material harness change: claude-code
  changelog = bug-fixes + background-agent plumbing (no dimension move); cline v4.0.0 = SDK-core
  migration the analysis *already* describes (all 21 cline citations verified clean vs HEAD; v4's
  "temporarily disabled subagents in VS Code UI" is a transient surface gate, SDK team-system code
  intact → multiagent=86 stays supported). Codex/opencode/pi/gemini source capabilities unchanged.
- **Re-anchored 4 drifted source citations** (files refactored/shrunk on HEAD, capability verified
  present at new lines, not a score change): codex.skill core-skills/src/lib.rs L1-L36→L1-L35;
  codex.multiagent multi_agents_v2.rs L28-L55→L27-L54; opencode.context processor.ts L750-755→L477-482;
  opencode.cost processor.ts L708-727→L438-456.
- **meta.json**: updated 2026-W26→**2026-W27**, version 4.0→**4.1**. README zh+en standings tables
  restamped + version column updated (ranks/scores identical). Top3 unchanged (Gemini 85 / Claude 84 / Codex 80).
- **Green gate**: build ✓ · verify-citations.py ✓ 0/~180 bad · vitest 56/56 ✓ · playwright 69/69 ✓.
- **Published**: commit `7da7ebf` pushed to main (Bojun-Vvibe), deploy-pages.yml **completed/success**,
  live bundle confirmed serving 2026-W27 + new versions. Work account (bojunchai_microsoft) restored active.

## Session 2026-07-18T21:07:00Z
Weekly refresh 2026-W29 (published). Version bumps: codex v0.142.5→v0.144.5, pi v0.80.3→v0.80.10, opencode v1.17.13→v1.18.3, cline v4.0.6→v4.0.9, gemini-cli v0.49.0→v0.51.0, claude-code v2.1.201→v2.1.214, cursor v3.9→v3.11 (aider unchanged v0.86.0). Citation drift re-anchored: codex.context context_window.rs L24-L92→L23-L91, pi.memory system-prompt.ts L153-L166→L144-L162 (pure re-anchor, capabilities intact). No score moves — all citations verify clean vs HEAD, restraint applied. meta 4.1→4.2. Gates: build✓ verify-citations 0✓ test 56✓ e2e 69✓. Deployed f841f36 completed/success, live bundle confirmed 2026-W29.
