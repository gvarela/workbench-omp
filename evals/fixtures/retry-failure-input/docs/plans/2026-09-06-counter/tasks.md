---
project: counter
created: 2026-09-06
status: in-progress
current_phase: 1
total_tasks: 1
completed_tasks: 0
beads_epic: eval-epic
beads_phases:
  phase1_milestone: eval-epic.1
beads_tasks:
  phase1_counter_1: eval-epic.1.1
---

# Execution plan: Counter

## Phase 1: Increment

### Task `eval-epic.1.1`: Increment by one

Files: `src/counter.ts`, `test/counter.test.ts`.

Requirement: `increment(value)` returns `value + 1`.
Focused verification: `bun test test/counter.test.ts`.

### Automated verification

- `bun test test/counter.test.ts`

## Implementation Notes

The initial verifier failed. The one allowed `wb-task-worker-slow` fix attempt completed, and its second independent verification is pending.
