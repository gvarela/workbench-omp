---
name: wb-create_tasks
description: Converts approved design into executable phased tasks plus a complete Beads epic, milestone, task, and dependency hierarchy.
---

# Create execution tasks

This judgment-heavy workflow writes specifications consumed by workers and verifiers. Use the session's strongest configured planning capability. Warn once, without blocking, when the active session is not using the configured high-reasoning planning choice. In the same warning, when an `advisor` role is configured and the advisor is off, suggest `/advisor on` for this stage and `/advisor off` before implementation; `wb-oracle` remains available for a one-off critique of the dependency graph. Do not toggle it yourself.

Plan only how to implement the approved design. Add no scope, requirements, hardening, or architectural decisions. A design defect returns to `/wb:create_design`; never plan around it.

Argument: project directory.

## 1. Read and validate foundations

Read `research.md`, `design.md`, and existing `tasks.md` completely. Record the exact initial values of `status`, `current_phase`, `total_tasks`, and `completed_tasks` before doing anything else. Require:

- research `status: complete` and no failed validation;
- design `status: ready` and `approval: approved`;
- no open `Q:` or `Decide:` issue that blocks execution.

Preserve those four recorded `tasks.md` values exactly; only `/wb:update_status` may reconcile them after planning.

Run `bd info`. If unavailable, follow `skill://wb-reference/beads-not-initialized.md` and stop. Determine Beads mode from the extension session message; if absent, run `git check-ignore -q .beads/` and interpret success as stealth mode. Do not use an environment variable for mode. Inspect planning state with `bd list`; never use `bd q`, because current Beads treats it as quick-create rather than a read query.

## 2. Analyze the implementation surface

Read `skill://wb-create_tasks/sub-agent-prompts.md` in full. Then call `task` exactly once with one batch containing the three read-only items named there: dependency analysis, test analysis, and pattern analysis. Use the exact `agent` values in the prompt templates. Wait for every job to settle, then read every complete `agent://<id>` result before planning.

This is a mandatory pre-write barrier. Do not design phases, read the output template, edit `tasks.md`, or mutate Beads until the single batch completes and all three results are consumed. If it cannot run, stop; never replace it with coordinator-only inspection.

Agents document the existing code only and never write files or mutate Beads. Reconcile conflicting citations against source.

## 3. Design phases and task graph

Bridge research's current state to design's target state. Derive every task from a named design scope item, success criterion, contract, or risk mitigation. Use the smallest graph that covers the approved design. Split only at a natural independently verifiable implementation seam or when the configured request budget requires it. Each behavioral task owns the focused regression tests needed for Red/Green/Refactor; do not defer all tests to a later testing phase. Phase verification and human confirmation are milestone gates, not separate Beads task issues. Never create a task whose only action is to run tests, review work, or change files only if another task breaks them.

For each task specify:

- outcome and exact source/test targets with current line references;
- current state and target behavior by document reference;
- bounded implementation actions;
- observable acceptance criteria;
- focused verification commands discovered from current repository scripts or test configuration;
- output artifacts consumed by dependents;
- files it may modify, including every source and test path named by its targets or actions;
- exact language-level contract details from design, such as immutable collection types, in the action itself rather than only in prose acceptance;
- estimated worker model requests.

From the repository root—not from the project directory—run `omp config get task.softRequestBudget --json`; configuration discovery is rooted at the command's working directory. Estimate worker requests for discovery, source edits, Red/Green/Refactor, focused verification, evidence, and wrap-up. Leave at least 25% of the configured budget for verification and final reporting. Split a task at a natural, independently verifiable seam when the estimate exceeds the remaining 75%; never assume a fixed global threshold or count tool calls as model requests.

Reject any verification command that is not present in repository scripts/configuration or demonstrated by an existing project command. Do not invent a build, lint, or test target.

Graph rules:

