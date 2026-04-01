import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders page title", async ({ page }) => {
    await expect(page).toHaveTitle(/Sean Silvius/);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("has lang attribute", async ({ page }) => {
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBe("en");
  });

  test("has meta description", async ({ page }) => {
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description).toBeTruthy();
  });

  test("page loads without critical console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(errors).toHaveLength(0);
  });
});

test.describe("404 handling", () => {
  test("non-existent page returns proper error", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist-12345/");

    expect(response?.status()).toBe(404);
  });
});
