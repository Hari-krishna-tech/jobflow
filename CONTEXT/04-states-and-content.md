# 04 — States & Content

> Empty, loading, and error states — and the words on the screen. Inconsistent states and copy
> are the fastest way to make an app feel unfinished. Match these everywhere.

---

## 1. State Principles

1. **Never show nothing.** Every container has an empty, loading, or error state — never blank space.
2. **Skeletons for content, spinners for actions.** Content areas shimmer; buttons spin.
3. **Be specific.** "Couldn't load jobs — check your connection" beats "Error".
4. **Offer a next step.** Empty/error states always include an action when possible.

---

## 2. Loading States

| Context | Pattern |
|---|---|
| Page content (table, list, cards) | **Skeleton** matching final layout. Card-shaped and row-shaped blocks, `--bg-soft` with shimmer. |
| Button action (save, sync) | Inline **14px spinner** replacing label; button keeps its width. |
| Full page (initial auth/handoff) | Centered 24px spinner + `text-sm` `--text-dim` label. |
| Background sync (Gmail) | Topbar **sync indicator** (animated dot or rotating icon) — non-blocking. |

**Copy:** Loading…, Syncing emails…, Saving job…, Deleting…

Skeleton shimmer: 1.2s linear gradient sweep over `--bg-soft`. Respect `prefers-reduced-motion` → static.

---

## 3. Empty States

Structure (centered, max-width 360px): **icon** (40px, `--text-faint`) → **title** (`text-h3`) → **description** (`text-sm` `--text-dim`) → **optional primary button**.

### Canonical empty states

| Page / Context | Icon | Title | Description | Action |
|---|---|---|---|---|
| Jobs list (no jobs) | `Briefcase` | No applications yet | Add the first role you've applied to and JobFlow starts tracking it. | Add Job |
| Job detail (no emails) | `Inbox` | No emails synced | Connect Gmail and we'll surface conversations for this job here. | Connect Gmail |
| Job detail (no tasks) | `CheckSquare` | No action items | Tasks created from emails or by you will show up here. | Add Task |
| Gmail (not connected) | `Mail` | Gmail not connected | Connect your account to automatically detect job emails. | Connect Gmail |
| Gmail (no job emails found) | `Search` | No job emails found | We scanned recent emails but found nothing job-related yet. | Resync |
| Tasks (all done) | `CheckCircle2` | You're all caught up | No open action items. Nice. | — |
| Search (no results) | `Search` | No results | Try a different company or role. | — |
| Unmatched emails | `Link2` | Nothing unmatched | All job emails are linked to a tracked company. | — |

---

## 4. Error States

### Inline / field errors
- Input border → `--red`; helper text below in `--red` `text-sm`.
- Copy: short, specific. "Company is required." / "Invalid URL." / "Applied date can't be in the future."

### Toast errors (transient)
- Red-variant toast, bottom-right. Title + optional description. Persists until dismissed.
- "Failed to save job" / "Gmail sync failed" / "Couldn't reach AI service".

### Full-block errors (e.g. failed fetch)
- Centered in the container: icon (`AlertTriangle`, `--red`) + title + description + **Retry** (secondary button).
- "Couldn't load jobs" — "Something went wrong fetching your applications. Check your connection and try again." → **Retry**.

### Fatal / route errors
- Custom `error.tsx` boundary per route group: friendly message + "Go to dashboard" + "Try again".
- Never expose stack traces or raw error objects to the user.

### AI-specific errors
- If classification/parsing fails, **fail gracefully**: store the email raw, mark `detected_status = null`, surface in the unmatched queue. Never block the whole sync because one email failed.
- Toast: "AI classification unavailable — 3 emails need manual review."

---

## 5. Success Feedback

| Action | Feedback |
|---|---|
| Create job | Green toast: "Application added." |
| Update job | Green toast: "Changes saved." |
| Delete job | Green toast with **Undo** action (5s): "Job deleted. Undo." |
| Gmail connected | Green toast: "Gmail connected." + sync indicator turns green. |
| Sync complete | Toast: "Synced N emails · M new · K status updates." |
| Task completed | Subtle: checkbox animates, title strikes through. No toast (too noisy). |

---

## 6. Voice & Tone

JobFlow speaks like a calm, competent colleague — not a cheerleader, not a robot.

| Do | Don't |
|---|---|
| "Add Job" | "Create New Application Entry" |
| "Syncing emails…" | "PLEASE WAIT WHILE WE PROCESS…" |
| "No applications yet." | "It appears you have not added any applications." |
| "Couldn't save — try again." | "Error 500: Internal Server Error" |
| "You're all caught up." | "ZERO TASKS REMAINING" |

**Principles:**
- **Sentence case** everywhere except `text-label` (UPPERCASE eyebrows) and proper nouns/brand names.
- **Terse labels, complete sentences in descriptions.** Buttons ≤3 words; empty-state descriptions one or two sentences.
- **Active voice.** "We'll surface conversations" not "Conversations will be surfaced."
- **No exclamation marks** in product UI (marketing pages are the exception).
- **Plain words.** Avoid jargon ("ingest", "provision") in user-facing copy; technical terms fine in docs.
- **Second person** ("your applications"), never first-person plural in UI ("we" is fine in docs and conversational states like "we'll surface…").

---

## 7. Date & Number Formatting

Consistency here is a big part of feeling polished. Use one utility (`lib/format`) everywhere.

| Type | Format | Example |
|---|---|---|
| Absolute date | `MMM d, yyyy` | `Jun 20, 2026` |
| Date with time | `MMM d, yyyy · h:mm a` | `Jun 20, 2026 · 3:45 PM` |
| Relative (recent) | `just now`, `5m ago`, `3h ago`, `yesterday` | within 24h |
| Relative (older) | fall back to absolute | `Apr 2, 2026` |
| Counts | plain integer, mono | `42` |
| Large counts | compact if >9,999 | `12.4k` |
| Currency | as-is from source, mono | `$180k` (free-form string) |

- All dates render in **mono** (per typography rule). Use a single helper to avoid drift.
- Relative time for recent items (last 24h); absolute otherwise — never mix in the same column.

---

## 8. Microcopy Reference (common spots)

| Location | Copy |
|---|---|
| Login button | Continue with Google |
| Primary add button | Add Job |
| Sync button | Sync now |
| Resync button | Resync |
| Empty search placeholder | Search by company or role… |
| Job form company label | Company |
| Job form notes placeholder | Anything worth remembering about this role… |
| Confirm delete (modal) | Delete this application? / This can't be undone. / [Cancel] [Delete] |
| Gmail disconnect (modal) | Disconnect Gmail? / You'll keep existing emails, but we'll stop syncing new ones. / [Cancel] [Disconnect] |

---

## 9. Accessibility for states

- Loading spinners: `aria-busy="true"` on the container; spinners carry `aria-label="Loading"`.
- Toasts: `role="status"` for success/info, `role="alert"` for errors.
- Empty/error states: descriptive heading in the icon-adjacent title for screen readers.
- Focus must move logically when content swaps (e.g. into an error retry button).
- Never rely on color alone — status badges include text labels (they always do here).

---

## States checklist (before marking a view done)

- [ ] Empty state implemented with correct copy + action
- [ ] Loading skeleton matches final layout shape
- [ ] Inline validation errors on forms
- [ ] Toast on success/error for every mutating action
- [ ] Error boundary covers the route
- [ ] Dates/numbers go through the format utility
- [ ] Copy reviewed against voice rules
