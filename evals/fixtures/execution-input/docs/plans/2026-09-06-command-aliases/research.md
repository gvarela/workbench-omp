---
project: command-aliases
created: 2026-09-06
status: complete
---

# Research: Command aliases

`src/catalog.ts:3-13` owns command registration and lookup. `test/catalog.test.ts:4-10` establishes the consumer-facing lookup pattern with Bun tests.

Keep alias resolution inside `CommandCatalog`; callers should not rewrite names themselves.
