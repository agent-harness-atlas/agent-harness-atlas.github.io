import { test, expect } from "@playwright/test";

// F04: detail page renders radar + per-dimension scores + 6 report cards; hash switches agent.
const DIMS = ["memory", "context", "skill", "cost", "sandbox", "multiagent"];

test("detail renders masthead, radar, 6 report cards", async ({ page }) => {
  await page.goto("/agent.html#codex");
  await expect(page.getByTestId("agent-title")).toHaveText("Codex CLI");
  const radar = page.getByTestId("radar");
  await expect(radar).toBeVisible();
  expect(await radar.getAttribute("data-axes")).toBe("6");
  await expect(radar.locator("polygon.area")).toHaveCount(1);
  await expect(page.locator(".dim")).toHaveCount(6);
  for (const dim of DIMS) {
    await expect(page.getByTestId(`report-${dim}`)).toHaveCount(1);
  }
});

test("report cards carry real citations", async ({ page }) => {
  await page.goto("/agent.html#aider");
  // aider context dimension cites repomap.py
  const cites = page.getByTestId("cites-context");
  await expect(cites).toBeVisible();
  await expect(cites.locator(".cite")).not.toHaveCount(0);
  const txt = await cites.innerText();
  expect(txt).toMatch(/repomap\.py/);
});

test("hash change switches agent without full reload", async ({ page }) => {
  await page.goto("/agent.html#codex");
  await expect(page.getByTestId("agent-title")).toHaveText("Codex CLI");
  await page.evaluate(() => {
    location.hash = "#aider";
  });
  await expect(page.getByTestId("agent-title")).toHaveText("Aider");
  await page.evaluate(() => {
    location.hash = "#gemini-cli";
  });
  await expect(page.getByTestId("agent-title")).toHaveText("Gemini CLI");
});

test("evidence markup allows code spans in evidence prose", async ({ page }) => {
  await page.goto("/agent.html#codex");
  // at least one dim-evidence has a <code> mechanism name
  const codeCount = await page.locator(".dim-evidence code").count();
  expect(codeCount).toBeGreaterThan(0);
});

test("no console errors on detail", async ({ page }) => {
  const errs: string[] = [];
  page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto("/agent.html#opencode");
  await page.waitForLoadState("networkidle");
  expect(errs).toEqual([]);
});
