# JobFlow — AGENTS.md

> **AI agents read this before touching the codebase.**
> This is the design & engineering contract for the whole app. Every page and component must
> conform to it so the product looks and feels like one thing.
>
> *For the always-current project snapshot and next actions, see [`CURRENT_CONTEXT.md`](./CURRENT_CONTEXT.md).*
> *For task-level status, see [`PROGRESS.md`](./PROGRESS.md).*
> *For full architecture & schema, see [`PLAN.html`](./PLAN.html).*

## Purpose

Without a shared contract, "the dashboard looks like one thing, the jobs page another."
This file eliminates that drift. It defines the rules and points to the detailed specs.

The visual language mirrors `PLAN.html` so the docs and the product feel unified:
**dark-first, indigo accent, restrained color, mono for data.**

## Design Specs (`CONTEXT/`)

| File | What it defines |
|---|---|
| [`CONTEXT/01-design-tokens.md`](./CONTEXT/01-design-tokens.md) | Colors, typography, spacing, radius, shadows, motion |
| [`CONTEXT/02-components.md`](./CONTEXT/02-components.md) | Spec for every shared component |
| [`CONTEXT/03-layout-patterns.md`](./CONTEXT/03-layout-patterns.md) | App shell, page anatomy, grids |
| [`CONTEXT/04-states-and-content.md`](./CONTEXT/04-states-and-content.md) | Empty/loading/error states, copy & voice |

## How to use

- **Building a component?** Check [`CONTEXT/02-components.md`](./CONTEXT/02-components.md) first. If it exists there, build to that spec — don't invent a new style.
- **Starting a new page?** Follow [`CONTEXT/03-layout-patterns.md`](./CONTEXT/03-layout-patterns.md) for structure, then pull components from `02`.
- **Need a color/spacing value?** It lives in [`CONTEXT/01-design-tokens.md`](./CONTEXT/01-design-tokens.md). Never hardcode hex; use the token name.
- **Writing copy or showing an empty state?** Match [`CONTEXT/04-states-and-content.md`](./CONTEXT/04-states-and-content.md).

## Principles (apply to everything)

1. **Calm, not flashy.** Dark surfaces, generous whitespace, one accent color doing the work.
2. **Data deserves monospace.** IDs, dates, counts, and status enums render in mono.
3. **Color is semantic.** Green = success/offer, amber = warning/interview, red = danger/rejected, indigo = primary action. Never decorative.
4. **Consistency over novelty.** Reuse components and tokens; resist bespoke styling per page.
5. **Density where it earns it.** Tables and lists can be dense; forms and detail views breathe.

## Workflow

- **Task in progress:** flip its symbol in [`PROGRESS.md`](./PROGRESS.md) (`⬜ → 🔄 → ✅`).
- **End of a phase:** follow the [Update Protocol](./CURRENT_CONTEXT.md#update-protocol) to refresh [`CURRENT_CONTEXT.md`](./CURRENT_CONTEXT.md).
- **Commit message convention:** `docs(context): update after Phase N` for doc refreshes.

## Implementation note

Implement the tokens as CSS custom properties in `src/app/globals.css` and map them into
`tailwind.config.ts` so utilities like `bg-bg-soft`, `text-accent`, `border-border` are available
everywhere. shadcn/ui primitives should be themed to consume these same tokens.
