import { expect, test } from "@playwright/test";

// Regression: the detail-page dimension cards (.dim in a 2-col .dim-grid) must
// stay equal width. Long unbreakable citations (file-path links) used to blow
// one grid column past its 50% share via the default min-width:auto on grid
// items, desyncing card widths (Bojun's screenshot: Pi, left 596 vs right 437).
// Fixed with grid-template-columns: minmax(0,1fr) minmax(0,1fr) + .dim min-width:0.

// Pi has the longest citation paths and was the worst offender — test it plus a
// couple of others so the guard isn't agent-specific.
const AGENTS = ["pi", "opencode", "claude-code", "codex"];

for (const id of AGENTS) {
  test(`detail cards are equal width — #${id}`, async ({ page }) => {
    await page.goto(`/agent.html#${id}`);
    const grid = page.locator(".dim-grid");
    await expect(grid).toBeVisible();

    const widths = await page
      .locator(".dim")
      .evaluateAll((cards) => cards.map((c) => Math.round(c.getBoundingClientRect().width)));
    expect(widths.length).toBeGreaterThan(0);

    // every card must share one width (the two columns are 50/50)
    const distinct = [...new Set(widths)];
    expect(distinct.length, `cards should all be one width, got ${JSON.stringify(widths)}`).toBe(1);
  });
}

test("the two grid columns are exactly equal (50/50 split)", async ({ page }) => {
  await page.goto("/agent.html#pi");
  const cols = await page
    .locator(".dim-grid")
    .evaluate((el) => getComputedStyle(el).gridTemplateColumns);
  // "<w>px <w>px" — both track widths must match within 1px
  const nums = cols.split(/\s+/).map((s) => Number.parseFloat(s));
  expect(nums.length).toBe(2);
  expect(Math.abs(nums[0] - nums[1])).toBeLessThanOrEqual(1);
});

test("long citation paths do not overflow their card", async ({ page }) => {
  await page.goto("/agent.html#pi");
  const overflow = await page.evaluate(() => {
    let n = 0;
    for (const card of document.querySelectorAll(".dim")) {
      const cr = card.getBoundingClientRect();
      for (const ci of card.querySelectorAll(".cite")) {
        if (ci.getBoundingClientRect().right > cr.right + 1) n++;
      }
    }
    return n;
  });
  expect(overflow, "no citation should spill past its card's right edge").toBe(0);
});
