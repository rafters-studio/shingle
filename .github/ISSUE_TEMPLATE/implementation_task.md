---
name: Implementation Task
about: SOLID implementation task for AI agents
title: "Implement [Feature Name] - [Brief Description]"
labels: enhancement
assignees: ""
---

## Goal

**Single, focused objective this task achieves.**

## Site

- [ ] sean.silvius.me
- [ ] gitpress.app

## Exact Implementation Requirements

NO emoji anywhere

### Behavior Requirements

- Specific requirement 1 with clear success criteria
- Specific requirement 2 with measurable outcome
- Specific requirement 3 with validation method

### Component/Page Structure

```astro
---
// Exact component interface, props, or page structure expected
---
```

### Error Handling

- What errors to handle and when
- Required error states or fallback UI
- Recovery strategies if applicable

## Acceptance Criteria

### Functional Tests Required

```typescript
// Exact test cases that must pass
// Include setup, execution, and assertions
expect(result).toBe(expectedValue);
```

### Accessibility Requirements

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader considerations
- Color contrast meets AA ratio (4.5:1 body, 3:1 large text)

### TypeScript Requirements

- TypeScript strict mode enabled
- All strict flags enforced
- No `any` types anywhere (oxlint enforced)
- No `.forEach()` - use `for...of` loops instead
- No `.then()` chains - use `async/await` only
- No `var` - use `const` or `let` only
- No unused variables or parameters
- All external data validated with Zod schemas
- Types inferred from Zod schemas where possible

### Build Requirements

- oxlint for linting, oxfmt for formatting
- Key lint rules enforced:
  - No `any` types
  - No `.forEach()` -- use `for...of` instead
  - No `var` -- use `const` or `let`
  - No unused variables or imports
  - No `console.log` (use proper logging)

### Style Requirements

- Tailwind CSS v4 with rafters design tokens
- No arbitrary values (no `-[400px]`, no `-[#ff0000]`)
- No CSS positioning unless no alternative exists
- Mobile-first responsive design
- Container queries for component-level responsiveness

## What NOT to Include

- Feature 1 that's out of scope (separate issue)
- Feature 2 that's not needed yet (future consideration)
- Complex feature that should be broken down further

## File Locations

- Implementation: `sites/<site>/src/path/to/file`
- Tests: `sites/<site>/tests/path/to/file.test.ts`
- E2E: `sites/<site>/tests/path/to/file.e2e.ts` (as needed)

## Integration Requirements

### Dependencies

- Required packages or modules
- Integration points with existing components
- Content collection dependencies

### Usage Examples

```astro
---
// Concrete examples of how this will be used
---
<Component prop={value} />
```

## Success Criteria

- [ ] All functional tests pass
- [ ] TypeScript compiles without errors
- [ ] Accessibility requirements met
- [ ] Builds successfully (`pnpm preflight`)
- [ ] Deploys to Cloudflare Workers

**This issue is complete when:** [Specific, measurable completion condition]

## Context & References

- Related issues: #123, #456
- Design tokens: Reference rafters MCP for token values
- External dependencies: Links to library docs if needed
