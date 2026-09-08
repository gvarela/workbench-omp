---
project: command-ux
created: 2026-09-06
status: ready
---

# Design: Command UX

## Goal

Add catalog aliases and descriptive help output as independent user-facing improvements.

## Contracts

- `CommandCatalog.registerAlias(alias, target)` makes `resolve(alias)` return the canonical handler by identity.
- `formatHelp` renders each entry as `<name>: <description>` while preserving input order.

## Success criteria

- Alias and canonical lookup tests pass.
- Help output includes names and descriptions in input order.

## Manual verification

- Confirm the public alias method and help line format are suitable for callers.
