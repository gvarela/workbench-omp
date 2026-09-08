---
project: command-ux
created: 2026-09-06
status: not-started
last_updated: 2026-09-06
git_commit: fixture
git_branch: main
current_phase: 0
total_tasks: 2
completed_tasks: 0
depends_on: [research.md, design.md]
beads_epic: eval-epic
beads_phases:
  phase1_milestone: eval-epic.1
beads_tasks:
  phase1_alias_1: eval-epic.1.1
  phase1_help_2: eval-epic.1.2
---

# Execution plan: Command UX

## Phase 1: Independent command improvements

### Task `eval-epic.1.1`: Add alias resolution

Files: `src/catalog.ts`, `test/catalog.test.ts`.

Add a failing behavior test, then implement `registerAlias(alias, target)` so alias lookup returns the canonical handler by identity without changing canonical lookup.

Acceptance: public method exists; alias identity and canonical behavior pass.
Focused verification: `bun test test/catalog.test.ts`.

### Task `eval-epic.1.2`: Render descriptive help

Files: `src/help.ts`, `test/help.test.ts`.

Add a failing behavior test for two entries, then change `formatHelp` to render one `<name>: <description>` line per entry in input order.

Acceptance: descriptions appear; input order is preserved; the exact two-line output passes.
Focused verification: `bun test test/help.test.ts`.

### Automated verification

- `bun test`

### Manual verification

- Confirm `registerAlias(alias, target)` and `<name>: <description>` are the intended public formats.

## Implementation Notes

No implementation has started.
