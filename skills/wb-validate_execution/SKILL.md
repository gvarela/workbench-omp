---
name: wb-validate_execution
description: Independently validates an implemented Workbench plan against design, tasks, live Beads state, exact executable checks, regressions, and established patterns without mutating the project.
---

# Validate execution

Argument: project directory under `docs/plans/`.

This workflow is read-only. It returns an evidence report in the response; it never edits source, plan documents, tests, or Beads.

## 1. Read the full contract

If the argument is missing, ask for it and stop. Verify and completely read `research.md`, `design.md`, and `tasks.md`. Completely read `skill://wb-validate_execution/sub-agent-prompts.md`, `skill://wb-validate_execution/templates.md`, and `skill://wb-reference/documentarian-philosophy.md`.

Extract every mapped task id and requirement, named file, approved design constraint, success criterion, exact automated command, manual check, expected modified file, and research convention. Do not infer generic checks or desirable behavior absent from the plan.

Run `bd info`, `bd stats --json`, `bd list --all -n 0 --json`, and `bd show <id> --json` for the epic, every phase milestone, and every mapped task. If Beads is unavailable or a mapped id is missing, report the validation blocker; do not repair tracking.

Beads is authoritative for execution state, not proof of code behavior. Markdown checkboxes and progress fields do not override it.

## 2. Dispatch one read-only evidence batch

Build the four items from the prompt template: code implementation, test contract, regression surface, and pattern compliance. Issue exactly one `task` call containing all four items.

The two ad-hoc items must restate the documentarian constraint in both shared context and item text: document observed facts with file:line evidence; validation critique is limited to the requested plan; no speculative redesign or future improvements. Every item must explicitly forbid writes, Beads use, report creation, and validation command execution.

Do not run project-wide commands while the evidence batch is active. The batch is asynchronous: use `hub wait` until all four jobs settle, then read each `agent://<id>` in full before synthesis. The `<task-result>` envelope previews at most 5000 characters and points at `agent://<id>` when truncated; a preview is not the result. Treat agent findings as leads, not proof.

## 3. Run exact automated evidence

After all four results are read, run every distinct automated command specified by the selected plan exactly once in the main session. Preserve required working directories and environment described by the plan. Read complete output and exit status.

Do not substitute or append generic build, lint, typecheck, coverage, integration, full-suite, or performance commands. If a command cannot run, record `FAIL` with the exact prerequisite or error; do not replace it with source inspection.

Where the plan requires a live surface beyond its commands, exercise that surface: actual browser for web UI, actual process for CLI/TUI, or the smallest throwaway smoke scenario. Do not claim unexecuted manual checks.

## 4. Reconcile each requirement

For every mapped task and success criterion, combine:

- live Beads status;
- direct source and caller evidence;
- durable test behavior;
- exact command result;
- regression and established-pattern findings;
- manual confirmation state.

Resolve conflicts yourself by reading the cited file or rerunning only the disputed focused scenario. A closed issue with missing behavior is a validation failure. Implemented behavior on an open issue is not permission to mutate Beads; report the tracking state separately.

Report unexpected implementation only when it is a material scope deviation. Do not turn validation into a design review, generic code-quality audit, or list of possible improvements.

## 5. Return the report

Use the report template exactly. Every pass/fail claim needs a file:line reference, exact command result, live Beads record, or explicit user confirmation. State manual checks as pending, failed, confirmed, or unavailable.

Do not edit tasks.md completion fields, add implementation notes, create a report file, open issues, or repair failures. End with the verdict and the precise blocking evidence, if any.
