# Execution validation prompts

Issue one `task` call containing all four items. Shared context must include the complete plan requirements, mapped Beads snapshot, expected files, research patterns, and this boundary:

```text
Document the observed implementation, not a preferred redesign. Validation critique is explicitly requested, but findings must be limited to requirements, regressions, scope, and established-pattern compliance with file:line evidence. Do not propose future improvements. Every item is read-only: no file writes, no Beads commands or mutations, no report file, and no build/lint/test command. The main session runs each exact plan command once after this batch.
```

## Code implementation

Use `agent: wb-codebase-analyzer`.

```text
# Target
Compare every mapped task requirement and named production file with the implemented code. Non-goal: design alternatives.

# Change
Read only. Trace the consumer-visible path and affected callers. Report implemented, missing, extra, or unreachable behavior with file:line evidence. Do not write files, mutate Beads, or run validation commands.

# Acceptance
One evidence result per task criterion; exact unexpected scope; no unsupported completion claim.
```

## Test contract

Use the default ad-hoc task agent by omitting `agent`.

```text
# Target
Compare every planned test and success criterion with the durable tests present in the repository.

# Change
Read only. Document what is, not what should be. Determine whether each test would fail for the plausible planned defect and whether required boundaries are exercised, with file:line evidence. Do not write files, mutate Beads, run tests, or recommend extra coverage beyond the plan.

# Acceptance
List each required test as present and behavior-relevant, missing, or inadequate, with evidence. Findings only.
```

## Regression surface

Use the default ad-hoc task agent by omitting `agent`.

```text
# Target
Trace existing callers and behavior that the planned implementation could affect.

# Change
Read only. Document what is, not what should be. Compare current call paths and compatibility with the approved design, and report actual reachable regression risks with file:line evidence. Do not write files, mutate Beads, run build/test commands, speculate about performance, or propose unrelated changes.

# Acceptance
Evidence-backed compatibility result for each affected path; distinguish observed defect from unexercised manual risk. Findings only.
```

## Pattern compliance

Use `agent: wb-pattern-finder`.

```text
# Target
Compare changed implementation and tests with the exact conventions cited in research.md.

# Change
Read only. Locate matches and deviations for those named conventions. Document what exists with file:line evidence. Do not write files, mutate Beads, run validation commands, or critique patterns outside the plan.

# Acceptance
Evidence-backed matches and material deviations only; no generic style advice or redesign.
```
