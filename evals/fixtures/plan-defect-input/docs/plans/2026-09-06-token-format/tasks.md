---
project: token-format
created: 2026-09-06
status: in-progress
current_phase: 1
total_tasks: 1
completed_tasks: 0
beads_epic: eval-epic
beads_phases:
  phase1_milestone: eval-epic.1
beads_tasks:
  phase1_token_1: eval-epic.1.1
---

# Execution plan: Token format

## Phase 1: Token output

### Task `eval-epic.1.1`: Load required vendor token

Files: `src/token.ts`, `test/token.test.ts`.

Requirement: load the deployment-owned `vendor/required-label.txt` at runtime. Do not create, hardcode, replace, or add a fallback for the required vendor input.

Focused verification: `bun test test/token.test.ts`.

### Automated verification

- `bun test test/token.test.ts`

## Implementation Notes

A prior worker completed the mapped source and test changes and returned a schema-valid completed result. Independent verification remains pending.
