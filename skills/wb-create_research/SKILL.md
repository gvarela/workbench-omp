---
name: wb-create_research
description: Researches current codebase behavior with parallel locator, analyzer, and pattern agents, then writes evidence-only research.md.
---

# Create engineering research

Document the codebase as it exists. Do not recommend changes, identify defects, rank options, or infer unobserved behavior unless the user explicitly asks for that analysis.

Arguments:

1. Project directory: required.
2. Research question: required unless the existing project documents state it unambiguously.

Use supplied arguments. Ask only for missing required information.

## 1. Read primary inputs

Before delegation, read in full:

- every file directly named by the user;
- `<project-directory>/research.md`;
- `<project-directory>/README.md` when present.

Confirm the project directory and `research.md` exist. Note the frontmatter `status`; completing this workflow sets it to `complete`.

## 2. Frame the research

Split the question into current-system areas that can be investigated independently. Identify likely entry points, data flow, dependencies, tests, configuration, and similar implementations without making recommendations.

Read `skill://wb-create_research/sub-agent-prompts.md` in full. Fill every token with the project path, research question, and concrete research boundaries.

## 3. Run one parallel research batch

Call `task` exactly once for the mandatory research batch. Its `tasks[]` must contain all three independent items:

- `wb-codebase-locator`
- `wb-codebase-analyzer`
- `wb-pattern-finder`

Additional read-only research items may be included in that same batch when the question has another independent area. Every item must restate the documentarian constraint: facts only, no critique or recommendations, no file writes.

Do not synthesize from task previews. Record every returned job or agent id, wait until all jobs settle, then read every complete result from its `agent://<id>` URI. A failed or missing result is not evidence; retry only that research area or report the gap.

## Barrier: all evidence returned

Do not write `research.md` until every mandatory agent has completed and its full result has been read.

## 4. Synthesize evidence

Prioritize live code over documentation. Reconcile conflicting findings by reading the cited source. Every substantive implementation claim must cite a current `path:line` or `path:start-end` reference. Describe component connections, control and data flow, conventions, tests, and similar implementations only when observed.

Open questions do not belong in `research.md` as speculative prose:

- If Beads is initialized, create one `Q: <question>` planning issue per unresolved question with what it blocks.
- If Beads is not initialized and a question blocks completion, read `skill://wb-reference/beads-not-initialized.md`, report its standard response, and stop before claiming research is complete.
- If there are no unresolved questions, state that explicitly in the document.

## 5. Write research.md

Read `skill://wb-create_research/templates.md` in full. Replace the existing document with the template's frontmatter and structure filled with concrete evidence. Carry `project`, `ticket`, `created`, and any other existing frontmatter fields over unchanged; set `status: complete`, `last_updated`, and an optional quoted `last_updated_note`. Do not write `status: complete` while a blocking question is unresolved.

For follow-up research, do not create another file. Append `## Follow-up research — <UTC timestamp>` with the new evidence, then update `last_updated` and `last_updated_note` without disturbing prior findings.

Before writing, confirm:

- no unexpanded template tokens or placeholder phrases;
- no generic examples or invented claims;
- no recommendation, critique, or proposed design;
- every code citation names an existing file and valid line range.

## Barrier: verify the document

Read the complete resulting `research.md`. Resolve each cited path and line range against the current checkout. Correct stale or unsupported citations. Do not claim completion until the full document passes this check.

## Result

Report the research path, question, key findings with citations, files examined, and citation count. If the findings document genuinely different architectural approaches—different integration points, contracts, or subsystems—offer `/wb:explore_design` before `/wb:create_design`; otherwise direct the user to review the research and run `/wb:create_design`.
