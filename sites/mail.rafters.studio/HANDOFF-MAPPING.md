# Handoff → Rafters mapping log

Reference doc for the future plugin. Each entry: handoff source → Rafters resolution.

## Registry installs

| Handoff need | Resolution | Notes |
|---|---|---|
| `.btn`, `.hed-cta`, `.btn.outline` | `pnpm dlx rafters add button` | `<Button variant="default" / "outline">` — install also pulls react@19, unused in Astro path |
| Mono labels (`<kbd>`-shaped) | `pnpm dlx rafters add kbd` | available |
| Form labels | `pnpm dlx rafters add label` | available |

## Registry gaps (CLI install failures, file as bugs)

| Component | Listed | Install result |
|---|---|---|
| `tabs`, `tabs-list`, `tabs-trigger`, `tabs-content` | yes | "Component 'tabs.classes' not found" |
| `table`, `table-body`, `table-cell`, `table-row`, etc. | yes | "Component 'table.classes' not found" |
| `accordion` | yes | installs as `.tsx` only — no Astro variant |
| `copy-button` (composite) | yes | "Component 'copy-button' not found" |
| `hero-banner` (composite) | yes | "Component 'hero-banner' not found" |
| `feature-grid` (composite) | yes | "Component 'feature-grid' not found" |

## Site-local composites (>1 use in this page)

| Composite | Uses | Composes |
|---|---|---|
| `LinkButton` | nav CTA, OSS callout | `<a>` + button.classes |
| `EyebrowLabel` | hero eyebrow | mono small + optional dot + tag |
| `IntelTag` | modules section (~15 instances) | mono small pill |
| `SectionHead` | 5 sections | mono "NN / name" + `<H2>` + right-side description |
| `ModuleCell` | 8 modules | path label + `<H3>` + description + IntelTag row |
| `StatCell` | 3 stats | small label + big value + description |
| `FAQItem` | 6 questions | native `<details>` + mono summary + answer body |
| `InstallCard` | 1 use (but composite-shaped, candidate for promotion) | tab strip + terminal body + footline + CopyButton |
| `CopyButton` | 1 use (registry composite was missing) | small button + clipboard JS |

## Element-level rules

| Handoff selector | Rafters resolution |
|---|---|
| `<div class="flex">`, `<div style="display:flex">` | `<Grid>` or `<Container>` with appropriate gap/columns; never bare flex |
| `<h1>`, `<h2>`, etc. | `<H1>`, `<H2>` with `size=` token prop |
| `<p class="lede">` | `<P size="lead" color="muted-foreground">` |
| `<span class="hl">` (highlight pill) | `<span>` with `bg-foreground text-background px-2` — file as `<Highlight>` primitive candidate |
| `<span class="q">` (quiet text) | inline span with `text-muted-foreground` |
| `<a>` (nav link) | bare `<a>` with `text-muted-foreground hover:text-foreground` — file as `<NavLink>` primitive candidate |
| `<a>` styled as button | `LinkButton` composite (button.classes on `<a>`) |
| Mono text inline | Typography component with `family="mono"` |
| Arbitrary values (`h-[22px]`, `bg-foo/85`) | NEVER. Use system tokens or surface the gap |

## Token translation

| Handoff token | Site rafters token |
|---|---|
| `var(--accent-hue)` | `--foreground` (default neutral fallback; dynamic accent system not implemented) |
| `var(--background)` | `bg-background` utility |
| `var(--foreground)` | `text-foreground` utility |
| `var(--muted)` | `bg-muted` utility |
| `var(--muted-foreground)` | `text-muted-foreground` utility |
| `var(--border)` | `border-border` utility |
| `var(--card)` | `bg-card` utility |
| `var(--font-condensed)` | site uses Noto Sans Variable; condensed font not in token set — gap |
| `var(--font-mono)` | `font-mono` utility |
| IBM Plex Sans Condensed for headings | site uses default `--font-heading` (Noto Sans Variable) — token swap needed in `.rafters/config.rafters.json` |

## Behaviors dropped

- **Tweaks panel** — handoff §next-steps says drop unless edit-mode host present. Dropped.
- **Dynamic accent system** — `[data-accent]` body attribute. Not implemented; uses neutral fallback.

## Behaviors kept (with vanilla JS)

- Install card tab switching
- Copy button (clipboard write + label flash)
- Native `<details>` accordions for FAQ
