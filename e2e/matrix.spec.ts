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

// --- F-detail-nav: clicking 详情 actually navigates to the detail page.
// Regression guard: a too-wide table once pushed the detail column outside the
// horizontal-scroll viewport, so the link was present in the DOM (href correct)
// but physically unclickable. href-only assertions missed it — this clicks for real. ---
test("clicking 详情 navigates to the detail page", async ({ page }) => {
  await page.goto("/index.html");
  const firstLink = page.locator("#body tr [data-testid^='detail-link-']").first();
  const id = (await firstLink.getAttribute("data-testid"))!.replace("detail-link-", "");
  await firstLink.click(); // real click — fails if the element is covered/offscreen
  await expect(page).toHaveURL(new RegExp(`agent\\.html#${id}$`));
  await expect(page.getByTestId("agent-title")).toBeVisible();
});

// --- F-detail-reachable: every detail link sits fully inside the scroll
// container's HORIZONTAL visible box — the actual regression was the detail
// column being pushed past the right edge of the horizontal-scroll viewport.
// (Vertical position is irrelevant: long tables scroll vertically by design,
// and Playwright auto-scrolls a row into view before clicking it.) ---
test("every detail link is within the horizontal scroll viewport", async ({ page }) => {
  await page.goto("/index.html");
  const report = await page.evaluate(() => {
    const scroll = document.querySelector(".scroll-x") as HTMLElement;
    const sr = scroll.getBoundingClientRect();
    const links = [...document.querySelectorAll("#body [data-testid^='detail-link-']")];
    return links.map((a) => {
      const r = a.getBoundingClientRect();
      return {
        id: a.getAttribute("data-testid"),
        // link's horizontal span must fit inside the scroll container's width
        withinH: r.right <= sr.right + 1 && r.left >= sr.left - 1,
      };
    });
  });
  expect(report.length).toBe(8);
  for (const r of report) {
    expect(r.withinH, `${r.id} must not be clipped past the scroll viewport's right edge`).toBe(true);
  }
  // and the table must not overflow its scroll container horizontally at all
  const overflow = await page.evaluate(() => {
    const scroll = document.querySelector(".scroll-x") as HTMLElement;
    return scroll.scrollWidth - scroll.clientWidth;
  });
  expect(overflow, "table should not overflow the scroll container at desktop width").toBeLessThanOrEqual(1);
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

// --- F-rank: rows ordered by overall score, highest first ---
test("rows are ranked by overall score descending", async ({ page }) => {
  await page.goto("/index.html");
  const overalls = await page
    .locator("#body tr [data-testid^='overall-']")
    .evaluateAll((els) =>
      els.map((e) => {
        const v = e.getAttribute("data-overall");
        return v && v !== "" ? Number(v) : -1; // pending sinks to bottom
      }),
    );
  expect(overalls.length).toBe(8);
  const sorted = [...overalls].sort((a, b) => b - a);
  expect(overalls).toEqual(sorted);
  // rank badges read 1..8 top-to-bottom
  const ranks = await page.locator("#body tr .agent-rank").allInnerTexts();
  expect(ranks.map((s) => s.trim())).toEqual(["1", "2", "3", "4", "5", "6", "7", "8"]);
});

// --- F-version: every agent row shows a tested version chip ---
test("every agent row shows a tested version", async ({ page }) => {
  await page.goto("/index.html");
  const vers = await page.locator("#body tr .agent-ver").allInnerTexts();
  expect(vers.length).toBe(8);
  for (const v of vers) expect(v.trim().length).toBeGreaterThan(0);
});

// --- F-version-precise: versions are precise (semver-like vX.Y[.Z]), never a
// vague "2026-W26 文档" week/docs placeholder (Bojun: 要精确的版本号) ---
test("versions are precise version numbers, not week/docs placeholders", async ({ page }) => {
  await page.goto("/index.html");
  const vers = await page.locator("#body tr .agent-ver").allInnerTexts();
  expect(vers.length).toBe(8);
  for (const raw of vers) {
    const v = raw.trim();
    expect(v, `"${v}" must look like a precise version vX.Y[.Z]`).toMatch(/^v\d+\.\d+(\.\d+)?$/);
    expect(v, `"${v}" must not contain a week/docs placeholder`).not.toMatch(/20\d\d-W\d|文档|docs/i);
  }
});

// --- F-no-vendor: the agent cell shows NO vendor label at all — only the
// version number (Bojun: 把开源/闭源也删掉) ---
test("agent cell shows version only, no vendor label", async ({ page }) => {
  await page.goto("/index.html");
  const cells = await page.locator("#body tr .agent-cell").evaluateAll((els) =>
    els.map((e) => {
      const ver = e.querySelector(".agent-ver");
      const verText = ver ? (ver.textContent || "").trim() : "";
      const vendorBlock = e.querySelector(".agent-vendor");
      // text inside the vendor block, minus the version chip text
      const vendorOnly = vendorBlock
        ? (vendorBlock.textContent || "").replace(verText, "").trim()
        : "";
      return { verText, vendorOnly };
    }),
  );
  expect(cells.length).toBe(8);
  for (const c of cells) {
    // version present…
    expect(c.verText.length).toBeGreaterThan(0);
    // …and NO leftover vendor wording (no 开源/闭源, no company names)
    expect(c.vendorOnly, `unexpected vendor text "${c.vendorOnly}"`).toBe("");
  }
});

// --- F-version-style: version is plain muted-grey text — no chip border/background
// (Bojun: 版本号不要带边框和背景色，改成灰色) ---
test("version is plain grey text without chip border or background", async ({ page }) => {
  await page.goto("/index.html");
  const ver = page.locator("#body tr .agent-ver").first();
  const style = await ver.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      borderTopWidth: cs.borderTopWidth,
      borderStyle: cs.borderTopStyle,
      bg: cs.backgroundColor,
      color: cs.color,
      faint: getComputedStyle(document.documentElement).getPropertyValue("--faint").trim(),
    };
  });
  // no visible border
  expect(parseFloat(style.borderTopWidth)).toBe(0);
  // transparent / no background fill
  expect(style.bg === "rgba(0, 0, 0, 0)" || style.bg === "transparent").toBe(true);
  // greyish (not the old Google blue) — blue channel must NOT dominate
  const m = style.color.match(/rgb[a]?\((\d+),\s*(\d+),\s*(\d+)/);
  expect(m).not.toBeNull();
  const [r, g, b] = [Number(m![1]), Number(m![2]), Number(m![3])];
  expect(Math.max(r, g, b) - Math.min(r, g, b), "should be near-neutral grey").toBeLessThan(40);
  void g;
});

