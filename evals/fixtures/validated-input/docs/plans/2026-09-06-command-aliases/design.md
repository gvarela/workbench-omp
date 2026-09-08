---
project: command-aliases
created: 2026-09-06
status: complete
---

# Design: Command aliases

## Contract

- `registerAlias(alias, target)` stores an alias target name.
- `resolve(alias)` returns the exact handler registered for the canonical target.
- Canonical lookup remains unchanged.

## Success criteria

- Canonical and alias behavior pass `bun test test/catalog.test.ts`.

## Manual verification

- Confirm the method name is appropriate for public callers. Status: pending.
