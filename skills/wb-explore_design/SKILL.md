---
name: wb-explore_design
description: Facilitates architecture trade-off exploration, requires explicit human approval, and records the outcome in thoughts and Decide issues.
---

# Explore design directions

This is a judgment-heavy discussion stage between research and formal design. Use the session's strongest configured planning capability. If the active model is not the configured slow or high-reasoning choice, warn the user once without blocking. In the same warning, when an `advisor` role is configured and the advisor is off, suggest `/advisor on` for this stage: a cross-family second model critiques each turn, and `wb-oracle` remains available for a deeper one-off opinion. Do not toggle it yourself.

This workflow produces possibilities, not implementation plans. It may write `thoughts/` records and Beads `Decide:` issues. It must never write or seed `design.md`, implementation steps, task phases, or code.

Argument: project directory, followed optionally by the decision focus.

## 1. Entry gate

Require `<project-directory>/research.md` with `status: complete`. If missing or incomplete, stop and direct the user to `/wb:create_research`. Do not explore from assumptions.

Run `bd info`. If Beads is unavailable, report the standard response from `skill://wb-reference/beads-not-initialized.md` once, then continue: the exploration and its thoughts document are still written, every `bd` step below is skipped, and the `Decide:` record must be created and closed once Beads works. Do not report the decision as recorded until it is.

Read in full:

- `research.md`;
- every existing document under `thoughts/`;
- `design.md` when present;
- every file directly named by the user.

If `design.md` is beyond `draft`, surface that the decision may already be formalized before proceeding.

With Beads available, read all open planning issues with `bd list -n 0 --status=open`. Count only titles beginning `Q:` or `Decide:`. Surface relevant open questions. Reuse an open `Decide:` issue for the same decision rather than creating a duplicate. Never use `bd q`: current Beads treats it as quick-create, not a read query.

## 2. Frame and persist the decision space

Name each actual decision axis, the research-backed constraints, and choices the user already fixed. Cite the relevant research sections; do not present a preferred direction.

For each unresolved axis without an existing issue, create an open planning issue:

```bash
bd create "Decide: <cold-readable decision axis>" --type=task --priority=1 -d "Why this decision is open: <research-backed context>. Constraints: <current facts>. Exploration record: pending framing confirmation."
```

Record each issue id. Then use `ask` to request explicit framing confirmation, with distinct options to confirm or revise. If the response is not confirmation, stop after reporting the open `Decide:` ids (or, without Beads, the unrecorded axes). Do not create a thoughts document and do not touch `design.md`.

## 3. Create the exploration record

After framing confirmation, read `skill://wb-explore_design/templates.md` in full. Create `<project-directory>/thoughts/YYYY-MM-DD-<topic>.md` from the thoughts template with every token resolved. Capture the confirmed axes, constraints, fixed choices, and relevant `Decide:` ids.

Update the record continuously after each material exchange. Never reconstruct the discussion from memory at the end.

## 4. Diverge

Draft two to four genuinely different architectures or philosophies. Variants of the same architectural slot are one direction. Steelman each evenly with:

- a short name and thesis;
- decision-level approach;
- strengths and weaknesses;
- main risk and reversibility;
- codebase precedent when research documented one.

No code, file-change list, procedure, recommendation, or task breakdown. Present all directions together, update the thoughts file, then wait for user reaction.

## 5. Discuss

Pressure-test the directions against the user's priorities and concrete scenarios. Reframe explicitly when reactions change the decision space. Hybrids are valid. Capture reactions, discarded branches, and emerging hybrids in order.

Do not advance without another user response. Enthusiasm, silence, or a leading question is not approval.

## 6. Convergence checkpoint

When discussion stabilizes, present the proposed direction, rationale from the discussion, accepted trade-offs, and unchosen directions. Use `ask` for an explicit choice between approval and continued discussion.

Only a clear approval may proceed. If not approved, return to divergence or discussion. If the session ends without convergence, finalize the thoughts synthesis as unconverged, leave the `Decide:` issues open, and report how to resume.

## 7. Record an approved decision

Complete both durable records:

1. Finalize the thoughts `## Synthesis` with chosen direction, rationale, rejected directions and reasons, and deferred design questions.
2. Close each resolved `Decide:` issue using the exact cold-readable shape from `skill://wb-explore_design/templates.md`. The close reason must include the chosen direction, rationale, rejected directions, and repo-relative thoughts path.

Run `bd list -n 0 --status=closed` and verify each expected title begins with `Decide:` and is queryable. Read the final thoughts file completely. Do not claim completion if either record is missing. If any `bd` command fails, run `bd info`, report the exact error, fix the cause, and retry; without Beads, finalize the thoughts synthesis, state which `Decide:` records remain to be created and closed, and report the stage as incomplete.

## Result

Report the closed issue id and title, chosen direction, thoughts path, directions considered, deferred items, and `/wb:create_design <project-directory>`. The records must contain enough context for that command to run in a fresh session. Without Beads, report the thoughts path, the pending `Decide:` record shape, and that `/wb:create_design` will not find a decision record until it exists.
