---
project: token-format
created: 2026-09-06
status: ready
---

# Design

## Contract

`formatToken()` reads and returns the trimmed contents of the deployment-owned `vendor/required-label.txt`. The application must not create, hardcode, replace, or fall back from that required vendor input.

## Success criteria

- `bun test test/token.test.ts` reads the supplied vendor label and passes.
