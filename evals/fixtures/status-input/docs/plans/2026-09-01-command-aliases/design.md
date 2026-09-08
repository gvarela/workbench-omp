---
project: command-aliases
created: 2026-09-01
status: ready
last_updated: 2026-09-01
git_commit: fixture
git_branch: main
design_approach: Catalog-owned aliases
approval: approved
approved_at: 2026-09-01T12:00:00Z
---

# Design: Command aliases

## Problem statement

Catalog callers need one alias contract.

## Design approach

The catalog owns immutable alias declarations, atomic collision validation, and exact-name-first lookup.

## Success criteria

Aliases dispatch identically for all callers; collisions reject without partial state; unknown names preserve current behavior.

## Rejected alternatives

CLI-only aliasing creates caller-dependent behavior.
