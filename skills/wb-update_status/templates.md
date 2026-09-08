# Status synchronization templates

## Update plan

```text
# Proposed Status Reconciliation

Project: <project>
Evidence: <document state and exact mapped Beads counts>

- research.md status: <old> -> <new>; reason: <evidence>
- design.md status: <old> -> <new>; reason: <evidence>
- tasks.md status: <old> -> <new>; reason: <evidence>
- current_phase: <old> -> <new>
- completed_tasks: <old> -> <closed mapped task count>
- total_tasks: <old> -> <unique mapped task count>
- last_updated: <date>
- git_commit: <commit>
- git_branch: <branch>

Beads:
- epic: <id/status>
- phases: <id/status list>
- tasks: <open/in_progress/closed counts>
- blockers: <ids or none>

Approve this complete update plan? <yes/no>
```

List only metadata fields that actually change, but always show all three status values and all three task progress values.

## Frontmatter fields

Update existing keys in place; do not replace unrelated frontmatter.

```yaml
status: <derived-status>
last_updated: <YYYY-MM-DD>
git_commit: <current-commit>
git_branch: <current-branch>
```

For `tasks.md`, also update:

```yaml
current_phase: <derived-phase>
total_tasks: <mapped-task-count>
completed_tasks: <closed-mapped-task-count>
```

If a progress overview already exists, reconcile its displayed counts and percentage to the same values. Do not create narrative implementation notes.

## Completion response

```text
Status reconciliation applied.

- research.md: <old> -> <new>
- design.md: <old> -> <new>
- tasks.md: <old> -> <new>
- Progress: <completed>/<total>; phase <phase>
- Metadata: <date>, <commit>, <branch>
- Beads mutations: none

Next: <valid Workbench command>
```
