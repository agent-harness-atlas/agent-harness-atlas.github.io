import { expect, test } from "@playwright/test";

// GitHub link in the topbar (Bojun's ask on this pass):
//   The top-right corner carries a GitHub octocat icon linking to the canonical
//   repo. It must (1) exist on BOTH pages, (2) point at the org's canonical repo,
//   (3) open in a new tab safely, and (4) visually match the sibling icon buttons
//   (the global `a { color: var(--accent) }` rule must NOT bleed through and tint
//   the octocat rust-red — `.icon-btn` has to win the cascade).

const CANONICAL_REPO =
  "https://github.com/agent-harness-atlas/agent-harness-atlas.github.io";

for (const path of ["/index.html", "/agent.html#pi"]) {
  test.describe(`GitHub link on ${path}`, () => {
    test("exists, points at the canonical repo, opens safely", async ({ page }) => {
      await page.goto(path);
      const gh = page.locator("#ghLink");
      await expect(gh, "GitHub link should be present").toHaveCount(1);
      await expect(gh).toBeVisible();
      // Exact canonical repo URL — guards against pointing at the old personal
      // repo (Bojun-Vvibe/agent-harness) or a stale name.
      await expect(gh).toHaveAttribute("href", CANONICAL_REPO);
      // New tab + noopener (no reverse-tabnabbing).
      await expect(gh).toHaveAttribute("target", "_blank");
      const rel = (await gh.getAttribute("rel")) || "";
      expect(rel, "rel must harden the new tab").toContain("noopener");
      // It carries an inline SVG (the octocat), not a broken/empty anchor.
      await expect(gh.locator("svg")).toHaveCount(1);
    });

    test("renders in the same grey as its sibling icon buttons (not accent-red)", async ({
      page,
    }) => {
      await page.goto(path);
      const ghColor = await page
        .locator("#ghLink")
        .evaluate((el) => getComputedStyle(el).color);
      // The theme toggle is the canonical reference icon-btn colour.
      const refColor = await page
        .locator("#themeBtn")
        .evaluate((el) => getComputedStyle(el).color);
      expect(
        ghColor,
        "GitHub icon must match the muted icon-btn colour, not the rust accent",
      ).toBe(refColor);
    });

    test("sits in the topbar, aligned with the other icon buttons", async ({ page }) => {
      await page.goto(path);
      const gh = page.locator("#ghLink");
      const theme = page.locator("#themeBtn");
      const ghBox = await gh.boundingBox();
      const themeBox = await theme.boundingBox();
      expect(ghBox, "GitHub link should have a box").not.toBeNull();
      expect(themeBox).not.toBeNull();
      // Same row: vertical centres within 2px of each other.
      const ghMid = ghBox!.y + ghBox!.height / 2;
      const themeMid = themeBox!.y + themeBox!.height / 2;
      expect(Math.abs(ghMid - themeMid)).toBeLessThanOrEqual(2);
      // Same square size as the sibling button (34×34 icon-btn).
      expect(Math.abs(ghBox!.width - themeBox!.width)).toBeLessThanOrEqual(1);
      expect(Math.abs(ghBox!.height - themeBox!.height)).toBeLessThanOrEqual(1);
    });
  });
}
