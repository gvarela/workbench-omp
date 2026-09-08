# Formal design verification batch

Fill every token and make one `task` call containing all three items.

```json
{
  "context": "# Goal\nVerify current-code constraints that bound design for {{project_directory}} and {{design_problem}}.\n\n# Constraints\nRead-only current-state research. Document what exists, not what should exist. No critique, recommendations, anti-pattern judgments, or file writes. Cite every claim as path:line or path:start-end.\n\n# Contract\nReturn compact factual evidence for the coordinator. Do not choose a design direction or write design.md.",
  "tasks": [
    {
      "name": "VerifyDesignPatterns",
      "agent": "wb-pattern-finder",
      "task": "# Target\nVerify patterns, conventions, and analogous features relevant to {{design_problem}}, starting from {{research_references}}.\n\n# Change\nDo not change files. Find multiple examples where a pattern is described as common.\n\n# Acceptance\nReturn exact path:line evidence and factual scope; no quality judgment or design recommendation."
    },
    {
      "name": "AnalyzeIntegrationBoundaries",
      "agent": "wb-codebase-analyzer",
      "task": "# Target\nAnalyze current integration points, contracts, dependencies, and data flow relevant to {{design_problem}}.\n\n# Change\nDo not change files. Trace the existing boundary behavior from {{known_entry_points}}.\n\n# Acceptance\nReturn exact path:line evidence, required current contracts, and unresolved factual gaps; no recommendation or design selection."
    },
    {
      "name": "FindRiskPrecedents",
      "agent": "wb-pattern-finder",
      "task": "# Target\nFind current or historically documented precedents relevant to the risks in {{design_problem}}.\n\n# Change\nDo not change files. Search source, tests, and repository documentation for analogous behavior and mitigations already present.\n\n# Acceptance\nReturn exact path:line evidence and factual precedent descriptions; do not label code an anti-pattern or recommend a direction."
    }
  ]
}
```

Wait for all jobs to settle and read each complete `agent://<id>` output before synthesis.
