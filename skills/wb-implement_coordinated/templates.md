# Coordinated execution templates

## Wave result

```text
Wave [N]
- Verified and closed: [task ids with commands]
- Awaiting repair or blocked: [task ids with findings]
- Files changed: [paths]
- Newly ready: [mapped task ids]
```

## Modified Files aggregation

Write into `tasks.md` at the phase gate, aggregated from every verified worker's `filesChanged` and `testsChanged`. Replace the phase block's `- (none yet)` markers with real entries; never duplicate the block for a phase.

````markdown
### Modified Files (Phase [N])

#### Code Files
- `[path]` - [what changed, from the verified worker result]

#### Test Files
- `[path]` - [behavior the test covers]

**Quick test commands:**

```bash
# Run only this phase's tests
[exact focused command covering the listed test files]
```
````

## Implementation Notes entries

Append under the existing `## Implementation Notes` heading in `tasks.md`, replacing the `- (none yet)` marker with the first entry. Carry the evidence text itself; `agent://` ids are prunable.

Worker discovery, recorded when a verified result reports something a later task or session would otherwise rediscover:

```markdown
- [YYYY-MM-DD] [task-id] ([tier]): [discovery or deviation]. Evidence: [file:line, command and result]. Follow-up: [none, or the issue id filed]
```

Task split, recorded when an oversized task is sliced before spawning:

```markdown
- [YYYY-MM-DD] Split [original-id] into [slice ids] at [seam]; original closed with reason "split". Slices block milestone [phase-id].
```

Phase entry, recorded after the milestone closes:

```markdown
- [YYYY-MM-DD] Phase [N] complete using coordinated workers:
  - [count] workers spawned in [count] waves; tiers: [id -> profile]
  - [count] fix workers, [count] blocked tasks resolved at checkpoint
  - Key learnings: [aggregated learnings with evidence]
```

## Phase checkpoint

```text
Phase [N] automated gate passed.

Verified workers:
- [task id]: [tier], verifier pass, [command and result]

Fresh phase evidence:
- `[exact command]` — [observed result]

Manual checks:
1. [check]

Human checkpoint: phase milestone `[id]` remains open and no later-phase work starts; awaiting your explicit confirmation of every manual check above.
```

## Blocking checkpoint

```text
Phase [N] is not complete. Milestone `[id]` remains open.

Blocking tasks:
- [task id]: [worker blocker, verifier infrastructure failure, or second verifier failure with evidence]

Design revision:
- [revision id or none]: [failed assumption and verifier evidence]

Closed tasks remain closed. No dependent or later-phase work was started.
Next action: [specific unblock command or design workflow]

Human checkpoint: the phase is blocked on the items above; awaiting your decision before any further worker is spawned.
```

## Phase completion

```text
Phase [N] complete.
- Closed tasks: [ids]
- Worker tiers: [id -> profile]
- Verification: [commands and observed results]
- Manual verification: explicitly confirmed
- Milestone: [id], closed
- Beads state: [committed in git mode | local, stealth mode]

Next ready work: [ids or none]
Next command: `/wb:update_status [project-directory]`
```
