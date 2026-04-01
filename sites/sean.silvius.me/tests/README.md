# Testing Architecture

## Directory Structure

```
tests/
├── a11y/
│   └── pages.e2e.ts              # Accessibility tests (axe-core)
├── pages/
│   ├── posts/
│   │   └── [...slug].e2e.ts      # React component hydration tests
│   ├── home.e2e.ts               # Home page tests
│   ├── posts.e2e.ts              # Posts listing + individual post tests
│   └── static.e2e.ts             # Privacy, Terms, Connect pages
├── unit/
│   └── lib/
│       ├── utils.test.ts         # cn() utility tests
│       └── mdx-class-parser.test.ts  # MDX directive parser tests
└── setup.ts                      # Vitest setup
```

## Test File Naming

| Suffix     | Type       | Runner     | Purpose                   |
| ---------- | ---------- | ---------- | ------------------------- |
| `.test.ts` | Unit       | Vitest     | Pure functions, utilities |
| `.e2e.ts`  | End-to-end | Playwright | Full page behavior, a11y  |

## Running Tests

```bash
# Unit tests (Vitest)
pnpm test              # Run once
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage

# E2E tests (Playwright)
pnpm test:e2e          # Headless
pnpm test:e2e:ui       # Interactive UI
```

## Test Coverage

### Unit Tests (14 tests)

- `cn()` - Tailwind class merging utility
- `parseMdxClassDirectives()` - MDX class directive parsing
- `applyListClassDirectives()` - List class application

### E2E Tests (42 tests)

- **Home page** - Title, featured posts, navigation, footer
- **Posts listing** - Heading, cards, links, date sorting
- **Individual posts** - Content, author, reading time, navigation
- **React components** - Hydration verification for interactive MDX components
- **Static pages** - Privacy, Terms, Connect, 404 handling
- **Accessibility** - WCAG 2.0/2.1 AA compliance, images, keyboard nav, lang attr

## Lefthook Integration

Tests run automatically:

- **Pre-commit**: Lint, format, typecheck, build
- **Pre-push**: Lint, format, typecheck, unit tests, build

## Writing New Tests

### Unit Tests

Test pure functions with no side effects:

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "../../../src/lib/myModule";

describe("myFunction", () => {
  it("transforms input correctly", () => {
    expect(myFunction("input")).toBe("expected");
  });
});
```

### E2E Tests

Test pages in a real browser:

```typescript
import { test, expect } from "@playwright/test";

test("page works", async ({ page }) => {
  await page.goto("/my-page/");
  await expect(page.locator("h1")).toBeVisible();
});
```

### Accessibility Tests

Test WCAG compliance with axe-core:

```typescript
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("no a11y violations", async ({ page }) => {
  await page.goto("/my-page/");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations).toEqual([]);
});
```
