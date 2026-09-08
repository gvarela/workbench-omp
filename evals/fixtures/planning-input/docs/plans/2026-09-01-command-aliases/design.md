---
project: command-aliases
created: 2026-09-01
status: ready
last_updated: 2026-09-01
git_commit: fixture
git_branch: main
design_approach: Catalog-owned alias resolution
decision_records: [eval-decision]
approval: approved
approved_at: 2026-09-01T12:00:00Z
---

# Design: Command aliases

## Problem statement

Direct catalog callers and CLI callers need one alias contract. The catalog is the existing lookup and duplicate-detection boundary (`src/catalog.ts:3-15`).

## Design approach

Commands expose an optional immutable alias list. Registration atomically validates the canonical name and every alias against all existing canonical names and aliases. Lookup first resolves an exact canonical name, then an alias, and otherwise preserves the existing unknown-command error.

## Scope

In scope: registration validation, lookup behavior, and public command type. Out of scope: alias persistence and fuzzy matching.

## Success criteria

- Registered aliases dispatch the same command for CLI and direct catalog callers.
- Canonical names win exact lookup.
- Any canonical-name or alias collision rejects the new registration without partial state.
- Unknown-name behavior remains unchanged.

## Risks and mitigations

Collision regressions are contained by atomic preflight validation. Contract regressions are observable through catalog behavior tests following `test/catalog.test.ts:5-14`.

## Rejected alternatives

CLI-only normalization was rejected because direct catalog callers would receive different behavior.
