---
name: wb-create_design
description: Writes formal WHAT-and-WHY design decisions from completed research and approved exploration records, without implementation planning.
---

# Create formal design

Design records what to build and why. Never include implementation sequence, code instructions, file modification lists, task phases, or test-writing steps; those belong in `/wb:create_tasks`.

Argument: project directory, followed optionally by user constraints or an already approved direction.

## 1. Read prerequisites

Require `research.md` with `status: complete`. Stop and direct the user to `/wb:create_research` when it is missing or incomplete. A `validation_status: failed` research document also blocks design.

Read in full:

- `research.md`;
- the existing `design.md` when present;
- every directly mentioned file.

Run `bd info`, then read all open `Q:` planning issues using `bd list -n 0 --status=open`; count only titles beginning with that prefix. Never use `bd q`: current Beads treats it as quick-create, not a read query. If a question blocks an architectural decision, stop for resolution rather than hiding it as an assumption.

Read all closed issues using `bd list -n 0 --status=closed`. For every project-relevant title beginning `Decide:`:

1. run `bd show <id>`;
2. read the close reason, notes, and amendments fully;
3. read every referenced `thoughts/` document fully.

A relevant closed decision is authoritative input. Do not generate competing options unless the user explicitly reopens exploration.

## 2. Verify current constraints in parallel

Read `skill://wb-create_design/sub-agent-prompts.md` in full. Then call `task` exactly once with one batch containing all three read-only verification items: pattern verification, integration analysis, and risk precedent search. Use the exact `agent` values in the prompt templates, including the repeated pattern-finder agent. Record every returned id, wait for every job, then read each complete `agent://<id>` result.

This is a mandatory pre-write barrier. Do not define the design problem, present formalization, read the output template, or edit `design.md` until the one task batch has completed and all three results have been consumed. If the batch cannot run, stop and report the blocker; never replace it with coordinator-only inspection.

Every item documents the existing codebase only, cites exact current lines, writes no files, and makes no recommendations. Reconcile any conflict against source before design synthesis.

## 3. Define the design problem

State the problem, why it matters now, outcomes if left unsolved, measurable success, and research-backed technical and business constraints. Separate observed constraints from user requirements.

## 4. Establish the approved direction

If a relevant closed `Decide:` record exists, present its chosen direction, rationale, and thoughts paths and ask the user to confirm formalization. If the user wants to revisit it, stop and direct them to `/wb:explore_design`; do not regenerate options here.

Without a closed record, present two or three genuinely different design-level options with benefits, costs, risks, and observed precedent. Use `ask` to obtain explicit selection. Never infer approval. After selection, create and close a `Decide:` issue whose description captures the options and whose close reason captures the chosen direction, rationale, rejected options, and any thoughts path.

Do not write `design.md` before this decision checkpoint passes.

## 5. Write design.md

Read `skill://wb-create_design/templates.md` in full. Carry existing creation frontmatter over unchanged and write `status: draft`, `last_updated`, `depends_on`, `design_approach`, `decision_records`, and `approval: pending` as the template shows. `/wb:update_status` moves `status` to `ready` after approval; do not write `ready` here.

Keep every `##` section of the template in its order, including `## Rejected alternatives` even when the only rejected alternative is the one the closed `Decide:` record ruled out. Write only:

- problem and measurable success;
- approved architecture, contracts, data model, and integration boundaries;
- rationale and accepted trade-offs;
- in-scope and out-of-scope capabilities;
- risks and mitigations;
- assumptions tied to `Validate:` Beads issues;
- pending decisions tied to open `Decide:` issues;
- rejected alternatives with reasons;
- research, thoughts, and Beads references.

Create a Beads issue for each unresolved assumption (`Validate:`) and pending decision (`Decide:`) using the template's `bd create` commands as written. If Beads is unavailable where an issue is required, follow `skill://wb-reference/beads-not-initialized.md` and do not claim the design is ready.

Before writing, remove every template token and placeholder phrase. Every existing-system claim needs a research or source citation.

## 6. Review and approval gate

Read the complete resulting `design.md` and verify it contains no implementation procedure. Present the design, key decisions, scope, risks, and pending issue count. Ask the user for explicit approval.

- If approved, set `approval: approved` and `approved_at: <UTC timestamp>` without changing `status:`. Tell the user to run `/wb:update_status` before task planning.
- If not approved, keep `approval: pending`, apply only the feedback the user supplied, and repeat review.

Do not proceed to task generation in this workflow.

## Result

Report the design path, selected approach, decision issue ids, key decisions, and pending issues. While `approval: pending`, ask only for design approval and do not recommend task planning. After approval, report `/wb:update_status <project-directory>`; task planning becomes valid only after that synchronization makes the design `ready`.
