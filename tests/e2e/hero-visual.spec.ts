/**
 * Visual regression snapshots for the Home page hero area at multiple
 * viewport widths. Playwright compares against baseline PNGs under
 * `tests/e2e/hero-visual.spec.ts-snapshots/`. Update baselines with:
 *   npx playwright test --update-snapshots
 */
import { test, expect } from "@playwright/test";

const VIEWPORTS = [
  { name: "mobile-360", width: 360, height: 780 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1280", width: 1280, height: 800 },
  { name: "desktop-1440", width: 1440, height: 900 },
];

for (const v of VIEWPORTS) {
  test(`hero snapshot @ ${v.name}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" }); // stabilize
    await page.setViewportSize({ width: v.width, height: v.height });
    await page.goto("/");
    const hero = page.locator('[aria-roledescription="carousel"]').first();
    await hero.waitFor();
    // Wait for hero image to finish decoding to avoid preload/transition flakes.
    await page.waitForLoadState("networkidle");
    await expect(hero).toHaveScreenshot(`hero-${v.name}.png`, {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });
}
