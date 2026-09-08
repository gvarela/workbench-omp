---
project: command-ux
created: 2026-09-06
status: complete
---

# Research: Command UX

`src/catalog.ts:3-13` owns registration and lookup; `test/catalog.test.ts:4-9` uses handler identity. `src/help.ts:1-8` formats help entries; `test/help.test.ts:4-6` pins its public string output. The two modules have no shared implementation files.
