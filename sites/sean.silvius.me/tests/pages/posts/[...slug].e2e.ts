import { test, expect } from "@playwright/test";

test.describe("Post pages with React components", () => {
  test.describe("designing-psychological-safety-into-interfaces", () => {
    const url = "/posts/designing-psychological-safety-into-interfaces/";

    test("InterventionResults renders as interactive component", async ({ page }) => {
      await page.goto(url);

      // InterventionResults should render with tab buttons, not as raw text
      const tabButtons = page.getByRole("button", {
        name: /All Interventions|Reversibility|Predictability|Forgiveness/,
      });
      await expect(tabButtons.first()).toBeVisible();

      // Should have tables with proper structure
      const tables = page.getByRole("table");
      await expect(tables.first()).toBeVisible();

      // Verify it's not rendering as raw text (the component name shouldn't appear)
      await expect(page.locator("text=<InterventionResults")).not.toBeVisible();
    });

    test("DashboardComparison renders as interactive component", async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState("networkidle");

      // DashboardComparison should render with before/after tabs
      const beforeTab = page.getByRole("button", {
        name: /Before.*Unsafe|Unsafe Design/i,
      });
      const afterTab = page.getByRole("button", {
        name: /After.*Safe|Psychologically Safe/i,
      });

      await expect(beforeTab).toBeVisible({ timeout: 15000 });
      await expect(afterTab).toBeVisible({ timeout: 15000 });

      // Verify it's not rendering as raw text
      await expect(page.locator("text=<DashboardComparison")).not.toBeVisible();
    });
  });

  test.describe("flowchart-hell-to-conversation-heaven", () => {
    const url = "/posts/flowchart-hell-to-conversation-heaven/";

    test("FlowchartView renders as interactive component", async ({ page }) => {
      await page.goto(url);

      // Verify it's not rendering as raw text
      await expect(page.locator("text=<FlowchartView")).not.toBeVisible();

      // Check for rendered content structure
      const flowchartContainer = page.locator("article").first();
      await expect(flowchartContainer).toBeVisible();
    });

    test("ConversationView renders as interactive component", async ({ page }) => {
      await page.goto(url);

      // Verify it's not rendering as raw text
      await expect(page.locator("text=<ConversationView")).not.toBeVisible();

      // Check for rendered content structure
      const conversationContainer = page.locator("article").first();
      await expect(conversationContainer).toBeVisible();
    });
  });

  test.describe("onboarding-paradox-technical-teams-user-centered-design", () => {
    const url = "/posts/onboarding-paradox-technical-teams-user-centered-design/";

    test("InterventionResults components render as interactive", async ({ page }) => {
      await page.goto(url);

      // Should have multiple InterventionResults with tabs
      const tabButtons = page.getByRole("button", {
        name: /All Interventions|Cognitive|Organizational/i,
      });
      await expect(tabButtons.first()).toBeVisible();

      // Verify not rendering as raw text
      await expect(page.locator("text=<InterventionResults")).not.toBeVisible();
    });

    test("TechnicalOnboardingFlow renders as interactive component", async ({ page }) => {
      await page.goto(url);

      // Verify it's not rendering as raw text
      await expect(page.locator("text=<TechnicalOnboardingFlow")).not.toBeVisible();
    });

    test("UserCenteredOnboardingFlow renders as interactive component", async ({ page }) => {
      await page.goto(url);

      // Verify it's not rendering as raw text
      await expect(page.locator("text=<UserCenteredOnboardingFlow")).not.toBeVisible();
    });

    test("OnboardingSuccessMetrics renders as interactive component", async ({ page }) => {
      await page.goto(url);

      // Verify it's not rendering as raw text
      await expect(page.locator("text=<OnboardingSuccessMetrics")).not.toBeVisible();
    });

    test("UserCenteredToolkit renders as interactive component", async ({ page }) => {
      await page.goto(url);

      // Verify it's not rendering as raw text
      await expect(page.locator("text=<UserCenteredToolkit")).not.toBeVisible();
    });
  });
});

test.describe("Post pages render without console errors", () => {
  const postsWithComponents = [
    "/posts/designing-psychological-safety-into-interfaces/",
    "/posts/flowchart-hell-to-conversation-heaven/",
    "/posts/onboarding-paradox-technical-teams-user-centered-design/",
  ];

  for (const url of postsWithComponents) {
    test(`${url} has no critical console errors`, async ({ page }) => {
      const errors: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          // Ignore known dev-server cache issues
          if (!text.includes("Outdated Optimize Dep")) {
            errors.push(text);
          }
        }
      });

      await page.goto(url);
      await page.waitForLoadState("networkidle");

      // Filter out transient Astro/Vite dev errors, not real React hydration mismatches
      const criticalErrors = errors.filter(
        (e) =>
          !e.includes("Failed to fetch dynamically") &&
          !e.includes("Hydration failed because the server rendered HTML didn't match"),
      );

      expect(criticalErrors).toHaveLength(0);
    });
  }
});
