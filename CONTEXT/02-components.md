# 02 — Components

> Specs for every shared component. **If a component is listed here, build to this spec — don't invent a variant.**
> All values reference tokens in [`01-design-tokens.md`](./01-design-tokens.md).
> Built on **shadcn/ui** primitives, themed to consume our tokens.

---

## Conventions (apply to all)

- **Dark-first.** Every component must look correct on `--bg` / `--card` out of the box.
- **Borders over shadows.** Default separation is `1px solid var(--border)`. Shadows only for floating layers.
- **Mono for data.** IDs, dates, counts, enums, paths → `font-mono`.
- **Icons:** lucide-react, 16px default, 1.75 stroke.
- **Hover transitions:** 150ms `ease-out`, color/border only.
- **Radius:** containers 12px; controls (buttons/inputs) 6px; pills/badges 999px.

---

## 1. Button

Three variants × three sizes. No other shapes.

| Variant | Background | Text | Border | Use |
|---|---|---|---|---|
| `primary` | `--accent` | `#fff` | none | Main action per view (one max) |
| `secondary` | `--card` | `--text` | `--border` | Default, cancel |
| `ghost` | transparent | `--text-dim` | none | Nav, toolbars |
| `danger` | `--red-bg` | `--red` | `rgba(239,68,68,0.3)` | Delete |

**Sizes:** `sm` (h28, px12, text13) · `default` (h36, px16, text14) · `lg` (h44, px20, text15).

- Icon + label: 8px gap, icon left.
- Disabled: 50% opacity, `cursor-not-allowed`.
- Loading: replace label with 14px spinner, keep width stable.
- Focus ring per tokens.

---

## 2. Card

The universal container.

```
background: var(--card)
border: 1px solid var(--border)
border-radius: 12px
padding: 18px   (→ 24px for "large" variant)
```

- **Header row:** icon (18px) + title (`text-h3` 17/650) on left; optional badge/action on right.
- **Hover:** border → `--border-soft` ... actually keep border; lift via `--card-hover` bg only on interactive cards (clickable list rows).
- Do **not** add shadow to static cards.

**Variants:** `default`, `large` (padding 24px, used in detail panels), `interactive` (cursor pointer, bg→`--card-hover` on hover).

---

## 3. Stat Card

Dashboard metric tile. Non-negotiable layout so the home page reads as a set.

```
┌─────────────────────────┐
│ ICON   LABEL            │
│                        │
│ 42                      │  ← big number, mono, 30px/700
│                         │
│ +3 this week            │  ← optional delta, text-xs, semantic color
└─────────────────────────┘
```

- Padding 18px, min-height ~110px.
- Label: `text-label` (11px UPPER), `--text-faint`.
- Value: `font-mono`, 30px, 700, `--text`.
- Icon top-left, 18px, colored by metric semantics (Applications→accent, Interviews→amber, Offers→green, Rejections→red, Action Items→cyan).
- Delta line only when meaningful; green for up-good, red for up-bad.

---

## 4. Badge / Pill

For status, counts, tags.

```
padding: 2px 8px (badge) | 5px 12px (pill)
border-radius: 999px
font: text-label (11px/600, UPPER, +0.05em)
border: 1px solid <semantic>/30%
background: <semantic>-bg
color: <semantic>
```

**Status mapping (canonical — reuse everywhere):**
`Applied`→accent · `Assessment`→cyan · `Interview`→amber · `HR Round`→amber · `Offer`→green · `Rejected`→red · `Ghosted`→red

A single `<StatusBadge status={...} />` component renders the right color everywhere. Never hand-color status text.

---

## 5. Input / Textarea / Select

```
height: 36px (input), auto (textarea)
background: var(--bg-soft)
border: 1px solid var(--border)
border-radius: 6px
padding: 0 12px
font: text-body (15px), color var(--text)
placeholder: var(--text-faint)
```

- Focus: border → `--accent`, ring `2px var(--accent-bg)`.
- Invalid: border → `--red`, helper text `--red` `text-sm`.
- Label above field: `text-label`, `--text-dim`, 6px gap.
- Helper/error below: `text-xs`, 4px gap.

---

## 6. Table

For the Jobs list and any dense data.

```
container: 1px border var(--border), radius 12px, overflow hidden
th: background var(--bg-soft), text-label, --text-faint, padding 11px 16px
td: text-sm (13.5px), padding 11px 16px, border-bottom 1px --border-soft
tr:last-child td: no bottom border
tr:hover td: background var(--card-hover)
```

- Right-align numeric columns; mono for counts/dates.
- Status column uses `<StatusBadge />`.
- Row click → detail; keep an explicit action menu (⋯) for per-row ops.

---

## 7. Sidebar / Nav Item

App-shell navigation (see `03-layout-patterns.md`).

