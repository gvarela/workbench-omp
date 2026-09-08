---
project: command-aliases
created: 2026-09-01
status: complete
last_updated: 2026-09-01
validation_status: passed
last_validated: 2026-09-01
---

# Research: Command aliases

## Research question

Where can command alias resolution integrate with registration and CLI lookup?

## Summary

Commands are stored under their declared names during registration (`src/catalog.ts:6-14`). CLI input passes the first argument directly to catalog lookup (`src/cli.ts:3-6`).

## Detailed findings

Registration rejects an existing map key before storing a command (`src/catalog.ts:9-14`). Execution performs one map lookup and reports the requested name when absent (`src/catalog.ts:16-20`). The CLI owns argument splitting but does not normalize the command name (`src/cli.ts:3-6`).

## Architecture and patterns

The current boundary permits name transformation either before `execute` at the CLI boundary or within catalog lookup; neither behavior exists now (`src/cli.ts:3-6`, `src/catalog.ts:16-20`). Tests exercise successful dispatch and unknown-name errors (`test/catalog.test.ts:5-13`).

## Code references

- `src/catalog.ts:6-20` — Registry storage and lookup.
- `src/cli.ts:3-6` — CLI parsing boundary.
- `test/catalog.test.ts:5-13` — Observable behavior tests.

## Open questions

No unresolved research questions.
