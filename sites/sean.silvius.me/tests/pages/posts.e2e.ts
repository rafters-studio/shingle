import { test, expect } from "@playwright/test";

test.describe("Posts listing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/posts/");
  });

  test("renders posts heading", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("displays multiple post cards", async ({ page }) => {
    const articles = page.locator("article");
    await expect(articles).toHaveCount(await articles.count());
    expect(await articles.count()).toBeGreaterThan(5);
  });

  test("post cards have title text", async ({ page }) => {
    // Title is in header div, not a heading element
    const firstArticle = page.locator("article").first();
    const header = firstArticle.locator("header");
    await expect(header).toBeVisible();
    const titleText = await header.locator("div").first().textContent();
    expect(titleText?.trim().length).toBeGreaterThan(0);
  });

  test("post cards link to post pages", async ({ page }) => {
    const firstLink = page.locator("article").first().getByRole("link").first();
    await firstLink.click();
    await expect(page).toHaveURL(/\/posts\/.+\//);
  });

  test("posts are sorted by date (newest first)", async ({ page }) => {
    const dates = await page.locator("time").allTextContents();
    const parsedDates = dates.map((d) => new Date(d).getTime());

    for (let i = 1; i < parsedDates.length; i++) {
      expect(parsedDates[i - 1]).toBeGreaterThanOrEqual(parsedDates[i]);
    }
  });
});

test.describe("Individual post page", () => {
  test("renders post content", async ({ page }) => {
    await page.goto("/posts/active-listening/");

    // Title is in a div, not h1
    await expect(page.locator("article")).toBeVisible();
    await expect(page.locator(".prose")).toBeVisible();
  });

  test("displays author and date", async ({ page }) => {
    await page.goto("/posts/active-listening/");

    await expect(page.locator("time")).toBeVisible();
    await expect(page.getByText(/Sean Silvius/)).toBeVisible();
  });

  test("has proper reading time", async ({ page }) => {
    await page.goto("/posts/active-listening/");

    await expect(page.getByText(/min read/)).toBeVisible();
  });

  test("has navigation via topbar", async ({ page }) => {
    await page.goto("/posts/active-listening/");

    const indexLink = page.getByRole("menuitem", { name: /index/i });
    await expect(indexLink).toBeVisible();
  });
});
