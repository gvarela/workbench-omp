---
project: command-aliases
created: 2026-09-06
status: not-started
last_updated: 2026-09-06
git_commit: fixture
git_branch: main
current_phase: 0
total_tasks: 1
completed_tasks: 0
depends_on: [research.md, design.md]
beads_epic: eval-epic
beads_phases:
  phase1_milestone: eval-epic.1
beads_tasks:
  phase1_alias_1: eval-epic.1.1
---

# Execution plan: Command aliases

## Phase 1: Alias resolution

### Task `eval-epic.1.1`: Add alias resolution

Files:

- `src/catalog.ts`
- `test/catalog.test.ts`

Steps:

1. Add a failing Bun test proving `registerAlias("o", "open")` makes `resolve("o")` return the exact registered `open` handler.
2. Run `bun test test/catalog.test.ts` and observe the missing behavior fail.
3. Implement alias storage and lookup in `CommandCatalog` without copying handlers.
4. Run `bun test test/catalog.test.ts` successfully.

Acceptance criteria:

- `CommandCatalog` exposes `registerAlias(alias, target)`.
- Alias lookup returns the canonical handler by identity.
- Canonical lookup remains passing.

Task verification: `bun test test/catalog.test.ts`

### Automated verification

- `bun test test/catalog.test.ts`

### Manual verification

- Confirm `registerAlias(alias, target)` is the intended public API.

## Implementation Notes

No implementation has started.
