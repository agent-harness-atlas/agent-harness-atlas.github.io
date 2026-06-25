import { expect, test } from "@playwright/test";

// Regression: the hover evidence tooltip (.tip) must never cover the sticky
// table header. The top-ranked row sits directly under <thead>; the tip pops
// upward by default, so for row 1 it used to overlap the header (Bojun's
// screenshot of the broken UI). Row 1 now flips downward (.tip-below).

test.describe("evidence tooltip does not cover the header", () => {
  test("top-row tips carry the downward-flip class", async ({ page }) => {
    await page.goto("/index.html");
    const firstRow = page.locator("#body tr").first();
    const tips = firstRow.locator(".tip");
    const count = await tips.count();
    expect(count).toBeGreaterThan(0);
    // every dimension tip in row 1 must be a tip-below
    for (let i = 0; i < count; i++) {
      await expect(tips.nth(i)).toHaveClass(/tip-below/);
    }
  });

  test("hovering a first-row cell keeps the tip below the header (no overlap)", async ({
    page,
  }) => {
    await page.goto("/index.html");
    const headerBottom = await page
      .locator("thead")
      .evaluate((el) => el.getBoundingClientRect().bottom);

    // hover the first data row's first dimension cell (the worst case: top-left)
    const cell = page.locator("#body tr").first().locator("td.cell").first();
    await cell.hover();
    const tip = cell.locator(".tip");
    await expect(tip).toBeVisible();

    // the tip's top edge must sit at or below the header's bottom edge
    const tipTop = await tip.evaluate((el) => el.getBoundingClientRect().top);
    expect(
      tipTop,
      "tooltip top should be below the sticky header bottom (no overlap)",
    ).toBeGreaterThanOrEqual(headerBottom - 1);
  });

  test("a lower-row tip still pops upward (default direction unchanged)", async ({ page }) => {
    await page.goto("/index.html");
    const rows = page.locator("#body tr");
    // pick a mid-table row (row index 3) — should NOT be tip-below
    const midCellTip = rows.nth(3).locator("td.cell .tip").first();
    await expect(midCellTip).not.toHaveClass(/tip-below/);
  });
});
