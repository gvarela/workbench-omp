---
name: wb-implement_coordinated
description: Coordinates one planned phase through collision-free worker waves, independent verification, coordinator-owned Beads transitions, and a human checkpoint.
---

# Implement tasks with coordinated workers

Arguments: project directory under `docs/plans/` and a phase number or `continue`.

The main session coordinates; it does not implement code. Tiered workers edit a shared worktree, independent verifiers judge their results, and only the coordinator mutates Beads.

## 1. Load the complete phase

If either argument is missing, ask only for the missing value and stop. Verify and completely read `research.md`, `design.md`, and `tasks.md`. Completely read:

- `skill://wb-implement_coordinated/reference.md`
- `skill://wb-implement_coordinated/sub-agent-prompts.md`
- `skill://wb-implement_coordinated/templates.md`
- `skill://wb-reference/beads-not-initialized.md`
- `skill://wb-reference/beads-mode.md`

Extract the selected phase's mapped task ids, milestone id, dependencies, exact files, requirements, success criteria, task commands, phase commands, and manual checks. Reject missing, duplicate, or contradictory mappings.

For `continue`, derive the phase from live open/in-progress mapped issues, not document progress fields. A phase whose mapped tasks are all closed while its milestone is still open is awaiting the human checkpoint: resume at §7 for that phase. Never advance past a milestone awaiting confirmation. Read the existing `## Implementation Notes` in `tasks.md` before selecting work; earlier sessions record splits, deviations, and worker discoveries there.

Do not mutate `status`, `current_phase`, `total_tasks`, `completed_tasks`, markdown checkboxes, or unrelated issues. Do not commit, stage, push, or auto-fix files other than the `.beads/` commit in §9.

## 2. Establish Beads and runtime state

Run `bd info`, `bd stats --json`, `bd list --all -n 0 --json`, `bd ready --json`, `bd list --status=in_progress -n 0 --json`, `bd show <phase-id> --json`, and `bd show <task-id> --json` for every mapped phase task. If Beads is unavailable, present the standard not-initialized message and stop.

Use the extension-provided Beads mode message, or fall back to `git check-ignore -q .beads/` (exit 0 is stealth, otherwise git); mode affects persistence guidance only. Never read a mode environment variable.

From the repository root, run `omp config get task.maxConcurrency --json` and `omp config get task.softRequestBudget --json`. A positive `maxConcurrency` is the wave cap; `0` or unset means unlimited, and the collision-free set alone bounds the wave. Build the shared context package exactly as defined in the reference.

### Recover in-progress workers on `continue`

A mapped task left `in_progress` with no live worker is not a verification failure and is never verified as-is. Diagnose it with `git status --porcelain` and `git diff --stat` on its authorized files, per the reference playbook:

- pending verification: a worker or fix worker completed (the handoff, Implementation Notes, or the user says so) and the result that would decide the task has no schema-valid `wb-task-verifier` judgment in this session. This includes the second gate after a fix worker. Spawn one `wb-task-verifier` item now, before any classification. The coordinator's own `bd show`, test run, or source read is coordinator inspection: it never counts as the gate, never places a task on the blocking list, and never triggers the plan-defect protocol. A resumed session that ends with a classification but no `task` call in its own trace has violated this step.
- truncation: useful partial work landed and no blocker was reported. Spawn one tail worker item (sub-agent prompts) for only the unfinished tail, naming the landed files and remaining criteria; then verify the whole task.
- genuine failure: little or nothing landed, or a blocker was reported. Leave the issue in progress, record the exact evidence on the phase blocking list, and continue with independent ready work.

Never re-spawn the whole task.

## 3. Select and claim one wave

From `bd ready --json`, retain ready mapped tasks in the selected phase. Select a plan-ordered, pairwise file-disjoint subset up to the wave cap. File overlap, an unresolved dependency, or uncertain ownership excludes a task from the current wave.

### Split oversized tasks before spawning

