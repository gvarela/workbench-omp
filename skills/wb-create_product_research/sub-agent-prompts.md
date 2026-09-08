# Product research agent prompts

## Mandatory research batch

Fill every token and issue one `task` call containing all three items.

```json
{
  "context": "# Goal\nDocument {{research_question}} for product management using current-code evidence.\n\n# Constraints\nRead-only. Describe what the software does today, not what it should do. No critique, recommendations, or file writes. Every claim needs path:line evidence.\n\n# Contract\nReturn compact observed facts, distinguish user-visible behavior from implementation evidence, and identify unanswered factual questions. The coordinator alone writes product-research.md.",
  "tasks": [
    {
      "name": "LocateProductSurface",
      "agent": "wb-codebase-locator",
      "task": "# Target\nLocate source, UI, routes, APIs, configuration, tests, and docs relevant to {{product_area}} in {{scope}}.\n\n# Change\nDo not change files. Map product-facing entry points and their supporting components.\n\n# Acceptance\nReturn grouped paths and exact path:line references with factual roles; no critique or recommendations."
    },
    {
      "name": "AnalyzeProductBehavior",
      "agent": "wb-product-analyzer",
      "task": "# Target\nTrace current user-visible behavior for {{product_area}}, starting at {{known_surfaces}}.\n\n# Change\nDo not change files. Trace happy paths, error outcomes, user inputs and outputs, persistence, configuration, and integrations.\n\n# Acceptance\nReturn PM-readable current behavior with path:line evidence for every claim; no inferred behavior, critique, or recommendations."
    },
    {
      "name": "FindProductPatterns",
      "agent": "wb-pattern-finder",
      "task": "# Target\nFind existing engineering and testing patterns supporting {{product_area}} in {{pattern_scope}}.\n\n# Change\nDo not change files. Identify organization, naming, integration, configuration, and test conventions at a product-relevant level.\n\n# Acceptance\nReturn observed patterns with multiple exact path:line examples when scope words imply repetition; no critique or recommendations."
    }
  ]
}
```

Wait for all jobs, then read every complete `agent://<id>` result before synthesis.

## Validation task

After writing the document, issue a separate task call:

```json
{
  "context": "# Goal\nValidate {{project_directory}}/product-research.md against the current checkout.\n\n# Constraints\nRead-only fact-checking. Document what exists; do not recommend product or code changes and do not edit files.\n\n# Contract\nCheck every claim id, path, line range, snippet, behavior, and pattern. Return the validator's required pass, pass-with-warnings, or fail report with exact evidence.",
  "tasks": [
    {
      "name": "ValidateProductResearch",
      "agent": "wb-research-validator",
      "task": "# Target\nValidate {{project_directory}}/product-research.md in full.\n\n# Change\nDo not change files. Resolve every appendix citation and trace every user-visible claim to current source.\n\n# Acceptance\nReturn the complete research-validation report; every failure names the claim and current evidence, with no recommendations beyond document corrections."
    }
  ]
}
```

Wait for the validation job and read its full `agent://<id>` result. A preview is not the result.
