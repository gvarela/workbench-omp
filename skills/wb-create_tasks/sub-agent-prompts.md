# Task-planning analysis batch

Fill every token and issue one `task` call containing all three read-only items.

```json
{
  "context": "# Goal\nMap the implementation surface between {{project_directory}}/research.md and the approved {{project_directory}}/design.md.\n\n# Constraints\nRead-only current-code analysis. No file writes, Beads mutations, new scope, design changes, or recommendations beyond executable planning evidence. Cite every current-state claim as path:line.\n\n# Contract\nReturn concrete evidence to the coordinator. Name dependencies by the output consumed, identify file overlap, and distinguish existing paths from approved new paths.",
  "tasks": [
    {
      "name": "AnalyzeDependencies",
      "agent": "wb-codebase-analyzer",
      "task": "# Target\nAnalyze implementation dependencies and affected files for {{approved_design_scope}}.\n\n# Change\nDo not change files. Map build prerequisites, integration contracts, parallel opportunities, critical path, structural-before-behavior constraints, and file overlap. Classify an edge as data flow only when the dependent consumes a concrete symbol, schema, file, or other artifact introduced by its prerequisite; shared files and general consistency are not data outputs.\n\n# Acceptance\nReturn exact path:line evidence and a graph whose every edge names the output consumed or the exact `file-overlap serialization` reason. Identify tasks that are behaviorally independent but must serialize because their allowed files intersect."
    },
    {
      "name": "AnalyzeTestSurface",
      "agent": "wb-codebase-analyzer",
      "task": "# Target\nAnalyze existing tests and verification commands relevant to {{design_success_criteria}} and {{design_risks}}.\n\n# Change\nDo not change files. Locate frameworks, focused commands, fixtures, observable boundaries, and missing behavior coverage required by the approved design.\n\n# Acceptance\nReturn exact path:line evidence and consumer-observable scenarios; do not add requirements or prescribe implementation architecture."
    },
    {
      "name": "FindImplementationPatterns",
      "agent": "wb-pattern-finder",
      "task": "# Target\nFind analogous implementations, rollout structures, configuration patterns, and test organization for {{change_type}}.\n\n# Change\nDo not change files. Locate current precedents that constrain executable tasks.\n\n# Acceptance\nReturn exact path:line examples and factual pattern scope; no new design choices or code-quality critique."
    }
  ]
}
```

Wait for every job to settle, then read every complete `agent://<id>` result. Never synthesize from previews.
