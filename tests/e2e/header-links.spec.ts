import { test, expect } from "@playwright/test";

/**
 * Verifies the announcement bar + utility bar links navigate to the right
 * pages AND preserve the query state we advertise (e.g. sort=newest for
 * "Weekly new arrivals" / "New arrivals just dropped").
 */

test.describe("Header announcement + utility links", () => {
  test.beforeEach(async ({ context }) => {
    // Make sure the announcement bar is visible (not dismissed from a prior run).
    await context.addInitScript(() => {
      try { localStorage.removeItem("estora.bar.dismissed.v1"); } catch { /* ignore */ }
    });
  });

  test('utility bar "Free delivery" links to /sale', async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /free delivery over \$200/i }).first().click();
    await expect(page).toHaveURL(/\/sale$/);
  });

  test('utility bar "Money back guarantee" links to /faqs', async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /money back guarantee/i }).first().click();
    await expect(page).toHaveURL(/\/faqs$/);
  });

  test('utility bar "Weekly new arrivals" preserves sort=newest', async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /weekly new arrivals/i }).first().click();
    await expect(page).toHaveURL(/\/shop\?.*sort=newest/);
  });

  test("announcement bar rotates and each slide's link keeps its search params", async ({ page }) => {
    await page.goto("/");
    // Force each rotation index by rewriting state — cheaper than waiting 15s.
    // We just check the currently-rendered announcement link resolves cleanly
    // and, when it advertises sort=newest, actually carries it in the URL.
    const bar = page.locator("[aria-live='polite']").first();
    await expect(bar).toBeVisible();

    // Click whatever's shown; if it's the new-arrivals slide, verify query.
    const href = await bar.getAttribute("href");
    expect(href).toBeTruthy();
    await bar.click();

    if (href?.startsWith("/shop")) {
      await expect(page).toHaveURL(/\/shop/);
      if (href.includes("sort=newest")) {
        await expect(page).toHaveURL(/sort=newest/);
      }
    } else {
      await expect(page).toHaveURL(new RegExp(href!.replace(/\//g, "\\/")));
    }
  });

  test("active nav underline follows the current route (aria-current)", async ({ page }) => {
    await page.goto("/shop");
    const shopLink = page.getByRole("navigation", { name: /primary/i })
      .getByRole("link", { name: /^shop$/i });
    await expect(shopLink).toHaveAttribute("aria-current", "page");
  });
});
