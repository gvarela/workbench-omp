---
name: wb-create_product_research
description: Documents current features, user flows, and user-visible behavior in product language, then validates every claim.
---

# Create product research

Describe what the software currently does for users. Write for product managers: behaviors and journeys first, engineering evidence in an appendix. Do not recommend changes, identify defects, or invent product behavior.

Arguments:

1. Project directory: required.
2. Product research question: required unless existing documents make it unambiguous.

The workflow may run inside an existing Workbench project or stand alone. Create the project directory when absent. Create or update `<project-directory>/product-research.md`; never replace engineering `research.md`.

## 1. Read the inputs

Before delegation, read every file directly named by the user in full. If `product-research.md`, `README.md`, or `research.md` exists in the project directory, read each existing file in full.

When updating an existing product document, carry its `project`, `created`, and other frontmatter fields over unchanged. Completing this workflow sets `status: complete`.

## 2. Frame product areas

Break the question into user-visible capabilities, happy and error paths, user inputs and outputs, configuration, integrations, and adjacent features. Organize by product area rather than source module.

Read `skill://wb-create_product_research/sub-agent-prompts.md` in full and fill every token.

## 3. Run the parallel research batch

Call `task` once with all three mandatory read-only items:

- `wb-codebase-locator`
- `wb-product-analyzer`
- `wb-pattern-finder`

Every item must state that it documents the current system, makes no recommendations, writes no files, and cites every claim. Record all returned ids, wait for every job to settle, then read every full `agent://<id>` result. Do not synthesize from previews or before the complete batch returns.

## 4. Synthesize three layers

Use current source as truth and reconcile conflicts by reading cited code.

1. **Product overview:** capabilities, journeys, behaviors, data, integrations, configuration, and user-visible errors in plain language.
2. **Engineering approach:** factual high-level organization, implementation patterns, and test approach.
3. **Technical appendix:** the exact files and line ranges supporting every claim. Use stable claim ids such as `B1` in product prose and map each id to evidence in the appendix.

Unresolved questions are Beads `Q:` planning issues when Beads is initialized. If a question blocks completion and Beads is unavailable, use `skill://wb-reference/beads-not-initialized.md` and stop before claiming completion.

## 5. Write product-research.md

Read `skill://wb-create_product_research/templates.md` in full. Fill it only with observed behavior. Remove irrelevant sections instead of leaving scaffolding. No unexpanded token, placeholder phrase, generic example, recommendation, or unsupported claim may remain.

Set `status: complete` and, for a new document, `validation_status: not-yet-run`. For a follow-up, append `## Follow-up research — <UTC timestamp>`, update `last_updated` and `last_updated_note`, and preserve earlier findings.

Do not write `status: complete` while a blocking question is unresolved.

## 6. Validate after writing

Spawn one `wb-research-validator` task to validate the written file directly. The prompt must restate the documentarian constraint and require all paths, citations, snippets, behaviors, patterns, and claim-id mappings to be checked. Wait for completion, then read the full `agent://<id>` report.

- `pass`: set `validation_status: passed` and `last_validated`.
- `pass-with-warnings`: set `validation_status: passed_with_warnings`, set `last_validated`, and copy only uncertain items into Validation notes.
- `fail`: re-read the named source, correct unsupported claims, and validate once more. If any failure remains, set `validation_status: failed`, report the exact findings, and do not claim completion.

Updating validation metadata does not change the document's `status:` field.

## Barrier: verify final artifact

Read the complete final file. Confirm every claim id has appendix evidence, cited files and ranges exist, validation metadata matches the validator result, and no placeholder or recommendation remains.

## Result

Report the document path, question, audience, key observed capabilities, validator status and counts, and files examined. Offer `/wb:explore_design` only when the evidence exposes genuinely different architectural approaches; otherwise direct the user to review the document and run `/wb:create_design`.
