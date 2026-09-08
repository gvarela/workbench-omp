# Coordinated execution reference

## Context package

Build one shared package for the selected phase:

```text
# Goal
[phase outcome and user-visible value]

# Constraints
- [design constraints]
- [established repository and test conventions with file:line evidence]
- Beads mode: [stealth or git]
- Workers share the main worktree and never mutate Beads.
- No scope beyond the mapped phase tasks.

# Contract
- Phase milestone: [id]
- Exact phase verification commands: [commands]
- Manual checks: [checks]
- Worker output uses the selected profile's structured schema.
- The coordinator alone claims and closes issues.
```

Each task item adds only its own complete requirements, expected files, relevant source/test references, exact focused command, and acceptance criteria. Do not paste whole research, design, or task documents into a worker prompt.

## Collision-free wave selection

Starting from `bd ready --json`, retain only mapped task ids in the selected phase. Exclude milestones, epics, blocked tasks, already-running tasks, and tasks whose plan files overlap another selected task. File overlap is a dependency-planning boundary: never let two workers edit the same file concurrently.

Choose up to `task.maxConcurrency`; `0` or unset means unlimited and the collision-free set alone bounds the wave. Prefer plan order when more tasks are ready than fit. Split any task projected past 75% of `task.softRequestBudget` before selection. Claim every selected issue before the single wave spawn. All workers share the main worktree; do not request isolated worktrees.

After a wave settles, verify completed workers as another batch. Close only verifier passes, then query `bd ready --json` again. A new wave is selected from the new authoritative state.

## Worker tier ladder

- `wb-task-worker-smol`: mechanical documentation, exact configuration, or a tightly specified rename with no design judgment.
- `wb-task-worker-task`: normal feature, bug, test, or local refactor work. Default when uncertain.
- `wb-task-worker-slow`: architectural, cross-cutting, concurrency, migration, or otherwise high-risk work.

Never pass a concrete model id. A verifier failure caused by implementation receives exactly one `wb-task-worker-slow` fix attempt, regardless of the initial tier. A second verifier failure goes onto the phase blocking list; do not spawn another fix worker. Every worker, verifier, and fix item sets `schemaMode: strict`.

## Worker outcome playbook

Read the `<task-result>` envelope first, then `agent://<id>` for the full payload. Envelope `status` values: `completed` (exit 0), `failed (exit N)` (includes strict-mode schema violations), `cancelled` (aborted; `<abort-reason>` names the cause), `merge failed`.

### Completed structured result

Check that every declared changed file belongs to the task boundary and that the worker reports Red, Green, and final commands when production behavior changed. Spawn a verifier; the worker report is not proof.

### Soft-budget abort of a live agent

Signature: `status="cancelled"`, an `<abort-reason>` beginning `Soft request budget exceeded`, and the envelope sentence stating the agent is still live and messageable via `hub`. Only a soft-budget stop of a non-isolated agent leaves it live; hard-budget, runtime, and user cancellations tear the agent down, and a `failed` exit is not a budget abort.

1. Inspect only the affected paths and current diff to identify the unfinished tail.
2. Take the agent id from the envelope's `id` attribute. Do not look it up with `hub list`.
3. Send that id one continuation with `hub send`: name the landed files, remaining acceptance criteria, and remaining verification. Say explicitly not to repeat completed work and not to mutate Beads.
4. Wait for that agent's re-yield. Verify the whole task only after a schema-valid completed result.

Use at most one tail continuation. A second abort or invalid result goes onto the blocking list. Never retry the whole task; the same oversized request repeats the failure.

### Truncation without a live agent

Signature: the envelope is `cancelled` or `failed` with no live-agent sentence, useful partial files landed on the authorized paths, and no human blocker was reported. This is also the shape of an `in_progress` task found on `continue` whose worker belongs to an earlier session.

Inventory the landed work with `git status --porcelain` and `git diff --stat` on the authorized files. Spawn one tail worker item for only the remaining slice, naming the exact files still to change. Verify the whole task after it completes. Never re-spawn the whole task.

### Genuine worker blocker

Signature: the result is `blocked`, little or no work landed, or the worker names an unavailable prerequisite or human decision. Do not run a verifier. Leave the issue open/in progress, add the exact blocker to the phase list, and continue only with independent ready work.

## Verifier infrastructure failure

A verifier envelope that is `cancelled`, `failed`, or `(no output)` returned no verdict. Re-run the same verifier item once. A second non-schema-valid result puts the task on the blocking list with both envelope statuses and abort reasons; the task stays open/in progress. Do not spawn a fix worker on the strength of an empty result.

## Verifier failure classification

An implementation defect means the task is achievable as written but the implementation, tests, cleanup, or scope is wrong. Send the verifier findings and original task contract to one slow fix worker, then re-run the verifier.

A plan defect means satisfying the finding would require changing the approved design or task contract: a required interface is absent, constraints conflict, a precondition is false, or the specified outcome is impossible in the observed repository.

This classification is permitted only after a fresh, schema-valid `wb-task-verifier` result. Coordinator inspection and worker claims are leads, never the independent gate. A fix worker's `blocked` result whose `blockers` cite the approved design or task contract is such a lead: spawn a fresh verifier with those blockers as input and classify from its result.

For a plan defect:

1. Reopen the failed issue if necessary and leave it unclosed.
2. Create `bd create "Design revision: <failed assumption>" --type=task --priority=1 --description "Task <id> cannot succeed as specified: <evidence>. Design reference: <path:line>." --json` and capture the id.
3. Add `bd dep add <affected-task-id> <revision-id> --json` for the failed task and every not-yet-run mapped task that relies on the same assumption.
4. Stop spawning workers. Report the failed task, verifier evidence, affected ids, and revision id. Do not propose replacement contracts at this checkpoint.
5. Route the change through `/wb:create_design` and, when an architectural choice reopened, `/wb:explore_design` first.

Do not send a plan defect to a fix worker.
