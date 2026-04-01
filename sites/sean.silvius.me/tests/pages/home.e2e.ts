import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders page title and description", async ({ page }) => {
    await expect(page).toHaveTitle(/Sean Silvius/);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("displays featured posts section", async ({ page }) => {
    const featuredSection = page.getByRole("heading", { name: /featured/i });
    await expect(featuredSection).toBeVisible();
  });

  test("displays recent posts", async ({ page }) => {
    // Posts are in sections within the feed
    const postCards = page.locator("section[role='feed'] section");
    await expect(postCards.first()).toBeVisible();
  });

  test("has working navigation to posts", async ({ page }) => {
    // Nav link is labeled "index"
    const postsLink = page.getByRole("menuitem", { name: /index/i });
    await expect(postsLink).toBeVisible();
    await postsLink.click();
    await expect(page).toHaveURL(/\/posts\//);
  });

  test("has footer with links", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer.getByRole("link", { name: /privacy/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /terms/i })).toBeVisible();
  });
});
