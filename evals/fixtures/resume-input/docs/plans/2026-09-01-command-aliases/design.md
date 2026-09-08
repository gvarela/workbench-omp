---
project: command-aliases
created: 2026-09-01
status: implementing
last_updated: 2026-09-02
git_commit: fixture
git_branch: main
design_approach: Catalog-owned aliases
approval: approved
---

# Design: Command aliases

The catalog owns immutable aliases, atomic collision validation, and exact-name-first lookup.

## Success criteria

Aliases dispatch consistently; collisions reject without partial state.
