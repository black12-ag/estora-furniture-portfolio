import { test, expect, type Page } from "@playwright/test";

/**
 * Guardrail: no horizontal overflow, no runaway CLS on any core route at
 * the breakpoints we design for. Runs on chromium-desktop only — we drive
 * the viewport ourselves.
 */

const ROUTES = [
  "/",
  "/shop",
  "/sale",
  "/blog",
  "/about",
  "/contact",
  "/faqs",
  "/cart",
  "/wishlist",
  "/checkout",
  "/product/marlow-wall-art",
];

const BREAKPOINTS: { name: string; width: number; height: number }[] = [
  { name: "320w",  width: 320,  height: 800 },
  { name: "375w",  width: 375,  height: 812 },
  { name: "768w",  width: 768,  height: 1024 },
  { name: "1280w", width: 1280, height: 900 },
];

async function assertNoHorizontalOverflow(page: Page, route: string, label: string) {
  // Wait for layout + fonts to settle so measurements are stable.
  await page.waitForLoadState("networkidle").catch(() => { /* ignore */ });
  await page.evaluate(() => document.fonts?.ready).catch(() => { /* ignore */ });

  const { scrollWidth, innerWidth, offender } = await page.evaluate(() => {
    const sw = document.documentElement.scrollWidth;
    const iw = window.innerWidth;
    let offender: { tag: string; cls: string; w: number } | null = null;
    if (sw > iw) {
      const all = Array.from(document.body.querySelectorAll<HTMLElement>("*"));
      for (const el of all) {
        const r = el.getBoundingClientRect();
        if (r.right > iw + 1) {
          offender = { tag: el.tagName, cls: el.className?.toString().slice(0, 120) ?? "", w: Math.round(r.right) };
          break;
        }
      }
    }
    return { scrollWidth: sw, innerWidth: iw, offender };
  });

  expect(
    scrollWidth,
    `Horizontal overflow on ${route} @ ${label}: scrollWidth=${scrollWidth} > innerWidth=${innerWidth}. First offender: ${JSON.stringify(offender)}`,
  ).toBeLessThanOrEqual(innerWidth + 1);
}

async function measureCLS(page: Page): Promise<number> {
  // PerformanceObserver was installed via addInitScript before navigation.
  await page.waitForTimeout(800); // give late-loading imgs a chance to shift
  return page.evaluate(() => (window as unknown as { __cls?: number }).__cls ?? 0);
}

test.describe("Layout guardrails", () => {
  for (const bp of BREAKPOINTS) {
    for (const route of ROUTES) {
      test(`${route} @ ${bp.name} — no horizontal overflow`, async ({ page }) => {
        await page.setViewportSize({ width: bp.width, height: bp.height });
        await page.addInitScript(() => {
          (window as unknown as { __cls: number }).__cls = 0;
          try {
            const po = new PerformanceObserver((list) => {
              for (const e of list.getEntries() as unknown as Array<{
                value: number; hadRecentInput: boolean;
              }>) {
                if (!e.hadRecentInput) {
                  (window as unknown as { __cls: number }).__cls += e.value;
                }
              }
            });
            po.observe({ type: "layout-shift", buffered: true } as PerformanceObserverInit);
          } catch { /* not supported — CLS check will just report 0 */ }
        });
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await assertNoHorizontalOverflow(page, route, bp.name);

        // Google's "good" CLS threshold is 0.1; give some slack for image-heavy pages.
        const cls = await measureCLS(page);
        expect(cls, `Excessive layout shift on ${route} @ ${bp.name}: CLS=${cls.toFixed(3)}`).toBeLessThan(0.25);
      });
    }
  }
});
