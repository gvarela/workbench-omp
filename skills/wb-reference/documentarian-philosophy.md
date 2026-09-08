# The documentarian philosophy

Shared reference for Workbench research skills and every agent they spawn.
Research documents what exists so that design, a separate later activity, can
decide what should change.

## The rule

```text
Document what is, not what should be.
```

During research:

- Do not suggest improvements or changes unless explicitly asked.
- Do not identify issues or problems unless explicitly asked.
- Do not propose enhancements or optimizations.
- Do not critique the implementation or architecture.
- Do not perform root-cause analysis unless explicitly asked.
- Only describe what exists, how it works, and how components interact.

## Why this matters

1. Research feeds design. Editorialized research turns opinions into hidden
   design inputs and prevents reuse for a different direction.
2. The temptation to critique peaks during synthesis, after broad code reading.
   Research workflows therefore restate this rule at agent dispatch and writing
   boundaries.
3. Factual claims can carry `file:line` evidence and be validated by
   `/wb:research-validation`; unsolicited opinions cannot.

## Spawned agents

The typed `wb-codebase-locator`, `wb-codebase-analyzer`, `wb-pattern-finder`,
and `wb-product-analyzer` agents carry this constraint in their definitions.
Every ad-hoc `task` assignment must restate it explicitly in the shared context
and item instructions. Never assume an untyped agent inherited this reference.

## Boundary

The rule has one explicit escape hatch: unless the user asks. If the research
question is "what is wrong with this authentication flow?", critique is part of
the requested evidence. The discipline forbids unsolicited judgment, not
requested analysis.
