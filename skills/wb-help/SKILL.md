---
name: wb-help
description: Explains Workbench workflows, commands, Beads tracking, and recovery paths.
---

# Workbench Help

Use the user's supplied topic, when present, to focus the response. Explain the
relevant workflow conversationally instead of dumping this reference verbatim.
Answer questions and direct the user to the smallest appropriate command.

## Topics

- `/wb:help workflow`: command sequence and phase boundaries.
- `/wb:help beads`: durable issue tracking and planning prefixes.
- `/wb:help mockup`: versioned mockup workflow.
- `/wb:help <command>`: arguments and purpose of one command.

## Primary workflow

1. `/wb:create_project [name] [directory] [ticket]` initializes the project
   document set.
2. `/wb:create_research [directory]` documents the existing codebase using
   file-and-line evidence. Research records what exists, not what should change.
3. `/wb:create_product_research [directory]` documents current user-visible
   behavior and product constraints.
4. `/wb:research-validation [directory]` checks research claims and citations.
5. `/wb:explore_design [directory]` optionally explores consequential or
   difficult-to-reverse architecture choices and records the decision.
6. `/wb:create_design [directory]` decides what to build and why.
7. `/wb:create_tasks [directory]` turns the approved design into phased work and
   Beads issues.
8. `/wb:validate_project [directory]` checks document structure, frontmatter,
   dependencies, and Beads linkage.
9. `/wb:implement_tasks [directory] [phase|continue]` implements one phase with
   TDD and explicit checkpoints.
10. `/wb:implement_coordinated [directory] [phase|continue]` executes
    collision-free task waves with worker and verifier agents.
11. `/wb:validate_execution [directory]` checks the implementation against the
    approved design and task plan.
12. `/wb:update_status [directory]` synchronizes document status from Beads.

Use `explore_design` when research exposes multiple viable approaches, the
change introduces a subsystem, or the choice is hard to reverse. Skip it for a
small, well-scoped change with one proportionate design direction.

## Session and review commands

- `/wb:create_handoff [directory] [reason]` writes a durable handoff file with
  plan and Beads state.
- `/wb:resume_handoff [handoff-file]` validates and resumes that file in a later
  session.
- `/wb:review-prep [directory]` prepares the implemented work for human review.

Workbench handoff files are distinct from OMP's native `/handoff`: the native
command compacts the current session, while Workbench handoffs are inspectable
files intended to survive session and machine boundaries.

## Mockup workflow

1. `/wb:create_mockup [directory] [feature]` researches existing UI patterns,
   asks clarifying questions, and creates `v001`.
2. `/wb:mockup-iteration [directory] [feedback]` creates the next immutable
   version while recording keep, remove, and change decisions.
3. Resolve every open `UI Q:` issue before finalization.
4. Finalization compiles approved UI requirements into the project design.

## Beads integration

Beads is the durable authority for project status. OMP's `todo` may describe the
current turn only; it never replaces or closes Beads work.

Initialize once per project:

```bash
bd init
```

Use `bd init --stealth` when `.beads/` must remain gitignored.

Common execution commands:

```bash
bd ready
bd list -n 0
bd show <issue-id>
bd update <issue-id> --claim
bd close <issue-id> --reason "Done"
bd blocked
bd stats
```

In git mode, Beads auto-flushes `.beads/issues.jsonl`; commit `.beads/` with the
implementation. When a Dolt remote is configured, use `bd dolt push` and
`bd dolt pull` for its database synchronization.

### Planning prefixes

- `Q: <question>`: an unanswered research question.
- `Decide: <choice>`: a stakeholder or architecture decision.
- `Validate: <assumption>`: an assumption implementation must verify.
- `UI Q: <question>`: an unresolved mockup decision.
- `UI Assumption: <assumption>`: a mockup assumption requiring confirmation.

Prefixes count only at the beginning of an issue title. Open planning issues
block the affected phase. A closed `Decide:` issue means the choice and rationale
were recorded in its close reason. `explore_design` creates and closes its
`Decide:` record in one session; `create_design` consumes that recorded choice.

Inspect blockers with:

```bash
bd list -n 0 --status=open
```

Do not replace unavailable Beads tracking with markdown checkboxes. Report the
failure, direct the user to initialize or repair Beads, and stop at that gate.

## Core principles

1. Research documents what is; design decides what should change.
2. Explicit barriers require completed evidence before proceeding.
3. Implementation follows the approved tasks without scope creep.
4. Each implementation task follows Red, Green, Refactor.
5. Beads remains the durable status authority across sessions.
6. After compaction, re-read the active plan documents before making claims
   about their contents.
7. A phase that already required compaction should use a durable Workbench
   handoff instead of repeatedly compacting.

## Troubleshooting

### Beads is not initialized

Run `bd init` or `bd init --stealth`, then rerun `/wb:create_tasks` when the
project does not yet have its issue hierarchy.

### Issue not found

Run `bd list -n 0`, identify the correct issue id, and retry the failed command.

### Database locked

Wait briefly and retry. Check for another Beads process or a stale
`.beads/daemon.lock` only after confirming no active process owns it.

### Project tracking metadata is missing

Run `/wb:create_tasks [directory]` to create the Beads hierarchy, then
`/wb:validate_project [directory]` to verify linkage.
