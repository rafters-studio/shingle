import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

const pages = [
  { name: "Home", path: "/" },
  { name: "Posts", path: "/posts/" },
  { name: "Night Shift", path: "/night-shift/" },
  { name: "Stories", path: "/stories/" },
];

test.describe("Accessibility", () => {
  for (const { name, path } of pages) {
    test(`${name} page has no critical a11y violations`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .exclude("iframe")
        .disableRules([
          "color-contrast", // Design decision - can be addressed later
        ])
        .analyze();

      const criticalViolations = results.violations.filter((v) => v.impact === "critical");

      expect(criticalViolations).toEqual([]);
    });
  }

  test("images have alt text", async ({ page }) => {
    await page.goto("/");

    const images = page.locator("img");
    const count = await images.count();
    if (count === 0) return;

    const imageData = await images.evaluateAll((imgs) =>
      imgs.map((img) => ({
        alt: img.getAttribute("alt"),
        role: img.getAttribute("role"),
      })),
    );

    for (const { alt, role } of imageData) {
      const hasAlt = alt !== null && alt !== undefined;
      const isDecorative = role === "presentation" || role === "none";
      expect(hasAlt || isDecorative).toBe(true);
    }
  });

  test("interactive elements are keyboard accessible", async ({ page }) => {
    await page.goto("/");

    await page.keyboard.press("Tab");
    const firstFocused = page.locator(":focus");
    await expect(firstFocused).toBeVisible();
  });

  test("page has lang attribute", async ({ page }) => {
    await page.goto("/");

    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBe("en");
  });

  test("links have discernible text", async ({ page }) => {
    await page.goto("/");

    const results = await new AxeBuilder({ page }).withRules(["link-name"]).analyze();

    expect(results.violations).toEqual([]);
  });
});
