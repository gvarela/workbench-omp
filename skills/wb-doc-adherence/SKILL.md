---
name: wb-doc-adherence
description: Requires fresh full-text evidence before claiming what a Workbench plan document says.
globs: ["docs/plans/**"]
---

# Document adherence

A compaction summary or remembered paraphrase is not evidence of current plan contents. It may omit caveats, merge sections, or predate edits.

## Iron law

```text
NO ASSERTION ABOUT PLAN CONTENT WITHOUT THE FULL READ TEXT VISIBLE
```

Before stating what `research.md`, `design.md`, `tasks.md`, or a `thoughts/` document says:

1. Identify the exact document supporting the claim.
2. Check whether its full read text is visible in the current working context, rather than only a summary or prior-session memory.
3. If not, read the complete document now. Do not use a narrow range for a document whose meaning or status you are about to summarize.
4. Make the claim with a `file:line` citation.

A read before compaction does not count after compaction. Authorship does not count as a current read. Check Beads and git state before proposing work that may already be complete.

This gate does not apply when the exact text was supplied directly by the user or when the claim is unrelated to a document under `docs/plans/**`.

The lifecycle extension provides the deterministic re-anchor signal after compaction. This skill governs the judgment boundary between lifecycle events: if the full text is not visible, read it before asserting it.
