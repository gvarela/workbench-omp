---
project: command-aliases
created: 2026-09-06
status: complete
last_updated: 2026-09-06
git_commit: fixture
git_branch: main
current_phase: 1
total_tasks: 1
completed_tasks: 1
depends_on: [research.md, design.md]
beads_epic: eval-epic
beads_phases:
  phase1_milestone: eval-epic.1
beads_tasks:
  phase1_alias_1: eval-epic.1.1
---

# Execution plan: Command aliases

## Phase 1: Alias lookup

### Task `eval-epic.1.1`: Add alias lookup

Files: `src/catalog.ts`, `test/catalog.test.ts`.

Requirements:

- Expose `registerAlias(alias, target)`.
- Resolve aliases to the canonical handler by identity.
- Preserve canonical lookup.

Focused verification: `bun test test/catalog.test.ts`.

### Automated verification

- `bun test test/catalog.test.ts`

### Manual verification

- Confirm the method name is appropriate for public callers.
