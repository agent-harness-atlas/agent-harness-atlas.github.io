import { expect, test } from "@playwright/test";

// Branding & chrome regressions (Bojun's two asks on this pass):
//   1. Favicon is the chess-knight SVG, present on BOTH pages and actually served.
//   2. The detail-page version badge ("4.0") in the topbar is gone.
// e2e runs against the built site (vite preview over dist/), so these assert the
// production bundle — favicon copied from public/, base-rewritten href resolving.

test.describe("favicon — chess knight on both pages", () => {
  for (const path of ["/index.html", "/agent.html#codex"]) {
    test(`declares an SVG favicon on ${path}`, async ({ page }) => {
      await page.goto(path);
      const link = page.locator('link[rel="icon"]');
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute("type", "image/svg+xml");
      const href = await link.getAttribute("href");
      expect(href, "favicon href should point at favicon.svg").toMatch(/favicon\.svg$/);
    });

    test(`favicon asset is actually served (200 + svg) from ${path}`, async ({ page, request }) => {
      await page.goto(path);
      const href = await page.locator('link[rel="icon"]').getAttribute("href");
      // Resolve the (possibly relative, base-rewritten) href against the page URL.
      const resolved = new URL(href!, page.url()).toString();
      const res = await request.get(resolved);
      expect(res.status(), `favicon ${resolved} should be served`).toBe(200);
      const ct = res.headers()["content-type"] || "";
      expect(ct).toContain("svg");
      const body = await res.text();
      // The knight path is the same silhouette as the in-page topbar logo.
      expect(body).toContain("<svg");
      expect(body.toLowerCase()).toContain("knight");
    });
  }

  test("favicon SVG uses the brand rust fill (not a generic placeholder)", async ({
    page,
    request,
  }) => {
    await page.goto("/index.html");
    const href = await page.locator('link[rel="icon"]').getAttribute("href");
    const res = await request.get(new URL(href!, page.url()).toString());
    expect(res.status()).toBe(200);
    expect((await res.text()).toLowerCase()).toContain("#c96442");
  });
});

test.describe("detail page no longer shows a 4.0 version badge", () => {
  test("topbar has no #ver / .ver version element", async ({ page }) => {
    await page.goto("/agent.html#codex");
    await expect(page.locator("#ver")).toHaveCount(0);
    await expect(page.locator(".topbar .ver")).toHaveCount(0);
  });

  test('the literal "4.0" appears nowhere in the topbar', async ({ page }) => {
    await page.goto("/agent.html#claude-code");
    const barText = await page.locator(".topbar").innerText();
    expect(barText).not.toContain("4.0");
  });

  test("brand still renders the Atlas wordmark and knight logo (we removed only the badge)", async ({
    page,
  }) => {
    await page.goto("/agent.html#gemini-cli");
    await expect(page.locator(".brand .mark")).toContainText("Atlas");
    // the topbar logo svg is still there
    await expect(page.locator(".brand .logo svg")).toHaveCount(1);
  });
});
