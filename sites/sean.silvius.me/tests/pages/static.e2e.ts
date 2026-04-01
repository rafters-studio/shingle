import { test, expect } from "@playwright/test";

test.describe("Privacy page", () => {
  test("renders privacy policy content", async ({ page }) => {
    await page.goto("/privacy/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(/privacy/i);
    await expect(page.locator(".prose")).toBeVisible();
  });

  test("has last updated date", async ({ page }) => {
    await page.goto("/privacy/");

    // Be more specific - look for the date format
    await expect(page.getByText("Last updated: May 10, 2025")).toBeVisible();
  });
});

test.describe("Terms page", () => {
  test("renders terms of service content", async ({ page }) => {
    await page.goto("/terms/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(/terms/i);
    await expect(page.locator(".prose")).toBeVisible();
  });
});

test.describe("Connect page", () => {
  test("renders connect page", async ({ page }) => {
    await page.goto("/connect/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("page loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/connect/");
    await page.waitForLoadState("networkidle");

    // Filter out transient dev-server cache errors and Astro island hydration
    // failures from dynamic imports during cold dev server starts
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("Outdated Optimize Dep") &&
        !e.includes("Failed to fetch dynamically imported module") &&
        !e.includes("[astro-island] Error hydrating") &&
        !e.includes("Failed to load resource: the server responded with a status of 404"),
    );
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe("404 handling", () => {
  test("non-existent page returns proper error", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist-12345/");

    expect(response?.status()).toBe(404);
  });
});
