---
project: command-aliases
created: 2026-09-01
status: complete
last_updated: 2026-09-01
validation_status: passed
---

# Research: Command aliases

## Summary

The CLI passes the entered name to catalog execution without normalization (`src/cli.ts:3-6`). The catalog owns storage, duplicate detection, lookup, and unknown-name errors (`src/catalog.ts:3-15`).

## Detailed findings

Registration stores each command by declared name (`src/catalog.ts:6-9`). Lookup reports the requested name when no exact key exists (`src/catalog.ts:11-15`).

## Code references

- `src/catalog.ts:3-15` — Catalog boundary.
- `src/cli.ts:3-6` — CLI boundary.

## Open questions

No unresolved research questions.
