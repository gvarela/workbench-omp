---
project: command-aliases
created: 2026-09-06
status: ready
---

# Design: Command aliases

## Goal

Allow a registered alias to resolve to the exact handler of an existing canonical command.

## Contract

- `registerAlias(alias, target)` records an alias without copying the handler.
- `resolve(alias)` follows the alias to the target command.
- Unknown aliases and unknown canonical commands still resolve to `undefined`.

## Success criteria

- The focused Bun test demonstrates alias resolution by handler identity.
- Canonical command resolution remains unchanged.

## Manual verification

- Review the implemented public method name and confirm `registerAlias(alias, target)` is the intended API.
