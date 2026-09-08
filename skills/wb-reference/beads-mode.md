# Beads modes: stealth and git

Shared reference for Workbench skills. The Phase 5 extension detects mode at
`session_start`, persists it as a namespaced session entry, and injects a short
message naming `stealth` or `git`. Skills trust that message for the session.

When the extension message is unavailable, detect once at the point of need:

```bash
if git check-ignore -q .beads/ 2>/dev/null; then
  beads_mode=stealth
else
  beads_mode=git
fi
```

Do not export a process-wide mode variable and do not re-check after a valid
extension message. OMP does not provide Claude's shell environment-injection
channel.

## Modes

| Property | Stealth mode | Git mode |
| --- | --- | --- |
| `.beads/` in git | Gitignored through `.gitignore` or `.git/info/exclude` | Tracked and committed |
| Initialized by | `bd init --stealth` | `bd init` |
| Persistence | Local machine | Across sessions and machines through git |
| Issue ids in documents | Recorded even though the database is local | Recorded and resolvable wherever state is synchronized |
| Best fit | Repositories where task tracking must not be committed | Full-persistence workflows |

Both modes behave identically within a session. The distinction is what
survives across sessions and machines.

## Persistence mechanics

- Beads auto-commits mutations to its embedded Dolt database and auto-flushes
  `.beads/issues.jsonl`.
- Git hooks installed by `bd init` keep JSONL consistent at commit and push
  boundaries.
- Beads imports `issues.jsonl` changes after git updates it.
- `bd dolt push` and `bd dolt pull` synchronize a configured Dolt remote; they
  are separate from git synchronization.

## Mode-conditional action

In git mode, include Beads state at session-end or phase-boundary commits:

```bash
git add .beads/
git commit -m "Update beads state after <context>"
```

In stealth mode, do not stage `.beads/`; mutations are already persisted
locally.

## Validate configuration

If initialization appears inconsistent and no extension message was supplied,
use the same predicate as detection. Do not test whether `.beads/` is already
tracked because that produces a false negative before the first commit.

A confirmed mismatch means initialization changed or is misconfigured. Report
it and direct the user to rerun `bd init` or `bd init --stealth` deliberately;
do not silently switch modes mid-session.
