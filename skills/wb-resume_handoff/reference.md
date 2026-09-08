# Handoff resumption reference

## Required frontmatter

A durable handoff requires non-empty `created`, `type: handoff`, `project`, `phase`, `handoff_reason`, `git_commit`, `git_branch`, `repository`, and `beads_epic`. It also requires `beads_active_phase`, `beads_in_progress`, `beads_ready`, and `beads_blocked`; these may be null or empty lists where appropriate.

## Missing file

Report the exact unresolved path. Search only the supplied project directory or `docs/plans/**/handoff-*.md` when enough context exists to do so. List candidates without choosing one silently.

## Invalid format

List each missing field or section. Do not infer critical state from prose, mutate anything, or continue implementation from an invalid handoff.

## Currency rules

- Current HEAD differs from `git_commit`: stale warning, both full commits, and current changed-path evidence.
- Current branch differs: stale warning; never checkout automatically.
- A recorded issue has a different status: current Beads status supersedes the snapshot.
- A recorded ready issue is blocked, closed, missing, or no longer returned by `bd ready`: do not recommend it.
- A cited file or line no longer exists: mark that learning unverified until re-researched.
- Working-tree differences not listed in the handoff: call them post-handoff or previously omitted changes; do not attribute an author.

Before the report, the only mutation is the `git pull` in step 2. No checkout, reset, stash, commit, push, issue close, or document status edit is part of resumption; reclaiming a released issue happens only in step 5 under its stated conditions.

## Next-command precedence

1. Missing or invalid required state: repair or `/wb:validate_project`.
2. Document progress disagrees with valid Beads mapping: `/wb:update_status`.
3. Blocking design or research issue: its owning research/design workflow.
4. Ready mapped implementation work: `/wb:implement_tasks` or `/wb:implement_coordinated`.
5. No ready work and unresolved blockers: report blockers; do not fabricate a task.
