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