Project each selected task's request cost: reads of the named files, discovery (near zero when the item names exact files), source edits, one to two requests per test file, focused runs, and verification. Truncated work is always the finishing tail, so a task projected past 75% of `task.softRequestBudget` is split at its natural seam before any spawn, usually source change then test conversion:

```bash
bd create "<slice outcome>" --type=task --priority=<original priority> --parent <phase-id> -d "Split from <original-id>. <requirements, targets, acceptance, verification for this slice>" --json
bd dep add <later-slice> <earlier-slice> --json
bd dep add <phase-id> <slice-id> --json
bd close <original-id> --reason "split into <slice ids>" --json
```

Repeat the dependency edge for every slice. The slices replace the original in the wave and are mapped phase tasks for the rest of this session. Record the split in `## Implementation Notes` with the original and slice ids so `continue` and `/wb:update_status` can reconcile the mapping.

### Claim and spawn

Before spawning, claim each selected id with `bd update <id> --claim --json`, then re-read those records. A claim failure removes the task from the wave.

Assign each selected task to exactly one tier from the reference ladder. `wb-task-worker-task` is the default; never use a concrete model id or a generic worker. Fill the worker item template with complete task-local context and set `schemaMode: strict` on every item.

Issue one `task` call whose `tasks[]` contains every worker in the wave. State the shared context once. Workers use the main worktree: do not request isolation. Every item must tell the worker that Beads mutation is forbidden.

The batch is asynchronous. When no coordinator work is safe until results arrive, use `hub wait`; handle each delivered result and continue waiting only while other wave jobs remain. Before acting on any result, read `agent://<id>` for its full output: the `<task-result>` envelope previews at most 5000 characters and points at `agent://<id>` when truncated.

## 4. Validate worker completion

A result is schema-valid only when the `<task-result>` envelope reports `status="completed"` and the payload is the agent's declared object. With `schemaMode: strict`, a schema violation exits non-zero and arrives as `failed`; `cancelled`, `(no output)`, a missing or extra field, or prose in place of the object is never a pass.

For each worker result:

- schema-valid `completed`: compare declared files with the authorized boundary and queue independent verification;
- soft-budget abort whose envelope states the agent is still live: apply the reference's same-worker `hub send` continuation once, then queue verification only after a schema-valid completed result;
- `cancelled` or `failed` without a live agent, useful partial work landed on the authorized files, and no blocker reported: spawn one tail worker item for the remaining slice per the reference playbook, then queue verification only after its schema-valid completed result;
- `blocked`, schema violation, second abort, or genuine failure: leave the issue open/in progress and add its exact evidence to the phase blocking list; do not verify or close it.

Do not treat a worker summary, passing worker command, or landed code as proof.

For all completed workers in the wave, issue one `task` batch of `wb-task-verifier` items using the verifier template, each with `schemaMode: strict`. Verifiers are read-only and never repair files or mutate Beads. Wait for all verifier results, then read every verifier's `agent://<id>` before gating any task.

A supplied or resumed schema-valid worker result follows the same barrier: spawn a fresh verifier before any close, repair, blocking classification, or design-revision mutation. The coordinator must never label a plan defect from its own inspection, even when the contradiction appears obvious.

## 5. Gate each task

For each verifier result:

### Verifier infrastructure failure

A verifier envelope that is `cancelled`, `failed`, or `(no output)` carries no findings and is not a verification verdict. Re-run that single verifier item once with the same inputs. If the second run also fails to return a schema-valid result, add the task to the phase blocking list with the two envelope statuses and abort reasons as evidence. Never spawn a fix worker from an empty or invalid verifier result.

### Pass

Confirm the result is schema-valid with `status: pass`, names evidence for every requirement, reports the exact command outcome, and has no material scope violation. Then close the issue:

```bash
bd close <task-id> --reason "<verified behavior>; independent command: <command and result>" --json
```

Add the task, files, tests, tier, and evidence to the success log and the phase's Modified Files aggregation.

### Implementation defect

Use the slow-fix template and spawn exactly one `wb-task-worker-slow` for that task with `schemaMode: strict`. Include the full original requirements and verifier findings. The fix worker does not mutate Beads. After it completes, run a fresh `wb-task-verifier`.

