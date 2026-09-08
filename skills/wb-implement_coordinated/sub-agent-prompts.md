# Coordinated sub-agent prompts

Use these fields in every `task` item. Fill brackets with exact plan and repository evidence. Do not omit the headings required by the task tool.

Every worker, verifier, and slow-fix item sets `schemaMode: strict`. The agent frontmatter supplies the output schema; strict mode makes OMP reject a payload that violates it with a non-zero exit, so the `<task-result>` envelope reports `failed` instead of `completed`. A result is schema-valid only when the envelope says `status="completed"` and the payload is the declared object; treat anything else as failure.

## Worker item

```text
# Target
Issue [id], [title]. Implement exactly [requirements]. Expected files: [paths]. Relevant established patterns: [file:line references]. Non-goals: every adjacent behavior not named by this issue.

# Change
Read the named source and tests. Apply Red, Green, Refactor under the autoloaded worker contracts. Use the focused command `[command]`. Never run `bd` or edit `.beads`; the coordinator already claimed the issue. Preserve unrelated changes in the shared worktree.

# Acceptance
[criterion list]. Return the profile's structured result with every changed file, test, exact command, observed Red/Green evidence, and blocker. Do not return a plan or prose.
```

Select `agent` from the tier ladder, set `schemaMode: strict`, and give the item a unique CamelCase `name` derived from the issue.

## Verifier item

```text
# Target
Read-only verification of issue [id], [title]. Requirements: [complete requirements]. Expected scope: [paths]. Worker result: [structured result].

# Change
Independently read the changed path and affected callers. Run `[exact focused command]` and any task-required scenario. Check consumer-visible behavior, every acceptance criterion, cleanup, and scope. Do not write files, repair code, run `bd`, or edit `.beads`.

# Acceptance
Return only the wb-task-verifier structured result. `pass` requires fresh evidence for every requirement and no material scope violation. On `fail`, findings must distinguish an achievable implementation defect from evidence that the approved plan itself is impossible.
```

Always use `agent: wb-task-verifier` with `schemaMode: strict`. When the verifier is re-run after an infrastructure failure or spawned from a fix worker's plan-conflict blockers, add those blockers to the worker-result field and keep everything else identical.

## Slow fix item

```text
# Target
Repair issue [id] after independent verification failed. Original requirements: [requirements]. Authorized files: [paths]. Verifier findings: [findings].

# Change
Inspect the landed implementation and fix only the cited implementation defects. Preserve valid work and unrelated shared-tree changes. Rerun the focused test and task verification. Never run `bd` or edit `.beads`.

# Acceptance
Every original criterion and verifier finding is satisfied with fresh evidence. Return only the wb-task-worker-slow structured result. Return `blocked` if a finding requires changing the approved plan, and name the conflicting design or task statement in `blockers`.
```

Always use `agent: wb-task-worker-slow` with `schemaMode: strict`. Exactly one fix spawn is allowed before re-verification.

## Tail worker item

Use after a truncated worker whose agent is no longer live, or for an `in_progress` task recovered on `continue`. Same tier as the original task, `schemaMode: strict`.

```text
# Target
Finish only the unfinished tail of issue [id], [title]. Landed files: [paths]. Completed work: [evidence from the diff]. Remaining criteria: [list]. Authorized files: [paths].

# Change
Do not repeat finished work. Complete the remaining criteria under the autoloaded worker contracts and run `[remaining command]`. Never run `bd` or edit `.beads`. Touch no unrelated files.

# Acceptance
Every original criterion holds with fresh evidence for the whole task. Return only the profile's structured result.
```

## Truncation continuation

Only for a soft-budget abort whose `<task-result>` envelope states the agent is still live. Send to that agent id with `hub send`:

```text
Continue only the unfinished tail of issue [id]. Landed files: [paths]. Completed work: [evidence]. Remaining criteria: [list]. Remaining command: [command]. Do not repeat finished work, run Beads, or touch unrelated files. Yield the normal structured result after the whole task verifies.
```