- Container: 260px fixed, `--bg-soft`, right border `--border`.
- Nav item: padding `7px 10px`, radius 7px, `--text-dim`, `text-sm`.
- Hover: bg `--card`, text `--text`.
- **Active:** bg `--accent-bg`, text `--accent-soft`, font 600. Left accent bar optional (2px).
- Section headers: `text-label`, `--text-faint`, padding-left 10px.
- Brand block top: 32px gradient logo tile (accent→pink) + name.

---

## 8. Topbar

```
height: 56px
background: var(--bg) (or translucent + backdrop-blur)
border-bottom: 1px solid var(--border)
padding: 0 24px
```

- Left: page title (`text-h3`) + optional breadcrumb.
- Right: theme toggle, Gmail sync indicator, user avatar/menu (32px, radius-full).

---

## 9. Avatar

- Size: 24/32/40px. Default 32px, radius-full.
- Background: `--accent-bg`, text `--accent-soft`, initials (max 2 chars), `text-sm` 600.
- Optional 2px ring for "connected" state (green).

---

## 10. Dropdown / Menu / Popover

- `--card` bg, 1px `--border`, radius 12px, `--shadow-md`.
- Padding 6px internally; items padding `7px 10px`, radius 7px.
- Item hover: bg `--card-hover`.
- Destructive item: text `--red`, hover bg `--red-bg`.
- Open/close: 200ms `--ease-normal`.

---

## 11. Modal / Dialog

- Overlay: `rgba(0,0,0,0.6)` + `backdrop-blur(2px)`.
- Panel: `--card`, 1px `--border`, radius 16px, `--shadow-lg`, max-width 480px (form) / 640px (detail).
- Header: `text-h2` (20/700) + close button (ghost, top-right).
- Body: padding 24px, `text-body`.
- Footer: right-aligned buttons (secondary left of primary).
- Enter: 300ms `--ease-slow` (scale 0.96→1 + fade).

---

## 12. Toast / Notification

- Bottom-right stack, 320px wide, `--card`, 1px `--border`, radius 12px, `--shadow-md`.
- Variants: `success` (green left-border), `error` (red), `info` (accent).
- Icon + title (`text-sm` 600) + optional description (`text-xs` `--text-dim`).
- Auto-dismiss 4s (success/info), persist (error) until dismissed.

---

## 13. Timeline

Job detail lifecycle view.

- Vertical line (2px `--border`) down the left, items spaced 24px.
- Each item: 12px dot (ring 2px semantic color), timestamp `text-xs` `--text-faint` mono above, content below.
- Item types render with their semantic color: status change, email received, task created.

---

## 14. Email List Item

- Container: padding 12px, border-bottom `--border-soft`.
- Row: sender (`text-sm` 600) + date right (`text-xs` `--text-faint` mono).
- Subject line below: `text-sm` `--text`.
- Footer chips: `<StatusBadge />` (detected status) + action-required pill (amber).
- Unread: left 2px `--accent` bar + sender `--text` (bold); read: `--text-dim`.

---

## 15. Task Item

Checkbox + title row.

- Checkbox 16px, radius 4px; checked → `--accent` bg + white check.
- Title: `text-sm`; completed → `--text-faint` + line-through.
- Due date chip (if set): `text-xs` mono, amber if overdue, `--text-faint` otherwise.
- Source badge: `email` (accent) / `manual` (faint).

---

## 16. Empty State

Centered in its container, max-width 360px.

- Illustration or 40px lucide icon in `--text-faint`.
- Title: `text-h3` `--text`.
- Description: `text-sm` `--text-dim`.
- Optional primary button (e.g. "Add your first job").
- See `04-states-and-content.md` for copy.

---

## 17. Loading / Skeleton

- Skeleton blocks: `--bg-soft` base, shimmer gradient sweeping 1.2s.
- Use skeleton shapes matching final layout (card-shaped, row-shaped). Never a generic spinner for content areas.
- Inline button loading: 14px spinner (section 1).
- Full-page: centered 24px spinner + `text-sm` `--text-dim` label ("Loading jobs…").

---

## 18. Callout / Alert

Inline message block (used in docs + product).

```
padding: 16px 18px
border-radius: 12px
border: 1px solid <semantic>/30%
background: <semantic>-bg
```

Variants: `info` (accent), `success` (green), `warning` (amber), `danger` (red).
Icon left (16px) + body: bold title line then `text-sm` description.

---

## 19. Code Block (if needed in product)

- `--bg-soft`, 1px `--border`, radius 12px, padding 16px.
- `font-mono`, 12.5px, line-height 1.65, horizontal scroll.
- Inline code: mono 0.92em, `--bg-soft` chip, 1px `--border`, color `--accent-soft`.

---

## Component checklist (before marking a component done)

- [ ] Uses only tokens (no hardcoded hex/sizes)
- [ ] Dark-first and correct on `--bg`
- [ ] Visible focus state
- [ ] Hover state defined
- [ ] Loading + empty states handled (where applicable)
- [ ] Responsive at <768px
- [ ] Matches the spec above — no invented variant
