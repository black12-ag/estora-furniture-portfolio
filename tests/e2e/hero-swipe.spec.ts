/**
 * Playwright end-to-end test for HeroSlider touch swipe.
 *
 * Runs in CI via `.github/workflows/ci-quality.yml` (npx playwright test).
 * Locally: `npx playwright install --with-deps && npx playwright test`.
 *
 * Verifies:
 *  - Fast swipe left advances slide
 *  - Fast swipe right returns
 *  - Interrupted gesture (pointercancel) does not advance
 *  - Small drag below threshold does not advance
 */
import { test, expect, devices } from "@playwright/test";

test.use({ ...devices["iPhone 13"] });

async function currentSlide(page: import("@playwright/test").Page) {
  const label = await page.locator('[role="group"][aria-roledescription="slide"]').first().getAttribute("aria-label");
  return label ?? "";
}

async function swipe(page: import("@playwright/test").Page, from: number, to: number, steps = 10, cancel = false) {
  const target = page.locator('[aria-roledescription="carousel"]');
  const box = await target.boundingBox();
  if (!box) throw new Error("carousel not found");
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + from, y);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    const x = box.x + from + ((to - from) * i) / steps;
    await page.mouse.move(x, y, { steps: 1 });
  }
  if (cancel) {
    // simulate pointercancel by dispatching directly
    await target.dispatchEvent("pointercancel", { pointerType: "touch" });
    await page.mouse.up();
  } else {
    await page.mouse.up();
  }
}

test.describe("HeroSlider touch swipe", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator('[aria-roledescription="carousel"]').waitFor();
  });

  test("quick left swipe advances to next slide", async ({ page }) => {
    const before = await currentSlide(page);
    await swipe(page, 300, 60, 8);
    await expect
      .poll(async () => currentSlide(page), { timeout: 2000 })
      .not.toBe(before);
  });

  test("quick right swipe returns to previous slide", async ({ page }) => {
    await swipe(page, 300, 60, 8);
    const after = await currentSlide(page);
    await swipe(page, 60, 320, 8);
    await expect
      .poll(async () => currentSlide(page), { timeout: 2000 })
      .not.toBe(after);
  });

  test("small drag below threshold does not change slide", async ({ page }) => {
    const before = await currentSlide(page);
    await swipe(page, 200, 220, 4); // 20px < 50px threshold
    await page.waitForTimeout(400);
    expect(await currentSlide(page)).toBe(before);
  });

  test("interrupted gesture (pointercancel) does not change slide", async ({ page }) => {
    const before = await currentSlide(page);
    await swipe(page, 300, 60, 6, /* cancel */ true);
    await page.waitForTimeout(400);
    expect(await currentSlide(page)).toBe(before);
  });
});
