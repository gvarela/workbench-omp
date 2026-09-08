# Sequential execution templates

## Modified Files section

Maintain the phase's `### Modified Files (Phase [N])` block in `tasks.md` after each closed task. Replace the `- (none yet)` marker with the first real entry; never duplicate the block for a phase.

````markdown
### Modified Files (Phase [N])

#### Code Files
- `[path]` - [what changed]

#### Test Files
- `[path]` - [behavior the test covers]

**Quick test commands:**

```bash
# Run only this phase's tests
[exact focused command covering the listed test files]
```
````

## Implementation Notes entries

Append under the existing `## Implementation Notes` heading in `tasks.md`, replacing the `- (none yet)` marker with the first entry. Carry the evidence text itself.

Task entry, recorded when a task exposes a discovery, deviation, or follow-up a later task or session would otherwise miss:

```markdown
- [YYYY-MM-DD] Completed [task-id]: [discovery or deviation]. Evidence: [file:line, command and result]. Follow-up: [none, or the issue id filed]
```

Phase entry, recorded after the milestone closes:

```markdown
- [YYYY-MM-DD] Phase [N] complete: [key learnings and deviations from the plan, with evidence]
```

## Manual checkpoint

```text
Phase [N] automated gate passed.

Closed task issues:
- [task-id]: [verified behavior]

Fresh automated evidence:
- `[exact command]` — [exit status and relevant result]

Manual checks from the plan:
1. [check]

Human checkpoint: phase milestone `[milestone-id]` remains open and no later-phase work starts; awaiting your explicit confirmation of every manual check above.
```

## Phase completion

```text
Phase [N] complete.

Evidence:
- Task issues: [closed ids]
- Automated commands: [commands and observed results]
- Manual verification: explicitly confirmed by the user
- Phase milestone: [id], closed
- Beads state: [committed in git mode | local, stealth mode]

Next ready work: [ids or none]
Next command: `/wb:update_status [project-directory]`
```

## Blocked task

```text
Task [id] remains open/in progress.

Problem: [observed failure or plan mismatch]
Evidence: [command, result, or exact source conflict]
Required decision or prerequisite: [specific unblock condition]
Phase milestone [id] remains open.

Human checkpoint: the phase is blocked on this task; awaiting your decision before any further implementation.
```
