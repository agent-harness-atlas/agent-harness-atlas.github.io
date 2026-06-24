import { test, expect } from "@playwright/test";

// F08: zh/en toggle across the whole site, persisted, consistent cross-page.
test("language toggles and persists across reload", async ({ page }) => {
  await page.goto("/index.html");
  // default zh: the h1 contains the Chinese phrase
  await expect(page.locator("#h1")).toContainText("源码级横评");
  await page.getByRole("button", { name: "Switch language" }).click();
  await expect(page.locator("#h1")).toContainText("source-level benchmark");
  expect(await page.evaluate(() => localStorage.getItem("atlas:lang"))).toBe("en");
  // reload → still en
  await page.reload();
  await expect(page.locator("#h1")).toContainText("source-level benchmark");
  expect(await page.evaluate(() => document.documentElement.lang)).toBe("en");
});

test("language is consistent matrix → detail", async ({ page }) => {
  await page.goto("/index.html");
  await page.getByRole("button", { name: "Switch language" }).click(); // → en
  await page.goto("/agent.html#codex");
  // verdict label should be the EN UI string "Verdict", dimension EN labels present
  expect(await page.evaluate(() => document.documentElement.lang)).toBe("en");
  await expect(page.locator(".vlabel")).toContainText("Verdict");
});

test("dimension header shows EN sublabel only in zh mode", async ({ page }) => {
  await page.goto("/index.html");
  // zh mode: header has both zh name and an .dim-en sublabel
  await expect(page.locator("#head .dim-en").first()).toBeVisible();
  await page.getByRole("button", { name: "Switch language" }).click(); // → en
  await expect(page.locator("#head .dim-en")).toHaveCount(0);
});