// --- F-equalcols: the 6 dimension columns render at equal width ---
test("the 6 dimension columns are equal width", async ({ page }) => {
  await page.goto("/index.html");
  const widths = await page
    .locator("#cols col.c-dim")
    .evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().width)));
  expect(widths.length).toBe(6);
  const min = Math.min(...widths);
  const max = Math.max(...widths);
  expect(max - min).toBeLessThanOrEqual(1); // identical within sub-pixel rounding
});

// --- F-noclip: header English sub-labels never wrap or truncate (Bojun: subtitle 不允许换行或截断) ---
test("dimension header sub-labels are single-line and not clipped", async ({ page }) => {
  await page.goto("/index.html");
  const report = await page.locator("thead th .dim-en").evaluateAll((els) =>
    els.map((e) => {
      const lh = parseFloat(getComputedStyle(e).lineHeight) || 12;
      const lines = Math.round(e.getBoundingClientRect().height / lh);
      return {
        text: (e.textContent || "").trim(),
        lines,
        clipped: e.scrollWidth > e.clientWidth + 1,
      };
    }),
  );
  expect(report.length).toBe(6);
  for (const r of report) {
    expect(r.lines, `"${r.text}" should be 1 line, got ${r.lines}`).toBe(1);
    expect(r.clipped, `"${r.text}" must not be clipped`).toBe(false);
  }
  // explicit guard for the longest label that previously broke mid-word
  const sandbox = report.find((r) => /PERMISSION/i.test(r.text));
  expect(sandbox?.lines).toBe(1);
  expect(sandbox?.clipped).toBe(false);
});
