# 03 — Layout Patterns

> How pages and the app shell are structured. Every page follows these patterns so navigation,
> spacing, and density feel identical across the product.

All values reference [`01-design-tokens.md`](./01-design-tokens.md). Components from [`02-components.md`](./02-components.md).

---

## 1. App Shell

The persistent frame around every authenticated page.

```
┌──────────┬──────────────────────────────────────────────┐
│          │  TOPBAR  (56px)                               │
│          ├──────────────────────────────────────────────┤
│  SIDEBAR │                                              │
│  (260px) │              PAGE CONTENT                     │
│          │              (max 980px, padded)              │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

- **Sidebar:** 260px fixed, `--bg-soft`, right border. Sticky, full viewport height, own scroll. Collapses to off-canvas drawer <1024px; hidden <768px (topbar hamburger).
- **Topbar:** 56px, `--bg` (translucent + `backdrop-blur` optional), bottom border. Left: page title/breadcrumb. Right: sync status, theme toggle, avatar menu.
- **Content area:** `--bg`. Inner column max-width **980px**, centered, padding `48px 56px 120px`. Below 768px: padding `32px 20px 80px`.
- Implement as a single `(dashboard)/layout.tsx` wrapping all authenticated routes.

---

## 2. Page Anatomy

Every page follows this vertical rhythm. No page starts with content immediately against the topbar.

```
PAGE TITLE          ← text-h1 (26/700), -0.02em
subtitle/description ← text-sm, --text-dim, max 640px

[optional action row: primary button right-aligned]

─────────────────   ← section gap (space-8 / 32px)

SECTION             ← repeats per logical group
  cards / table / form
```

- Title-to-subtitle gap: 6px.
- Subtitle-to-action: 16–24px.
- Between sections: 32–56px (use 56px for major sections, 32px for tight ones).
- Only **one primary button** per page view (in the action row). Others are secondary/ghost.

---

## 3. Grids

| Grid | Use | Breakdown |
|---|---|---|
| `grid-2` | Detail panels, two-column forms | `repeat(2, 1fr)`, 14px gap |
| `grid-3` | Stat cards, feature tiles | `repeat(3, 1fr)`, 14px gap |
| `grid-4` | Dense dashboard (XL screens only) | `repeat(4, 1fr)`, 14px gap |

**Responsive collapse (mandatory):**
- All grids → 2 columns at <1024px.
- All grids → 1 column at <768px.
- Sidebar → off-canvas drawer at <1024px.

Use `grid gap-[14px]` (or map `gap-card`), never arbitrary gaps.

---

## 4. Page Specs

### Dashboard Home (`/`)
- Row 1: `grid-3` (or `grid-4` on XL) of **Stat Cards** — Applications, Interviews, Offers, Rejections, Action Items.
- Row 2: two-column split → left **Recent Activity** (timeline feed), right **Open Action Items** (task list).
- Row 3 (optional): **Needs Attention** — jobs with no update in 7+ days.

### Jobs (`/jobs`)
- Action row: search input (left), "Add Job" primary button (right), status filter (secondary).
- **Table** (full width): Company · Role · Location · Status · Last Update · ⋯
- Empty state when no jobs.

### Job Detail (`/jobs/[id]`)
- Header card: company + position (h1), status badge, applied date (mono), edit/delete actions.
- `grid-2` body:
  - **Left (wider, ~2fr):** Timeline (status changes + emails interleaved).
  - **Right (~1fr):** Tasks list, Recruiter/CRM card, Notes card.
- Emails appear inline in timeline AND as a dedicated "Emails" tab/section.

### New Job (`/jobs/new`)
- Centered form, max-width 640px.
- Top: large textarea "Paste job description" + "Extract with AI" button (secondary — this is post-MVP; in MVP show disabled/coming-soon).
- Below: structured form (company, position, location, salary, url, applied date, status, notes).
- Footer: Cancel (secondary) + Save (primary).

### Gmail Sync (`/gmail`)
- **Connection card:** connected account email, last sync (mono), emails processed count, "Resync" primary + "Disconnect" danger.
- **Recent emails** list below (Email List Items).
- **Unmatched queue** section: emails with no matched job, with a manual "Link to job" action.

### Action Items (`/tasks`)
- Grouped by Overdue / Today / Upcoming / No date.
- Task items with checkboxes; due-date chips.

---

## 5. Auth Pages (outside shell)

- Full-viewport `--bg`, centered card max-width 400px, padding 32px.
- Logo at top (gradient tile + "JobFlow").
- Single primary "Continue with Google" button, full width.
- No sidebar/topbar. Minimal, calm.

---

## 6. Spacing Within Pages

| Location | Padding / gap |
|---|---|
| Page outer (desktop) | `48px 56px 120px` |
| Page outer (mobile) | `32px 20px 80px` |
| Card default | 18px |
| Card large | 24px |
| Between grid cells | 14px |
| Form field vertical | 16px |
| Table cell | `11px 16px` |

---

## 7. Responsive Breakpoints

| Name | Width | Behavior |
|---|---|---|
| `sm` | <640px | Single column, mobile padding, no sidebar |
| `md` | 640–1023px | 2-col grids, off-canvas sidebar |
| `lg` | 1024–1279px | Full sidebar, up to 3-col |
| `xl` | ≥1280px | Optional 4-col dashboard |

Map these to Tailwind's `sm/md/lg/xl`.

---

## 8. Z-Index Layers

Keep stacking disciplined to avoid surprise overlaps.

| Layer | z-index | Elements |
|---|---|---|
| Base | 0 | Page content |
| Sticky | 10 | Topbar, sticky table headers |
| Sidebar | 20 | Sidebar (when drawer on mobile) |
| Dropdown | 30 | Menus, popovers, selects |
| Modal | 40 | Dialog overlay + panel |
| Toast | 50 | Toast stack |

---

## 9. Page checklist (before marking a page done)

- [ ] Uses the app shell (sidebar + topbar)
- [ ] Page title + subtitle present
- [ ] Only one primary button
- [ ] Grids collapse responsively
- [ ] Empty + loading states implemented
- [ ] Content column ≤ 980px
- [ ] No hardcoded layout values — tokens only
