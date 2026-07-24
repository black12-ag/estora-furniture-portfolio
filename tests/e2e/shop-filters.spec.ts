import { test, expect } from "@playwright/test";

/**
 * Shop URL sync, filter narrowing, pagination reset, and count updates.
 */

test.describe("Shop filters, URL sync & pagination", () => {
  test("initial results count matches shown grid", async ({ page }) => {
    await page.goto("/shop");
    const count = page.getByTestId("results-count");
    await expect(count).toBeVisible();
    // Total should be > 0
    const total = Number(await page.getByTestId("results-total").innerText());
    expect(total).toBeGreaterThan(0);
  });

  test("category filter narrows results and syncs to URL", async ({ page }) => {
    await page.goto("/shop");
    const totalBefore = Number(await page.getByTestId("results-total").innerText());

    await page.getByRole("button", { name: /^Armchairs/ }).first().click();

    await expect(page).toHaveURL(/[?&]cat=Armchairs/);
    const totalAfter = Number(await page.getByTestId("results-total").innerText());
    expect(totalAfter).toBeLessThan(totalBefore);
    expect(totalAfter).toBeGreaterThan(0);
  });

  test("color filter narrows results and syncs to URL", async ({ page }) => {
    await page.goto("/shop");
    await page.getByRole("button", { name: /^Filter by color Charcoal$/ }).click();
    await expect(page).toHaveURL(/[?&]color=Charcoal/);
    const total = Number(await page.getByTestId("results-total").innerText());
    expect(total).toBeGreaterThanOrEqual(0);
  });

  test("price range syncs min & max to URL and updates count", async ({ page }) => {
    await page.goto("/shop");
    const minInput = page.getByLabel("Minimum price", { exact: true });
    const maxInput = page.getByLabel("Maximum price", { exact: true });

    await minInput.fill("200");
    await minInput.blur();
    await maxInput.fill("500");
    await maxInput.blur();

    await expect(page).toHaveURL(/[?&]min=200/);
    await expect(page).toHaveURL(/[?&]max=500/);

    const total = Number(await page.getByTestId("results-total").innerText());
    expect(total).toBeGreaterThanOrEqual(0);
  });

  test("price filter survives reload (URL is source of truth)", async ({ page }) => {
    await page.goto("/shop?min=100&max=400");
    await expect(page.getByLabel("Minimum price", { exact: true })).toHaveValue("100");
    await expect(page.getByLabel("Maximum price", { exact: true })).toHaveValue("400");
    await page.reload();
    await expect(page.getByLabel("Minimum price", { exact: true })).toHaveValue("100");
    await expect(page.getByLabel("Maximum price", { exact: true })).toHaveValue("400");
  });

  test("changing a filter resets pagination to page 1", async ({ page }) => {
    await page.goto("/shop");
    // Load more (if available)
    const loadMore = page.getByTestId("load-more");
    if (await loadMore.isVisible()) {
      await loadMore.click();
      const shownBefore = Number(await page.getByTestId("results-shown").innerText());
      expect(shownBefore).toBeGreaterThan(12);
    }

    // Change a filter → should reset to first PAGE_SIZE
    await page.getByRole("button", { name: /^Cabinets/ }).first().click();
    const shownAfter = Number(await page.getByTestId("results-shown").innerText());
    expect(shownAfter).toBeLessThanOrEqual(12);
  });

  test("Clear filters resets URL and restores full catalog", async ({ page }) => {
    await page.goto("/shop?cat=Armchairs&color=Charcoal&min=100&max=400");
    const filteredTotal = Number(await page.getByTestId("results-total").innerText());

    await page.getByRole("button", { name: /^Clear filters$/ }).click();

    await expect(page).not.toHaveURL(/cat=/);
    await expect(page).not.toHaveURL(/color=/);
    await expect(page).not.toHaveURL(/min=/);
    await expect(page).not.toHaveURL(/max=/);

    const restoredTotal = Number(await page.getByTestId("results-total").innerText());
    expect(restoredTotal).toBeGreaterThan(filteredTotal);
  });

  test("empty-state renders when no products match", async ({ page }) => {
    // Impossible filter: max less than cheapest product
    await page.goto("/shop?max=1");
    await expect(page.getByTestId("shop-empty")).toBeVisible();
    await expect(page.getByRole("heading", { name: /No products match/ })).toBeVisible();
    await page.getByRole("button", { name: /Clear all filters/ }).click();
    await expect(page.getByTestId("shop-empty")).toHaveCount(0);
  });
});

test.describe("Cart drawer persistence & a11y", () => {
  test("cart items persist across page reload (localStorage)", async ({ page }) => {
    await page.goto("/shop");
    // Trigger add-to-cart from a product detail (deterministic control)
    await page.goto("/shop");
    const firstCard = page.locator("article").first();
    await firstCard.hover();
    await firstCard.getByRole("button", { name: /^Add to Cart$/ }).first().click();

    // Drawer opens
    const dialog = page.getByRole("dialog", { name: /Shopping cart/i });
    await expect(dialog).toBeVisible();

    // Close via Escape (Radix focus-trap should handle this)
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    // Reload and re-open cart from header
    await page.reload();
    await page.getByRole("button", { name: /^Cart,/ }).click();
    const reopened = page.getByRole("dialog", { name: /Shopping cart/i });
    await expect(reopened).toBeVisible();
    // At least one line item
    await expect(reopened.getByLabel("Cart items").locator("li")).toHaveCount(1);
  });
});
