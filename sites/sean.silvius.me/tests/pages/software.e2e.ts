import { test, expect } from "@playwright/test";

test.describe("Software listing page", () => {
  test("renders software heading", async ({ page }) => {
    await page.goto("/software/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(/software/i);
  });

  test("displays Legion project card", async ({ page }) => {
    await page.goto("/software/");

    await expect(page.getByRole("heading", { name: /legion/i })).toBeVisible();
    await expect(page.getByText("Rust", { exact: true })).toBeVisible();
    await expect(page.getByText("SQLite", { exact: true })).toBeVisible();
    await expect(page.getByText("Tantivy", { exact: true })).toBeVisible();
    await expect(page.getByText("MIT", { exact: true })).toBeVisible();
  });

  test("has GitHub and Details links", async ({ page }) => {
    await page.goto("/software/");

    const sourceLink = page.getByRole("link", { name: /source/i });
    await expect(sourceLink).toBeVisible();
    await expect(sourceLink).toHaveAttribute("href", "https://github.com/ssilvius/legion");

    const detailsLink = page.getByRole("link", { name: /details/i });
    await expect(detailsLink).toBeVisible();
    await expect(detailsLink).toHaveAttribute("href", "/software/legion/");
  });
});

test.describe("Legion detail page", () => {
  test("renders LegionHero canvas", async ({ page }) => {
    await page.goto("/software/legion/");

    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();
  });

  test("displays documentation sections", async ({ page }) => {
    await page.goto("/software/legion/");

    await expect(page.getByText(/Install/)).toBeVisible();
    await expect(page.getByText(/Usage/)).toBeVisible();
    await expect(page.getByText(/How It Works/)).toBeVisible();
    await expect(page.getByText(/Claude Code Hooks/)).toBeVisible();
    await expect(page.getByText(/Architecture/)).toBeVisible();
  });

  test("has GitHub source link", async ({ page }) => {
    await page.goto("/software/legion/");

    const sourceLink = page.getByRole("link", { name: /source/i });
    await expect(sourceLink).toBeVisible();
    await expect(sourceLink).toHaveAttribute("href", "https://github.com/ssilvius/legion");
  });

  test("has back link to software listing", async ({ page }) => {
    await page.goto("/software/legion/");

    const backLink = page.getByRole("link", { name: /back to software/i });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/software/");
  });

  test("page loads without critical console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (!text.includes("Outdated Optimize Dep")) {
          errors.push(text);
        }
      }
    });

    await page.goto("/software/legion/");
    await page.waitForLoadState("networkidle");

    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("Failed to fetch dynamically") &&
        !e.includes("Hydration failed because the server rendered HTML didn't match"),
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
