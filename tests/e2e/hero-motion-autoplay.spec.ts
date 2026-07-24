/**
 * Playwright tests verifying HeroSlider respects prefers-reduced-motion and
 * that autoplay pauses during touch swipes and resumes on release/cancel.
 *
 * Run: npx playwright test tests/e2e/hero-motion-autoplay.spec.ts
 */
import { test, expect, devices, type Page } from "@playwright/test";

const carousel = '[aria-roledescription="carousel"]';
const slide = '[role="group"][aria-roledescription="slide"]';

async function getSlideLabel(page: Page) {
  return (await page.locator(slide).first().getAttribute("aria-label")) ?? "";
}

async function getSlideTransform(page: Page) {
  return await page.locator(slide).first().evaluate((el) => {
    const s = getComputedStyle(el as HTMLElement);
    return { transform: s.transform, transition: s.transition };
  });
}

async function pressStartOnCarousel(page: Page, xOffset: number) {
  const box = await page.locator(carousel).boundingBox();
  if (!box) throw new Error("carousel not visible");
  await page.mouse.move(box.x + xOffset, box.y + box.height / 2);
  await page.mouse.down();
  return { box };
}

test.describe("HeroSlider — prefers-reduced-motion", () => {
  test.use({ ...devices["Desktop Chrome"] });

  test("no live swipe-follow translate under reduce", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.locator(carousel).waitFor();

    const before = await getSlideTransform(page);
    // Start a drag and move without releasing — reduced-motion should not
    // apply the translate3d follow.
    const { box } = await pressStartOnCarousel(page, 400);
    await page.mouse.move(box.x + 250, box.y + box.height / 2, { steps: 6 });
    await page.waitForTimeout(80);
    const during = await getSlideTransform(page);
    await page.mouse.up();

    // Transform stays 'none' (or identity) because the component skips dx updates.
    expect(during.transform === "none" || during.transform === before.transform).toBe(true);
    // Transition is set to 'none' when reducedMotion is true.
    expect(during.transition.split(" ")[0]).toMatch(/^(none|all)$/);
  });

  test("autoplay does not advance slides under reduce", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.locator(carousel).waitFor();
    const before = await getSlideLabel(page);
    // Autoplay interval in code is 6s; wait long enough to catch any tick.
    await page.waitForTimeout(6500);
    expect(await getSlideLabel(page)).toBe(before);
  });

  test("no live translate3d follow while dragging under reduce (control: no-preference does follow)", async ({ page }) => {
    // Control case with motion enabled: transform should change during drag.
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await page.locator(carousel).waitFor();

    const { box } = await pressStartOnCarousel(page, 400);
    await page.mouse.move(box.x + 250, box.y + box.height / 2, { steps: 6 });
    await page.waitForTimeout(50);
    const during = await getSlideTransform(page);
    await page.mouse.up();
    // Motion-enabled: expect a non-identity translate3d during drag.
    expect(during.transform).not.toBe("none");
    expect(during.transform).toMatch(/matrix/);
  });
});

test.describe("HeroSlider — autoplay pause/resume around swipes", () => {
  test.use({ ...devices["iPhone 13"] });

  test("autoplay pauses during a swipe and resumes after release (no advance for small drag)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await page.locator(carousel).waitFor();
    const before = await getSlideLabel(page);

    // Hold a small drag (<50px threshold) for longer than one autoplay tick.
    const box = await page.locator(carousel).boundingBox();
    if (!box) throw new Error("no box");
    await page.mouse.move(box.x + 200, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 210, box.y + box.height / 2, { steps: 2 });
    // Wait past one autoplay interval (6s). If not paused, slide would advance.
    await page.waitForTimeout(6500);
    // Still on the same slide — autoplay is paused during the gesture.
    expect(await getSlideLabel(page)).toBe(before);
    await page.mouse.up();

    // After release, autoplay resumes and eventually advances.
    await expect
      .poll(async () => getSlideLabel(page), { timeout: 8000, intervals: [500, 1000] })
      .not.toBe(before);
  });

  test("interrupted gesture (pointercancel) resumes autoplay without advancing", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await page.locator(carousel).waitFor();
    const before = await getSlideLabel(page);

    const box = await page.locator(carousel).boundingBox();
    if (!box) throw new Error("no box");
    await page.mouse.move(box.x + 300, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 120, box.y + box.height / 2, { steps: 6 });

    // Cancel the gesture — endDrag runs with active=false path via pointercancel,
    // but the component treats cancel same as pointerup. Simulate a real cancel:
    await page.locator(carousel).dispatchEvent("pointercancel", { pointerType: "touch" });
    await page.mouse.up();

    // Immediately after cancel: no advance yet.
    expect(await getSlideLabel(page)).toBe(before);

    // Autoplay should have resumed (paused reset) — a later tick advances slide.
    await expect
      .poll(async () => getSlideLabel(page), { timeout: 8000, intervals: [500, 1000] })
      .not.toBe(before);
  });

  test("hovering the carousel pauses autoplay (desktop-style), leaves it resumes", async ({ browser }) => {
    // Use a desktop context for real hover semantics.
    const ctx = await browser.newContext({ ...devices["Desktop Chrome"] });
    const page = await ctx.newPage();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await page.locator(carousel).waitFor();
    const before = await getSlideLabel(page);

    const box = await page.locator(carousel).boundingBox();
    if (!box) throw new Error("no box");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(6500);
    expect(await getSlideLabel(page)).toBe(before); // paused via hover

    await page.mouse.move(0, 0); // leave
    await expect
      .poll(async () => getSlideLabel(page), { timeout: 8000, intervals: [500, 1000] })
      .not.toBe(before);
    await ctx.close();
  });
});
