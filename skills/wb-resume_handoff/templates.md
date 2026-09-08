# Handoff resumption report

```text
# Handoff Resumption

Handoff: <path>
Recorded: <timestamp>
Currency: <CURRENT | STALE | INVALID>

## Git comparison

- Recorded: <branch> at <full commit>
- Current: <branch> at <full commit>
- Working tree: <clean or exact summary>
- Delta: <observed difference or none>

## Beads comparison

- Epic: <id; recorded -> current status>
- Active phase: <id; recorded -> current status>
- In progress: <current mapped ids>
- Ready: <current mapped ids>
- Blocked: <current blockers>
- Document drift: <exact mismatch or none>

## Context restored

- Still valid: <decision, discovery, or constraint with current evidence>
- Superseded: <handoff claim -> current evidence, or none>
- Unverified: <claim requiring research, or none>
- Failed attempts to avoid: <attempt and unchanged failure condition, or none>

## Continuation point

- Issue: <dependency-ready id and title, or none>
- Start at: <path:line>
- Acceptance: <observable contract>
- Verification: <focused command>
- Watch points: <relevant gotchas and blockers>

Next: <one exact command>
```

When current HEAD differs, place this line immediately after `Currency`:

```text
Warning: recorded HEAD <old> differs from current HEAD <new>; current source and Beads state take precedence.
```
