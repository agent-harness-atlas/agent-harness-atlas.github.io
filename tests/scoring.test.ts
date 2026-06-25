// Unit tests for the scoring core in src/atlas.ts: scoreOf (overall = rounded
// mean of non-null dimension scores) and bandOf (score → semantic band).
// Layer: UNIT — pure logic. These guard the numbers the whole matrix ranks on.
import { describe, expect, it } from "vitest";
import { BANDS, DIMENSIONS, PENDING, bandOf, scoreOf } from "../src/atlas";
import type { AgentAnalysis } from "../src/types";
import type { Cell } from "../src/types";

// Minimal cell factory — only `score` matters for scoreOf; the rest are filler.
function cell(score: number | null): Cell {
  return {
    score,
    zh: "",
    en: "",
    citations: [],
    keep: { zh: "", en: "" },
    fix: { zh: "", en: "" },
  };
}

// Build an agent whose six dimension cells carry the given scores (by DIMENSIONS order).
function agentWithScores(scores: (number | null)[]): AgentAnalysis {
  const cells: Record<string, Cell> = {};
  DIMENSIONS.forEach((d, i) => {
    if (i < scores.length) cells[d.id] = cell(scores[i]);
  });
  return {
    id: "test",
    name: "Test",
    vendor: "x",
    lang: "x",
    evidenceBasis: "source",
    repo: null,
    verdict: { zh: "", en: "" },
    cells,
    keyFiles: [],
  };
}

describe("scoreOf — overall = rounded mean of non-null dimension scores", () => {
  it("averages all six dimensions and rounds to nearest integer", () => {
    // mean(80,80,80,80,80,80) = 80
    expect(scoreOf(agentWithScores([80, 80, 80, 80, 80, 80]))).toBe(80);
  });

  it("rounds a fractional mean to the nearest integer", () => {
    // mean(70,70,70,70,70,73) = 70.5 → 71 (Math.round, half-up)
    expect(scoreOf(agentWithScores([70, 70, 70, 70, 70, 73]))).toBe(71);
  });

  it("ignores null cells in both the sum and the divisor", () => {
    // only two non-null: mean(90, 60) = 75
    expect(scoreOf(agentWithScores([90, null, 60, null, null, null]))).toBe(75);
  });

  it("returns null when every dimension is null (nothing to average)", () => {
    expect(scoreOf(agentWithScores([null, null, null, null, null, null]))).toBeNull();
  });

  it("returns null when the agent has no cells at all", () => {
    expect(scoreOf(agentWithScores([]))).toBeNull();
  });

  it("treats a literal 0 as a real score, not as missing", () => {
    // mean(0, 0) = 0 — distinct from null → must be 0, never null.
    expect(scoreOf(agentWithScores([0, 0, null, null, null, null]))).toBe(0);
  });

  it("matches a hand-computed mix of high and low scores", () => {
    // mean(85,40,72,0,90,55) = 342/6 = 57
    expect(scoreOf(agentWithScores([85, 40, 72, 0, 90, 55]))).toBe(57);
  });
});

describe("bandOf — score maps to the correct semantic band", () => {
  it("85 and above is Exceptional", () => {
    expect(bandOf(85).cvar).toBe("exceptional");
    expect(bandOf(100).cvar).toBe("exceptional");
  });

  it("65–84 is Strong", () => {
    expect(bandOf(65).cvar).toBe("strong");
    expect(bandOf(84).cvar).toBe("strong");
  });

  it("40–64 is Functional", () => {
    expect(bandOf(40).cvar).toBe("functional");
    expect(bandOf(64).cvar).toBe("functional");
  });

  it("1–39 is Broken", () => {
    expect(bandOf(1).cvar).toBe("broken");
    expect(bandOf(39).cvar).toBe("broken");
  });

  it("0 falls through every band.min and lands on Pending", () => {
    // lowest band.min is 1, so 0 matches nothing → PENDING.
    expect(bandOf(0).cvar).toBe(PENDING.cvar);
  });

  it("null score is Pending (not yet scored)", () => {
    expect(bandOf(null).cvar).toBe("pending");
    expect(bandOf(null)).toBe(PENDING);
  });

  it("picks the exact band at each boundary (no off-by-one)", () => {
    // 84 must be Strong, 85 must tip into Exceptional.
    expect(bandOf(84).cvar).toBe("strong");
    expect(bandOf(85).cvar).toBe("exceptional");
    // 64 Functional, 65 Strong.
    expect(bandOf(64).cvar).toBe("functional");
    expect(bandOf(65).cvar).toBe("strong");
  });

  it("BANDS are sorted by descending threshold (invariant bandOf relies on)", () => {
    // bandOf walks BANDS top-down returning the first min it clears; that's only
    // correct if thresholds strictly descend. Guard the data shape itself.
    for (let i = 1; i < BANDS.length; i++) {
      expect(BANDS[i - 1].min).toBeGreaterThan(BANDS[i].min);
    }
  });
});
