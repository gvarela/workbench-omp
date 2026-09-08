---
name: wb-create_handoff
description: Writes a durable, reviewable Workbench handoff file containing current documents, Git state, Beads state, in-flight reasoning, blockers, and exact next work.
---

# Create a durable handoff

Argument: project directory under `docs/plans/`, followed optionally by a reason.

This command is distinct from OMP's native `/handoff`: `/wb:create_handoff` writes a durable project artifact that a fresh session can inspect and re-anchor against. It does not transfer the current process or create a hidden session summary.

## 1. Gather complete current state

If the project directory is missing, ask for it and stop. Read `research.md`, `design.md`, and `tasks.md` completely. Read the project README, the latest prior handoff, current thoughts records, and mockup log when present. Review the current conversation and tool evidence for in-flight reasoning, exact changes, verification already run, failed attempts, and context not captured by formal documents.

Run `bd info`, `bd stats`, `bd list --all -n 0 --json`, `bd list --status=in_progress --json`, `bd blocked --json`, and `bd ready --json`. Never use `bd q`: current Beads treats it as quick-create, not a read query. Run `bd show <id> --json` for the mapped epic, phases, tasks currently in progress, blocked tasks, and immediate ready candidates. Beads, not markdown checkboxes, is authoritative.

Determine Beads mode from the extension session message or `git check-ignore -q .beads/` (exit 0 is stealth, otherwise git); do not use an environment variable. Beads auto-flushes `.beads/issues.jsonl`, so there is nothing to run for Beads itself. In git mode, committing that state is part of the handoff protocol:

```bash
git add .beads/
git commit -m "Sync beads state before handoff"
```

Skip the commit when `git diff --quiet .beads/` and `git status --porcelain .beads/` show no change. In stealth mode, do not stage `.beads/`. Stage or commit nothing else; do not push, pull, reset, checkout, or mutate issues for a handoff.

Then run non-mutating Git inspection: current HEAD, branch, concise working-tree status, staged diff summary, and unstaged diff summary.

If plan progress fields disagree with Beads, record both and direct the next session to `/wb:update_status`; never conceal the drift or update status here.

## 2. Select only load-bearing context

Record:

- current phase and mapped issue statuses;
- last completed action and current partial work;
- exact uncommitted files and why they are changed;
- verified command results from this session, clearly distinguished from unverified claims;
- project-specific discoveries not already obvious from the formal documents;
- durable memories: run `bd memories <project>`, list the entries this session added with `bd remember`, keep the ones that still qualify (constraints and conventions), and `bd forget <key>` the ones that were task-specific;
- decisions, deviations, blockers, attempts, and why failed attempts failed;
- immediate next ready task with issue id, exact starting locations, acceptance, and verification;
- relevant gotchas and scope boundaries.

Use source references instead of large code blocks. Do not restate completed history, generic advice, guesses, or model/session trivia. Never claim tests pass unless this session has evidence.

## 3. Write and verify the artifact

Read `skill://wb-create_handoff/templates.md` in full. Create a new file at `<project-directory>/handoff-<YYYY-MM-DD-HH-MM>.md`. Never overwrite an earlier handoff.

Fill every field, including `git_commit`, `git_branch`, `beads_epic`, `beads_active_phase`, `beads_in_progress`, `beads_ready`, and `beads_blocked`. Use empty YAML lists and `None observed` where applicable; leave no template token or placeholder.

Read the completed file fully. Verify every referenced file exists, each recorded Beads id was queried, Git metadata equals the captured state, the next action is executable, and no unsupported verification claim appears.

Report the saved path, progress, blocker count, uncommitted-state summary, and exact resumption command: `/wb:resume_handoff <handoff-file>`.
