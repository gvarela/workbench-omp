---
project: settings-panel
created: 2026-09-06
status: complete
last_updated: 2026-09-06
---

# Research: Settings panel

## Research question

How are pages, cards, forms, and actions built today, so a workspace settings panel reachable from the dashboard can reuse them?

## Summary

Ledgerboard is two static HTML pages sharing one stylesheet (`styles/app.css:1-192`). Design tokens for color, spacing, radius, and type live on `:root` (`styles/app.css:2-23`). Both pages use the same header and nav shell (`index.html:10-16`, `settings.html:10-16`) and a centered main column (`styles/app.css:71-75`).

## Detailed findings

The existing account settings page is a `card` form with a `card__header`, `card__body` of `form-field` blocks, an error `notice`, and a `card__footer` holding secondary and primary buttons (`settings.html:21-40`). Buttons are `btn` with `btn--primary` or `btn--secondary` modifiers (`styles/app.css:138-160`). Form fields stack label, input, and hint vertically (`styles/app.css:114-136`). The dashboard lays cards out in a two-column `card-grid` that collapses at 720px (`styles/app.css:83-87`, `styles/app.css:184-187`).

No icon library, sprite, or icon component exists; navigation and buttons are text-only (`index.html:12-15`, `settings.html:37-39`).

## Code references

- `styles/app.css:2-23` — Design tokens.
- `styles/app.css:40-87` — Header, nav, main, page title, card grid.
- `styles/app.css:90-181` — Card, form field, button, stat, notice components.
- `settings.html:21-40` — Existing settings card with form and footer actions.

## Open questions

No unresolved research questions.