If the second verifier passes, close the issue. If it fails, leave the issue open/in progress and add it to the phase blocking list. Never spawn a second fix worker.

A fix worker that returns `blocked` with `blockers` citing a conflict with the approved design or task contract does not go onto the blocking list. Its claim is a lead: spawn a fresh `wb-task-verifier` against the landed state with the fix worker's blockers as input, and route the result through the plan-defect branch below. Any other fix-worker `blocked` result goes onto the blocking list with its exact blockers.

### Plan defect

Only a schema-valid `wb-task-verifier` failure with concrete plan-conflict evidence may enter this branch. Do not spawn a fix worker. Execute the plan-defect protocol in the reference: create a `Design revision:` issue, add blocking dependencies to the failed and affected not-yet-run tasks, and halt the phase immediately. Present the blocking-checkpoint template and route design revision through the design workflow without proposing a replacement design.

Ambiguous or schema-invalid verification is failure, never pass.

### Record worker discoveries

When a verified worker result reports a pre-existing defect, a repository quirk, or a deviation a later task or session would otherwise rediscover, append an entry under `## Implementation Notes` in `tasks.md` using the templates' entry shape. Carry the evidence text itself; `agent://` ids are prunable. Never add a note that only restates a Beads transition.

## 6. Continue authoritative waves

After closing passes and recording failures, run `bd ready --json` and `bd show` for relevant mapped ids. Select the next collision-free wave from current state.

Continue until one of these conditions holds:

1. all mapped phase tasks are independently verified and closed;
2. no independent ready work remains because the blocking list is non-empty;
3. a plan defect requires the immediate human checkpoint.

Never start a later phase.

## 7. Run the phase gate

Only when every mapped task is closed:

1. Run `bd show <phase-id> --json` and confirm no mapped task remains open, in progress, or blocked.
2. Write the phase's Modified Files aggregation into `tasks.md` using the templates' shape, built from the verified workers' `filesChanged` and `testsChanged`.
3. Run every exact automated phase command from the plan. Do not invent generic build, lint, typecheck, performance, or full-suite checks.
4. Exercise each changed surface required by success criteria. Web UI requires the actual browser; TUI and CLI require the actual program.
5. Read complete outputs and exit statuses. A failure reopens the implementation path; fix it through a scoped worker and independently verify again before returning to the gate.

If blocking tasks remain, report the blocking-checkpoint template. The phase milestone remains open.

## 8. Hold the human checkpoint

Present the phase-checkpoint template with worker/verifier evidence, exact automated results, and manual checks from the plan. Leave the milestone open until the user explicitly confirms every manual check.

If confirmation is absent, negative, incomplete, or unavailable, stop at the checkpoint without closing the milestone or starting another phase.

Only after explicit confirmation:

```bash
bd close <phase-id> --reason "Phase [N]: independently verified tasks, automated gate passed, manual checks confirmed" --json
bd ready --json
bd stats --json
```

## 9. Close out the phase

1. Append the phase entry to `## Implementation Notes` using the templates' phase-entry shape: worker count, tiers, and aggregated learnings with their evidence text.
2. Record durable learnings. If this phase established something the next session would otherwise rediscover (a repository convention, a tool quirk, a constraint the plan did not state), search first with `bd memories <keyword>` and update in place rather than duplicating:

   ```bash
   bd remember --key <project>-<slug> "<one sentence: the fact, then why it matters>"
   ```

   Qualifies: constraints and conventions. Does not qualify: task outcomes (Beads has them), plan deviations (Implementation Notes has them), anything specific to one task.
3. Persist Beads state. In git mode only:

   ```bash
   git add .beads/
   git commit -m "Update beads state after Phase [N] (coordinated execution)"
   ```

   In stealth mode, stage nothing; mutations are already persisted locally.

Report with the phase-completion template and direct the user to `/wb:update_status <project-directory>`. Do not hand-edit progress fields.
