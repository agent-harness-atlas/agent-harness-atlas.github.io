import { test, expect } from "@playwright/test";

// F07: detail page shows an evidence-basis label matching analysis JSON.
const SOURCE = ["codex", "pi", "opencode", "aider", "cline", "gemini-cli"];
const DOCS = ["claude-code", "cursor"];

for (const id of SOURCE) {
  test(`${id} labelled source basis`, async ({ page }) => {
    await page.goto(`/agent.html#${id}`);
    const label = page.getByTestId("evidence-basis");
    await expect(label).toBeVisible();
    expect(await label.getAttribute("data-basis")).toBe("source");
  });
}

for (const id of DOCS) {
  test(`${id} labelled docs basis with evidence note`, async ({ page }) => {
    await page.goto(`/agent.html#${id}`);
    const label = page.getByTestId("evidence-basis");
    await expect(label).toBeVisible();
    expect(await label.getAttribute("data-basis")).toBe("docs");
    // docs basis must render the evidenceNote text
    await expect(label.locator(".basis-note")).not.toHaveCount(0);
    const note = await label.locator(".basis-note").innerText();
    expect(note.trim().length).toBeGreaterThan(8);
  });
}

test("basis label is bilingual-aware (switches with lang)", async ({ page }) => {
  await page.goto("/agent.html#codex");
  await expect(page.locator('[data-testid="evidence-basis"] .basis-tag')).toHaveText("源码基准");
  await page.getByRole("button", { name: "Switch language" }).click();
  await expect(page.locator('[data-testid="evidence-basis"] .basis-tag')).toHaveText("Source basis");
});
