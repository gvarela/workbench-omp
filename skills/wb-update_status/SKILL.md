---
name: wb-update_status
description: Reconciles Workbench document status and task progress fields from complete documents and authoritative Beads state after explicit approval.
---

# Update project status

Argument: project directory under `docs/plans/`.

This is the sole Workbench writer of the `tasks.md` progress fields `status`, `current_phase`, `total_tasks`, and `completed_tasks`; other skills and generated checkpoints point here instead of hand-editing them. It also reconciles research and design `status` from document content and Beads state, although the research and design workflows write their own completion values. Beads is the sole authority for task and milestone execution state.

## 1. Read all evidence

If the argument is missing, ask for it and stop. Read `research.md`, `design.md`, and `tasks.md` completely. Read relevant closed `Decide:` records, failed or open `Validate:` records, and the latest handoff when present.

Run `bd info`, `bd stats`, and `bd list --all -n 0 --json` to obtain every issue including closed issues. Never use `bd q`: current Beads treats it as quick-create, not a read query. Extract the epic, phase, and task ids from task frontmatter; run `bd show <id> --json` for every mapped id. Run `bd blocked` to identify current blockers. If a mapped id is missing or unreadable, report the inconsistency and stop without edits.

Read `skill://wb-update_status/reference.md` and `skill://wb-update_status/templates.md` in full.

## 2. Derive, never guess

Derive in this order:

1. Count only unique ids in `beads_tasks`; derive `total_tasks`, `completed_tasks`, `current_phase`, and task `status` from their live Beads states and the mapped phase states.
2. Derive design `status` from the task status just computed: `not-started` requires `ready`, `in-progress` requires `implementing`, and `complete` requires `complete`, provided the research, approval, and blocking-decision preconditions in the reference hold.
3. Derive research `status` from its present content and validation result.

The atomic proposal must never leave design at `ready` while tasks are `in-progress` or `complete`. Report mapped progress explicitly as `<completed>/<total>`.

Ignore markdown checkboxes and prose claims of completion. Do not mutate Beads to make it match markdown. In particular, never close an issue because a document says complete; a phase milestone closes only through its human checkpoint in the implementation workflow. Report such disagreement and keep Beads authoritative.

Obtain current date, Git commit, and branch. Do not stage, commit, or push the documents or unrelated repository changes; the only commit this workflow makes is the `.beads/` persistence in §5. Determine Beads mode from the extension session message, or fall back to `git check-ignore -q .beads/` (exit 0 is stealth, otherwise git); do not read a mode environment variable.

## 3. Present one atomic update plan

Show current and proposed values for every field that would change, the evidence for each transition, mapped task counts, active phase, blockers, Beads statuses, and shared metadata. Include unchanged statuses when they constrain another transition.

Backward transitions require an explicit reason and explicit user approval. Invalid forward transitions are refused using the reference catalog.

Ask the user to approve the complete update plan. Do not edit before approval. An earlier generic request to “update status” is not approval of a plan the user has not seen.

## 4. Apply after explicit approval

After approval, use one coordinated edit across all affected documents. Change only evidence-backed frontmatter fields and the existing progress overview values described by the template. Preserve stable creation metadata and all body content. Use one date, commit, and branch across files changed in the transaction.

Do not add implementation notes merely to record the synchronization. Do not alter issues.

## 5. Verify and report

Read every changed frontmatter block and progress overview. Recheck:

- allowed values and ordering;
- identical transaction metadata;
- counts against mapped Beads tasks;
- active phase against milestone and task state;
- no unapproved backward transition;
- no Beads mutation.

Report old and new values, progress, evidence, and the next valid Workbench command. If verification fails, name the mismatch instead of claiming success.

Then persist Beads state. Beads auto-flushes `.beads/issues.jsonl` after mutations, so in stealth mode there is nothing to do. In git mode:

```bash
if git diff --quiet .beads/ 2>/dev/null; then
  echo "No beads changes to commit"
else
  git add .beads/
  git commit -m "Sync beads state after status update"
fi
```
