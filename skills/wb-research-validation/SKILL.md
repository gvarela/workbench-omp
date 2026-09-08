---
name: wb-research-validation
description: Validates engineering or product research paths, citations, snippets, behavior, and pattern claims against current source.
---

# Validate research

No trust without verification. Check the complete research document against the current checkout; path existence alone never proves a claim.

## 1. Select and read the document

Accept a research file or project directory. In a directory, prefer the file named by the user. If both `research.md` and `product-research.md` exist and the user did not specify one, ask which to validate.

Read the selected document in full. Extract every:

- file or directory path;
- `path:line` and `path:start-end` citation;
- source-attributed snippet;
- behavioral claim;
- pattern or convention claim.

## 2. Run independent validation

Call `task` once with one item whose `agent` field is the exact literal `wb-research-validator`; do not use the generic `task` agent and do not ask another agent to delegate again. The item prompt must name the exact document and restate: read-only fact-checking, document what exists, no recommendations, no file edits. Require the standard report with `pass`, `stale`, `fail`, or `uncertain` per item.

Wait for the job to settle, then read its complete `agent://<id>` result. Do not use the task preview as evidence.

## 3. Confirm material findings

For every reported `stale`, `fail`, or `uncertain` item, read the cited document section and current source yourself. If the validator omits a verifiable claim, check it before reporting. Classify the overall result:

- `pass`: no stale, failed, or materially uncertain claims.
- `pass-with-warnings`: no failed claims; only limited stale or uncertain items.
- `fail`: any missing or contradicted claim, or enough stale evidence to make the document unsafe to rely on.

## 4. Record validation metadata

Update or insert only:

```yaml
validation_status: passed | passed_with_warnings | failed
last_validated: YYYY-MM-DD
```

Never edit the document's `status:` field. Do not silently correct failed research claims. On warnings, update the existing Validation notes section with the uncertain items; on failure, leave the claims intact so the report remains reviewable.

## 5. Report

Return:

```text
Research validation: <document>
Status: PASS | PASS WITH WARNINGS | FAIL
Checked: <date>
Paths: <passed>/<checked>
Citations and snippets: <passed>/<checked>
Behaviors: <verified>/<checked>, <uncertain> uncertain
Patterns: <confirmed>/<checked>
Findings: <stale or failed claims with current evidence, or none>
```

On failure, state whether focused follow-up or full re-research is needed and name `/wb:create_research` or `/wb:create_product_research` as appropriate. Do not change the research content in this workflow.
