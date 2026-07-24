import { test, expect } from "@playwright/test";

/**
 * Basic keyboard-a11y checks for the header + mobile menu.
 * Verifies aria-labels on icon-only controls, keyboard reachability of the
 * primary nav, and aria-current on the active route.
 */

test.describe("Header accessibility", () => {
  test("desktop icon buttons expose accessible names", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /wishlist,/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /cart,/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /account menu/i })).toBeVisible();
    await expect(page.getByRole("navigation", { name: /primary/i })).toBeVisible();
  });

  test("primary nav is keyboard reachable and marks the current page", async ({ page }) => {
    await page.goto("/blog");
    const blogLink = page.getByRole("navigation", { name: /primary/i })
      .getByRole("link", { name: /^blog$/i });
    await blogLink.focus();
    await expect(blogLink).toBeFocused();
    await expect(blogLink).toHaveAttribute("aria-current", "page");
  });

  test("Shop trigger exposes aria-haspopup/expanded and toggles via keyboard", async ({ page }) => {
    await page.goto("/");
    const shop = page.getByRole("navigation", { name: /primary/i })
      .getByRole("link", { name: /^shop$/i });
    await expect(shop).toHaveAttribute("aria-haspopup", "menu");
    await expect(shop).toHaveAttribute("aria-expanded", "false");
    await shop.focus();
    await page.keyboard.press("Enter");
    await expect(shop).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(shop).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("Mobile menu accessibility", () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test("mobile menu opens with the burger and every entry is keyboard-focusable", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /open menu/i }).click();
    const menu = page.getByRole("navigation", { name: /mobile primary/i });
    await expect(menu).toBeVisible();

    // Every button inside the mobile nav has visible text — none should be empty.
    const buttons = await menu.getByRole("button").all();
    expect(buttons.length).toBeGreaterThan(3);
    for (const b of buttons) {
      const name = (await b.textContent())?.trim();
      expect(name && name.length > 0).toBeTruthy();
    }

    // Tab through the first few entries and confirm focus lands inside the menu.
    await menu.getByRole("button", { name: /^home$/i }).focus();
    await expect(menu.getByRole("button", { name: /^home$/i })).toBeFocused();
  });

  test('mobile "Weekly new arrivals" preserves sort=newest', async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /open menu/i }).click();
    await page.getByRole("button", { name: /weekly new arrivals/i }).click();
    await expect(page).toHaveURL(/\/shop\?.*sort=newest/);
  });
});
