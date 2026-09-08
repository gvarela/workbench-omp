---
name: wb-implement_tasks
description: Implements one planned phase inline with TDD, authoritative Beads transitions, fresh executable verification, and a human phase checkpoint.
---

# Implement tasks

Arguments: project directory under `docs/plans/` and a phase number or `continue`.

Implement only one phase, in this session. Do not delegate task implementation. Beads is the sole durable execution authority; markdown checkboxes and progress fields are descriptive only.

## 1. Load the complete contract

If either argument is missing, ask only for the missing value and stop. Verify `research.md`, `design.md`, and `tasks.md` exist, then read each one completely. Read `skill://wb-tdd-discipline/SKILL.md`, `skill://wb-implement_tasks/templates.md`, `skill://wb-reference/beads-not-initialized.md`, and `skill://wb-reference/beads-mode.md` completely.

Extract the requested phase goal, its ordered task ids from `beads_tasks`, its milestone id from `beads_phases`, every task acceptance criterion, exact verification command, manual check, named file, and relevant research pattern. If a mapped id is absent, duplicated, or does not correspond to the requested phase, report the mapping defect and stop.

For `continue`, derive the active phase from open/in-progress mapped issues rather than trusting `current_phase`. A phase whose mapped tasks are all closed while its milestone is still open is awaiting the human checkpoint: resume at §5 for that phase. Never advance past a milestone awaiting confirmation. Read the existing `## Implementation Notes` before selecting work; earlier sessions record discoveries and deviations there.

## 2. Establish authoritative state

Run `bd info`. If Beads is unavailable, present the standard not-initialized message and stop without implementation.

Read the extension-provided Beads mode message, or fall back to `git check-ignore -q .beads/` (exit 0 is stealth, otherwise git); mode changes persistence guidance only. Never read a mode environment variable.

Run:

```bash
bd stats --json
bd list --all -n 0 --json
bd ready --json
bd list --status=in_progress -n 0 --json
bd show [phase-milestone-id] --json
bd show [task-id] --json
```

Run `bd show` for every mapped task in the selected phase. Reject missing ids and task/document disagreements. Closed issues stay closed unless fresh verification exposes a real regression. Work only on ready tasks in plan order; an in-progress mapped task resumes first. Before resuming it, inventory the landed work with `git status --porcelain` and `git diff --stat` on its named files, finish only the unfinished tail, and rerun the full task verification.

Do not mutate `status`, `current_phase`, `total_tasks`, `completed_tasks`, markdown checkboxes, or unrelated Beads issues. `/wb:update_status` is the sole progress-field writer. Do not commit, stage, push, or auto-fix files other than the `.beads/` commit in §6.

## 3. Implement each task

For the next ready task:

1. Read its complete plan section, `bd show` record, named source, named tests, and the established patterns they rely on.
2. Claim it with `bd update [id] --claim --json`. Do not claim a blocked issue.
3. Follow the TDD skill:
   - RED: add the smallest consumer-visible test for a plausible defect and run it to observe the intended failure.
   - GREEN: implement exactly the planned behavior and run the focused test successfully.
   - REFACTOR: only plan-required or behavior-preserving cleanup; rerun the focused test after the final change.
4. Run every task-specific verification command exactly as written. Exercise the changed behavior itself with the real CLI, TUI, browser surface, service, or a throwaway smoke script when the plan has no suitable command.
5. Check every acceptance criterion against fresh evidence.
6. Close with `bd close [id] --reason "<verified behavior and command>" --json` only after all criteria and verification pass.
7. Add the task's changed files to the phase's Modified Files section in `tasks.md` using the templates' shape.
8. Run `bd ready --json`, then continue with the next ready mapped task in this phase.

### When to skip TDD

These tasks may omit the RED phase because they change no production behavior:

- configuration changes
- documentation updates
- refactoring already covered by existing tests
- build or deployment scripts

They still require an executable or structural verification appropriate to the changed surface: run the configuration or script, render or lint the document, and rerun the covering tests after a refactor. Everything else follows the iron law.

Do not add retries, validation, abstractions, telemetry, optimizations, refactors, or edge cases absent from the plan. If you find a pre-existing bug, a performance concern, or behavior the task does not mention, do not fix or extend it unless the requested behavior cannot work without it; record it as a follow-up under `## Implementation Notes` using the templates' task-entry shape. Record a genuine implementation discovery or deviation there when a later task or session would otherwise be misled. Never add notes merely to restate a Beads transition.

If implementation cannot satisfy the documented design, do not improvise a new contract. Leave the issue open or in progress, present the exact conflict and evidence with the blocked-task template, and stop the phase.

## 4. Run the phase gate

After all mapped tasks in the selected phase are closed:

1. Run `bd show [phase-milestone-id] --json` and confirm no phase task remains open, blocked, or in progress.
2. Run every exact automated verification command listed for the phase. Do not substitute generic build, lint, typecheck, or full-suite commands.
3. Re-exercise each changed surface required by the phase success criteria. Web UI requires the actual browser surface; TUI and CLI changes require the actual program.
4. Read the complete output and exit status. Fix failures within the selected phase, rerun the failing evidence, then rerun any phase command invalidated by the fix.

Passing adjacent tests or source inspection is not evidence for a failed or unrun gate.

## 5. Hold the human checkpoint

Present the manual checkpoint template with the exact manual checks from the plan and the fresh automated evidence. The phase milestone must remain open until the user explicitly confirms those checks.

An invocation request, a prior approval, silence, “looks plausible,” or automated success is not manual confirmation. If the user says verification is incomplete, unavailable, failed, or not confirmed, leave the milestone open and report the remaining checks. Stop; do not begin another phase.

Only after explicit confirmation in the conversation:

```bash
bd close [phase-milestone-id] --reason "Phase [N]: tasks verified, automated gate passed, manual checks confirmed" --json
bd ready --json
bd stats --json
```

## 6. Close out the phase

1. Append the phase entry to `## Implementation Notes` using the templates' phase-entry shape when the phase produced learnings or deviations.
2. Record durable learnings. If this phase established something the next session would otherwise rediscover (a repository convention, a tool quirk, a constraint the plan did not state), search first with `bd memories <keyword>` and update in place rather than duplicating:

   ```bash
   bd remember --key <project>-<slug> "<one sentence: the fact, then why it matters>"
   ```

   Qualifies: constraints and conventions. Does not qualify: task outcomes (Beads has them), plan deviations (Implementation Notes has them), anything specific to one task.
3. Persist Beads state. In git mode only:

   ```bash
   git add .beads/
   git commit -m "Update beads state after Phase [N]"
   ```

   In stealth mode, stage nothing; mutations are already persisted locally.

Report with the phase-completion template. Direct the user to `/wb:update_status <project-directory>` for document reconciliation. Do not start the next phase in the same invocation.
