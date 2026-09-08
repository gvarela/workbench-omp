---
name: wb-status-sync
description: Performs a read-only Beads and document drift check at phase boundaries or session completion.
---

# Status synchronization check

Use this skill for an interactive deep check when a phase finishes, implementation work is wrapping up, or the user asks whether tracking is synchronized. The Phase 5 lifecycle extension supplies the deterministic session-shutdown reminder.

## Inspect current state

Run read-only commands:

```bash
bd stats
bd ready
bd list -n 0 --status=in_progress
```

Compare that state with the active project's `tasks.md` frontmatter and phase sections.

Report:

- Completed work whose Beads issue remains open.
- A phase whose child tasks are all closed but whose milestone remains open.
- In-progress issues that no longer match observed work.
- `completed_tasks` or `current_phase` frontmatter that differs from Beads.
- Git-mode `.beads/` changes that have not been included in the current commit boundary.
- A configured Dolt remote that still needs an explicit `bd dolt push`.

When frontmatter differs, direct the user to `/wb:update_status <project-dir>`. Do not update documents from this skill; `wb-update_status` is the sole writer of the `tasks.md` progress fields.

Do not claim or close issues automatically. Do not remind repeatedly for the same state, interrupt mid-phase work, or infer completion from markdown checkboxes. Beads remains authoritative.
