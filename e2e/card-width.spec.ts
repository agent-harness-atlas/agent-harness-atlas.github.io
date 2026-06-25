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

// No text element (prose, bullets, evidence, citations) may spill past its
// card's content box, at any common viewport width. This is the durable guard
// for Bojun's "技能扩展" overflow screenshot — the bug was a tag-row 1fr column
// with the default min-width:auto letting long tokens (registerTool/Command/…
// /MessageRenderer) blow past the card edge. Fixed via minmax(0,1fr) + the
// .tag-body min-width:0 / overflow-wrap:anywhere pairing.
const OVERFLOW_AGENTS = ["pi", "claude-code", "opencode", "cline"];
const OVERFLOW_VIEWPORTS = [1280, 1440, 1728];

for (const w of OVERFLOW_VIEWPORTS) {
  for (const id of OVERFLOW_AGENTS) {
    test(`no text overflows its card — #${id} @${w}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 1000 });
      await page.goto(`/agent.html#${id}`);
      await page.locator(".dim").first().waitFor();
      const worst = await page.evaluate(() => {
        let maxOver = 0;
        let detail = "";
        const sel = ".tag-body, .tag-list li, .tag-lead, .dim-evidence, .cite, .dim-name";
        for (const card of document.querySelectorAll(".dim")) {
          const cr = card.getBoundingClientRect();
          const padR = parseFloat(getComputedStyle(card).paddingRight);
          const contentRight = cr.right - padR;
          for (const el of card.querySelectorAll(sel)) {
            const over = Math.round(el.getBoundingClientRect().right - contentRight);
            if (over > maxOver) {
              maxOver = over;
              detail = (el.textContent || "").slice(0, 40);
            }
          }
        }
        return { maxOver, detail };
      });
      expect(worst.maxOver, `overflow on ${id} @${w}: "${worst.detail}"`).toBeLessThanOrEqual(1);
    });
  }
}
