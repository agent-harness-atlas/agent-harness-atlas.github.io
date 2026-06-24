import { test, expect } from "@playwright/test";

// F09: light/dark toggle, persisted, consistent cross-page.
test("theme toggles, changes background, persists", async ({ page }) => {
  await page.goto("/index.html");
  expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("light");
  const bgLight = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.getByRole("button", { name: "Toggle theme" }).click();
  expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");
  const bgDark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bgDark).not.toBe(bgLight);
  expect(await page.evaluate(() => localStorage.getItem("atlas:theme"))).toBe("dark");
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");
});

test("theme is consistent matrix → detail", async ({ page }) => {
  await page.goto("/index.html");
  await page.getByRole("button", { name: "Toggle theme" }).click(); // → dark
  await page.goto("/agent.html#pi");
  expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");
});
