// Unit tests over the GROUNDED data itself (src/generated/atlas-data.ts, composed
// from src/meta.json + analysis/*.json). These assert the dataset's shape and
// internal consistency so a bad data edit fails fast — before it ever renders.
// Layer: UNIT — pure data validation, no DOM.
import { describe, expect, it } from "vitest";
import { AGENTS, DIMENSIONS, META, scoreOf } from "../src/atlas";
import { t } from "../src/atlas";

describe("dataset shape — 8 agents × 6 dimensions", () => {
  it("has exactly 8 agents", () => {
    expect(AGENTS.length).toBe(8);
  });

  it("has exactly 6 dimensions", () => {
    expect(DIMENSIONS.length).toBe(6);
  });

  it("every agent has a unique id", () => {
    const ids = AGENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every agent carries a cell for all 6 dimensions", () => {
    for (const a of AGENTS) {
      for (const d of DIMENSIONS) {
        expect(a.cells[d.id], `${a.id} missing dimension ${d.id}`).toBeDefined();
      }
    }
  });
});

describe("per-cell integrity", () => {
  it("scores are null or an integer in [0,100]", () => {
    for (const a of AGENTS) {
      for (const d of DIMENSIONS) {
        const s = a.cells[d.id].score;
        if (s !== null) {
          expect(Number.isInteger(s), `${a.id}/${d.id} score not integer`).toBe(true);
          expect(s, `${a.id}/${d.id} score out of range`).toBeGreaterThanOrEqual(0);
          expect(s).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it("every scored cell cites at least one source (grounding)", () => {
    for (const a of AGENTS) {
      for (const d of DIMENSIONS) {
        const c = a.cells[d.id];
        if (c.score !== null) {
          expect(
            c.citations.length,
            `${a.id}/${d.id} is scored but has no citations`,
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  it("every cell has non-empty zh and en prose", () => {
    for (const a of AGENTS) {
      for (const d of DIMENSIONS) {
        const c = a.cells[d.id];
        expect(c.zh.trim().length, `${a.id}/${d.id} empty zh`).toBeGreaterThan(0);
        expect(c.en.trim().length, `${a.id}/${d.id} empty en`).toBeGreaterThan(0);
      }
    }
  });
});

describe("per-agent integrity", () => {
  it("every agent has a bilingual verdict", () => {
    for (const a of AGENTS) {
      expect(t(a.verdict, "zh").trim().length, `${a.id} empty zh verdict`).toBeGreaterThan(0);
      expect(t(a.verdict, "en").trim().length, `${a.id} empty en verdict`).toBeGreaterThan(0);
    }
  });

  it("evidenceBasis is one of the two allowed values", () => {
    for (const a of AGENTS) {
      expect(["source", "docs"]).toContain(a.evidenceBasis);
    }
  });

  it("source-grounded agents point at a repo; docs-grounded ones need not", () => {
    for (const a of AGENTS) {
      if (a.evidenceBasis === "source") {
        expect(a.repo, `${a.id} is source-based but has no repo`).toBeTruthy();
      }
    }
  });

  it("declared version (when present) is a precise vX.Y[.Z] string", () => {
    for (const a of AGENTS) {
      if (a.version) {
        const v = t(a.version, "zh").trim();
        expect(v, `${a.id} version "${v}" is not precise`).toMatch(/^v\d+\.\d+(\.\d+)?$/);
      }
    }
  });
});

describe("scoreOf agrees with the data, and ranking is sane", () => {
  it("computed overall sits within [0,100] for every agent", () => {
    for (const a of AGENTS) {
      const s = scoreOf(a);
      if (s !== null) {
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(100);
      }
    }
  });

  it("at least one agent reaches the Exceptional band (sanity on the curve)", () => {
    const max = Math.max(...AGENTS.map((a) => scoreOf(a) ?? -1));
    expect(max).toBeGreaterThanOrEqual(85);
  });
});

describe("META", () => {
  it("has an updated week stamp and a bilingual source note", () => {
    expect(META.updated.trim().length).toBeGreaterThan(0);
    expect(META.sourceNote.zh.trim().length).toBeGreaterThan(0);
    expect(META.sourceNote.en.trim().length).toBeGreaterThan(0);
  });
});