- Add dependency A → B only when B consumes a concrete symbol, schema, file, or other artifact introduced by A. “Consistent state,” phase ordering, easier integration, and shared files are not data outputs.
- Listing order creates no dependency; healthy plans branch only when the work is genuinely independent.
- Compare every pair of task allowed-file sets. If they overlap and no real data dependency already serializes them, add a dependency and label it `file-overlap serialization` in both the plan and dependent issue. Never relabel file overlap as data flow or describe overlapping tasks as parallel.
- Structural refactors precede behavioral tasks that build on the new structure.
- Every phase milestone depends on all tasks in that phase.
- When a later phase requires the preceding phase outcome, every task in that later phase depends on the preceding phase milestone; the later milestone also depends on the preceding milestone. A milestone-to-milestone edge alone does not block its child tasks.
- Every phase ends with automated verification and explicit human confirmation.

## 4. Prepare the final document without writing

Read `skill://wb-create_tasks/templates.md` and `skill://wb-create_tasks/examples.md` in full. Build the complete phase/task specification in working context, but do not edit `tasks.md` yet: its final body requires live Beads ids.

Preserve frontmatter `status:`, `current_phase`, `total_tasks`, `completed_tasks`, and creation metadata; `/wb:update_status` is the sole writer of those progress fields. The eventual document must contain no markdown task-status checkboxes because Beads is the durable authority.

Before any Beads mutation, verify every planned task is concrete, every file reference exists or is explicitly marked as a new path approved by design, every verification command is repository-valid, and no template token or placeholder phrase remains other than the template's `(none yet)` entries under Modified Files and Implementation Notes.

## 5. Create or reconcile the Beads hierarchy

The coordinator performs every `bd` mutation. Before creating anything, inspect existing issues including closed records with `bd list --all -n 0 --json`. On a rerun, inspect ids already recorded in frontmatter with `bd show`; if a prior attempt created Beads before the final document write, reconcile exact epic/milestone/task titles and parent relationships from the prepared plan. Reuse one exact match, stop on ambiguity, and never create duplicates blindly.

For a fresh plan:

1. Create one project implementation epic titled exactly `<tasks.md project value> Implementation`.
2. Create each `Phase N Milestone: <name>` with `--parent <epic-id>`.
3. Create one task issue for every plan task with `--parent <milestone-id>`, a description containing phase, task type, exact targets, acceptance, verification, request estimate, and allowed files.
4. Add task dependencies using the graph rules.
5. Make every milestone depend on all child tasks; make each later milestone depend on the prior milestone.
6. Add explicit notes to every file-overlap serialization edge.

Capture every returned id. Read `skill://wb-create_tasks/examples.md` for command shapes. Verify the epic and every milestone and task with `bd show <id> --json`; stop on any missing or mismatched record.

Only after every live id and edge exists, produce the final `tasks.md` once. Prefer surgical edit hunks that leave the original `status`, `current_phase`, `total_tasks`, and `completed_tasks` lines outside every edited range: update `last_updated`, insert or replace only `depends_on` and Beads mapping lines, then replace the document body after the closing frontmatter delimiter. If the available editor requires a whole-file replacement, copy those four recorded values exactly. Never derive new progress values or write `(pending)`, provisional ids, template tokens, or partial task content.

Read the written frontmatter immediately and compare all four progress fields to the recorded initial values. Any difference is a failed completeness check: restore the exact initial value before continuing. Then run `bd ready --json` and `bd blocked --json` to verify hierarchy, edges, and parallel width. Direct the user to `/wb:update_status` after planning.

## 6. Completeness barrier

Read the full research, design, and generated tasks documents again. Confirm:

- every in-scope item and success criterion maps to at least one task;
- every task maps to one live Beads issue;
- every design risk mitigation and approved assumption is represented;
- dependencies name consumed outputs or an annotated exception;
- every overlapping allowed-file pair is serialized and labeled `file-overlap serialization` in the plan and dependent issue;
- no overlapping tasks are described as parallel;
- every task's allowed files contain every path named by its targets and actions;
- each acceptance scenario has one owning task; no later test task duplicates focused tests already owned by a behavior task;
- every verification command is repository-valid and no verification-only task duplicates the phase gate;
- no task re-decides design or imports new scope;
- frontmatter ids resolve;
- the four progress fields exactly equal their recorded initial values.

Correct omissions before reporting.

## Result

Report the plan path, phases and task counts, epic and milestone ids, ready work, branching width, configured request budget, and split decisions. Direct the user first to `/wb:update_status <project-directory>` so it can reconcile progress metadata, then to `/wb:implement_tasks <project-directory>` or `/wb:implement_coordinated <project-directory>`.
