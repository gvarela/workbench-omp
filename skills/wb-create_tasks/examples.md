# Beads hierarchy examples

The coordinator runs these commands and captures every id. Use actual plan text; angle-bracket names below describe required substitutions.

## Create hierarchy

```bash
bd create "<Project> Implementation" --type=epic --priority=2 -d "Implementation tracking for <project>. Plan: <project-dir>/tasks.md."
bd create "Phase 1 Milestone: <name>" --type=task --priority=2 --parent <epic-id> -d "Objective: <outcome>. Completes when all child tasks pass verification and the human checkpoint is confirmed."
bd create "<specific task outcome>" --type=task --priority=2 --parent <milestone-id> -d "Phase: 1. Type: implementation. Targets: <paths>. Acceptance: <observable result>. Verification: <commands>. Estimated worker requests: <estimate>/<budget>. Allowed files: <files>."
```

## Add dependencies

`bd dep add <dependent> <prerequisite>` means the first issue cannot proceed until the second closes.

```bash
# Task B consumes an interface created by Task A.
bd dep add <task-b> <task-a>

# The phase milestone waits for every child task.
bd dep add <milestone-id> <task-a>
bd dep add <milestone-id> <task-b>

# Every phase-2 task is blocked when it consumes the completed phase-1 outcome.
bd dep add <phase-2-task> <phase-1-milestone>

# The next phase milestone also cannot complete before the prior checkpoint.
bd dep add <phase-2-milestone> <phase-1-milestone>
```

Do not add an edge for listing order. If two otherwise independent tasks touch the same file, serialize them and annotate the reason:

```bash
bd dep add <later-task> <earlier-task>
bd update <later-task> --append-notes "Dependency on <earlier-task> is file-overlap serialization for <path>, not data flow."
```

If `--append-notes` is unavailable, read existing notes with `bd show` before using the replacing `--notes` flag.

## Verify

```bash
bd show <epic-id>
bd show <phase-milestone-id>
bd ready
bd blocked
```

A healthy graph exposes more than one ready task whenever independent work exists.
