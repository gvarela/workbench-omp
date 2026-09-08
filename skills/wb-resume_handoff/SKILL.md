---
name: wb-resume_handoff
description: Re-anchors a fresh session from a durable Workbench handoff by comparing it with current documents, source, Git, and Beads state before recommending continuation.
---

# Resume from a durable handoff

Argument: path to a `handoff-*.md` file written by `/wb:create_handoff`.

This workflow restores context from a file; it is distinct from OMP's native `/handoff`. The handoff is historical evidence, not authority over current source or Beads.

## 1. Read and validate the handoff

If the path is missing, ask for it and stop. Read `skill://wb-resume_handoff/reference.md` in full. Read the handoff file completely, then require its handoff frontmatter and the sections `Resume contract`, `Current state`, `Beads snapshot`, `Working tree`, and `Next actions`. On a missing or invalid file, use the reference response and stop.

Extract project directory, recorded HEAD and branch, mapped issue ids, changed paths, blockers, discoveries, and next action. Do not act on them yet.

## 2. Re-anchor on current durable state

Read `research.md`, `design.md`, and `tasks.md` completely from the extracted project directory. Read every handoff-linked thoughts record, mockup log, and directly cited source file. Revalidate source references that the next action depends on. Never rely on a previous session summary in place of these reads.

Run `git pull` to bring in the latest commits (and, in git mode, the Beads state committed by the handoff; Beads imports `issues.jsonl` after the pull). If there is no upstream or the pull fails, report that and continue with local state. Then inspect current Git HEAD, branch, concise status, staged diff summary, and unstaged diff summary. Do not checkout, reset, stash, stage, or commit.

Run `bd info`, `bd stats`, `bd list --all -n 0 --json`, `bd list --status=in_progress --json`, `bd blocked --json`, and `bd ready --json`. Never use `bd q`: current Beads treats it as quick-create, not a read query. Run `bd show <id> --json` for every id in handoff tracking fields and every mapped id needed for the next phase. Compare with the handoff's `beads_in_progress`: in git mode it matches unless work happened since the handoff; in stealth mode it may differ because Beads is machine-local. Do not claim or mutate an issue before the report in §4.

## 3. Compare handoff with current state

Treat the handoff as stale when current HEAD differs, referenced files changed or disappeared, mapped issue status changed, a recorded ready task is no longer ready, or document progress moved. A moved HEAD always produces a visible warning with both commits and the observed delta; it does not automatically invalidate still-current discoveries.

Current source and Beads win every conflict. Distinguish:

- still-valid context;
- superseded context and exact current evidence;
- unverified claims;
- plan/Beads drift requiring `/wb:update_status`;
- blockers that still apply.

Never repeat a failed attempt unless current evidence changes its failure condition.

## 4. Report the restored context

Read `skill://wb-resume_handoff/templates.md` in full. Render the report with currency verdict, Git and Beads deltas, context retained or superseded, blocker state, and the immediate dependency-ready issue. State exact start locations, acceptance, and verification. Name only verification commands that were actually run or are present in the current task document; do not invent alternate `bd` syntax.

End with one exact command using the project directory, never an individual document path: `/wb:update_status <project-directory>`, `/wb:validate_project <project-directory>`, `/wb:implement_tasks <project-directory>`, or `/wb:implement_coordinated <project-directory>`, selected from observed current state.

Before sending the report, verify that it:

- begins with `# Handoff Resumption`;
- includes `Currency: STALE` when any stale condition in step 3 holds;
- places the moved-HEAD warning directly after currency and names both commits;
- includes Git comparison, Beads comparison, restored context, and continuation point sections;
- ends with the selected exact command including the project directory.

A report missing any required item is incomplete; correct it before responding.

## 5. Restore tracking state and continue

After the report, unless the user asked only for the report or the plan/Beads drift requires `/wb:update_status` first:

1. For each handoff `beads_in_progress` id, act on its live state: still `in_progress` means the prior session's claim holds; closed by another session means the next `bd ready --json` candidate is the continuation point; released (`open` and unblocked) means reclaim it with `bd update <id> --claim --json` when continuing inline through `/wb:implement_tasks` (whose own claim is idempotent). `/wb:implement_coordinated` claims before each spawn, so leave released issues open for it. Never claim a blocked issue.
2. Continue from the handoff's `Next actions` through the selected execution command, which performs the work and every further claim.
3. While continuing, apply the handoff's patterns and decisions, do not re-solve problems it already solved or repeat its failed attempts, watch for its recorded gotchas, and run the verification commands it names.
4. Record new discoveries in Beads notes and `## Implementation Notes` for the next handoff; progress fields and markdown checkboxes stay untouched, and `/wb:update_status` reconciles documents.
