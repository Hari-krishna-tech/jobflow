# 01 — Design Tokens

> The single source of truth for all visual values. **Never hardcode hex in components.**
> Implement as CSS custom properties in `globals.css`, then map into `tailwind.config.ts`.

The palette mirrors `PLAN.html` so the docs and product feel like one product.

---

## 1. Color — Surfaces (dark-first)

Dark is the default theme. Light theme is a future toggle; tokens are named semantically
so a light map can be swapped later without touching components.

| Token | Value (dark) | Usage |
|---|---|---|
| `--bg` | `#0a0a0b` | App background — the deepest layer |
| `--bg-soft` | `#111113` | Recessed areas: sidebar, code blocks, table headers |
| `--card` | `#151518` | Cards, panels, dropdowns |
| `--card-hover` | `#1a1a1f` | Hover state of cards / list rows |
| `--border` | `#26262c` | Primary borders (cards, dividers between sections) |
| `--border-soft` | `#1e1e24` | Subtle dividers (table rows, list items) |

**Rule:** There are exactly three surface depths. `bg` < `bg-soft` < `card`. Never invent a fourth.

---

## 2. Color — Text

| Token | Value (dark) | Usage |
|---|---|---|
| `--text` | `#ededf0` | Primary text, headings, body |
| `--text-dim` | `#a1a1aa` | Secondary text, descriptions, labels |
| `--text-faint` | `#6b6b75` | Tertiary: timestamps, hints, placeholders |

Always pair text with sufficient surface contrast. `--text-faint` is for metadata only, never body copy.

---

## 3. Color — Accent & Semantic

One accent. A small, disciplined semantic palette. No decorative color.

| Token | Value | Tint (12% bg) | Usage |
|---|---|---|---|
| `--accent` | `#6366f1` | `--accent-bg` `rgba(99,102,241,0.12)` | Primary actions, links, active nav, focus rings |
| `--accent-soft` | `#818cf8` | — | Accent text on dark, hover |
| `--green` | `#22c55e` | `--green-bg` | Success, Offer, connected, complete |
| `--amber` | `#f59e0b` | `--amber-bg` | Warning, Interview, Assessment, pending |
| `--red` | `#ef4444` | `--red-bg` | Danger, Rejected, Ghosted, destructive |
| `--cyan` | `#06b6d4` | — | Types/code annotation, Assessment status |
| `--pink` | `#ec4899` | — | Logo gradient end, JSON keys |

**Status → color mapping (authoritative):**
`Applied`→accent · `Assessment`→cyan · `Interview`→amber · `HR Round`→amber · `Offer`→green · `Rejected`→red · `Ghosted`→red

---

## 4. Typography

**Font stacks**

| Role | Stack |
|---|---|
| Sans (UI/body) | `-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif` |
| Mono (data) | `"SF Mono", "JetBrains Mono", "Fira Code", ui-monospace, Menlo, monospace` |

> Load **Inter** (sans) and **JetBrains Mono** (mono) via `next/font` for consistency across machines.

**Scale** — use these exact sizes/weights. `letter-spacing` tightens as size grows.

| Token | Size | Weight | Tracking | Usage |
|---|---|---|---|---|
| `text-hero` | 38px | 800 | -0.025em | Landing/hero H1 only |
| `text-h1` | 26px | 700 | -0.02em | Page titles (`<h2>` in section heads) |
| `text-h2` | 20px | 700 | -0.015em | Card titles, modal headers |
| `text-h3` | 17px | 650 | 0 | Subsections |
| `text-body` | 15px | 400 | 0 | Default body |
| `text-sm` | 13.5px | 400 | 0 | Secondary descriptions, table body |
| `text-xs` | 12px | 400 | 0 | Meta, captions |
| `text-label` | 11px | 600 | +0.05em UPPER | Eyebrow labels, table headers, badges |

**Line-height:** 1.6 for body, 1.1 for hero/h1, 1.65 for code.

**Monospace rule:** IDs, dates, counts, enums, file paths, and all code render in mono.
In body text, inline `code` uses mono at 0.92em with a subtle border + `--bg-soft` chip.

---

## 5. Spacing

Base unit `4px`. Use multiples. These are the only allowed values:

| Token | Value | Typical use |
|---|---|---|
| `space-1` | 4px | Icon↔text gap |
| `space-2` | 8px | Tight gaps, pill padding (y) |
| `space-3` | 12px | Default flex gap, list item padding |
| `space-4` | 16px | Card padding, form field gaps |
| `space-5` | 20px | Section sub-gap |
| `space-6` | 24px | Card padding (large), section head gap |
| `space-8` | 32px | Between page sections |
| `space-12` | 48px | Page top padding |

**Rule:** No `13px`/`7px`/`15px`-ish one-offs. Round to the nearest token.

---

## 6. Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 6px | Inline code chips, small inputs |
| `--radius` | 12px | Cards, panels, code blocks, default |
| `--radius-lg` | 16px | Hero panel, large modals |
| `--radius-full` | 999px | Pills, status badges, avatars |

Buttons/inputs use `--radius-sm` (6px) to read as controls, not containers.

---

## 7. Shadows & Elevation

Dark UIs rely on borders, not shadows. Use shadows sparingly — only for floating layers.

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | (rare) subtle lift |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.35)` | Dropdowns, popovers |
| `--shadow-lg` | `0 12px 32px rgba(0,0,0,0.45)` | Modals, command palette |

**Default separation = 1px `--border`.** Reserve shadow for things that float above the page.

---

## 8. Motion

Keep it subtle and fast. Motion clarifies, never decorates.

| Token | Duration | Easing | Usage |
|---|---|---|---|
| `--ease-fast` | 150ms | `ease-out` | Hover, focus, color changes |
| `--ease-normal` | 200ms | `ease-out` | Open/close menus, row expand |
| `--ease-slow` | 300ms | `cubic-bezier(0.4,0,0.2,1)` | Page/modal transitions |

- **No bounce, no spring** anywhere except (optionally) the logo.
- Respect `prefers-reduced-motion`: disable non-essential transitions.

---

## 9. Icons

- Library: **lucide-react** (matches shadcn/ui).
- Default size: **16px**. In buttons/headers: 18px. Feature-card icons: 20px.
- Stroke width: **1.75** (lucide default is fine).
- Never mix icon libraries. No emoji as functional icons (emoji allowed only in marketing/empty-state illustrations).

---

## 10. Focus & Accessibility

- Focus ring: `2px` solid `--accent` with `2px` offset, on `--bg`.
- All interactive elements must have a visible focus state.
- Minimum touch target: 32×32px (16px icon + padding).
- Color contrast: body text on `--card` must meet WCAG AA (the tokens above do).

---

## Tailwind mapping (target)

```ts
// tailwind.config.ts — conceptual
colors: {
  bg:        'var(--bg)',
  'bg-soft': 'var(--bg-soft)',
  card:      'var(--card)',
  border:    'var(--border)',
  'border-soft': 'var(--border-soft)',
  text:      'var(--text)',
  'text-dim':'var(--text-dim)',
  'text-faint':'var(--text-faint)',
  accent:    'var(--accent)',
  'accent-soft':'var(--accent-soft)',
  green: 'var(--green)', amber: 'var(--amber)',
  red: 'var(--red)', cyan: 'var(--cyan)',
}
borderRadius: { sm: '6px', DEFAULT: '12px', lg: '16px' }
fontFamily: { sans: ['var(--font-inter)'], mono: ['var(--font-jetbrains)'] }
```
