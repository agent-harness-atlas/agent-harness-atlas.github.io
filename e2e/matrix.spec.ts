import { test, expect } from "@playwright/test";

// F03: matrix renders 8 agents × 6 dimensions with overall = mean of non-null dims.
const DIMS = ["memory", "context", "skill", "cost", "sandbox", "multiagent"];
const AGENTS = ["claude-code", "codex", "pi", "opencode", "cursor", "aider", "cline", "gemini-cli"];

test("matrix has 8 agent rows", async ({ page }) => {
  await page.goto("/index.html");
  await expect(page.locator("#body tr")).toHaveCount(8);
  for (const id of AGENTS) {
    await expect(page.getByTestId(`agent-row-${id}`)).toBeVisible();
  }
});

test("each row has 6 dimension cells with score data", async ({ page }) => {
  await page.goto("/index.html");
  for (const id of AGENTS) {
    for (const dim of DIMS) {
      await expect(page.getByTestId(`cell-${id}-${dim}`)).toHaveCount(1);
    }
  }
});

test("first column is sticky-left", async ({ page }) => {
  await page.goto("/index.html");
  const pos = await page.locator(".agent-cell").first().evaluate((el) => getComputedStyle(el).position);
  expect(pos).toBe("sticky");
});

test("overall score equals mean of non-null dimension scores (±1)", async ({ page }) => {
  await page.goto("/index.html");
  for (const id of AGENTS) {
    const scores: number[] = [];
    for (const dim of DIMS) {
      const v = await page.getByTestId(`cell-${id}-${dim}`).getAttribute("data-score");
      if (v && v !== "") scores.push(Number(v));
    }
    const expected = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    const ovAttr = await page.getByTestId(`overall-${id}`).getAttribute("data-overall");
    const got = ovAttr && ovAttr !== "" ? Number(ovAttr) : null;
    if (expected === null) expect(got).toBeNull();
    else expect(Math.abs((got as number) - expected)).toBeLessThanOrEqual(1);
  }
});

test("detail links point to agent.html#<id>", async ({ page }) => {
  await page.goto("/index.html");
  for (const id of AGENTS) {
    const href = await page.getByTestId(`detail-link-${id}`).getAttribute("href");
    expect(href).toBe(`agent.html#${id}`);
  }
});

test("band coloring applied (scorebox carries a band class)", async ({ page }) => {
  await page.goto("/index.html");
  const cls = await page.getByTestId("cell-codex-sandbox").locator(".scorebox").getAttribute("class");
  expect(cls).toMatch(/b-(exceptional|strong|functional|broken|pending)/);
});

test("no console errors on matrix", async ({ page }) => {
  const errs: string[] = [];
  page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto("/index.html");
  await page.waitForLoadState("networkidle");
  expect(errs).toEqual([]);
});
