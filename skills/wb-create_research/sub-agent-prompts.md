# Engineering research agent batch

Fill every `{{token}}`, then issue one `task` call containing all three items. Keep the shared contract in `context`; do not split these into sequential calls.

```json
{
  "context": "# Goal\nAnswer {{research_question}} with current-code evidence for {{project_directory}}.\n\n# Constraints\nRead-only investigation. Document what exists, not what should exist. No critique, recommendations, root-cause speculation, or file writes. Cite every claim as path:line or path:start-end.\n\n# Contract\nReturn a compact evidence report. Distinguish observed facts from unanswered questions. The coordinator alone synthesizes and writes research.md.",
  "tasks": [
    {
      "name": "LocateComponents",
      "agent": "wb-codebase-locator",
      "task": "# Target\nLocate source, test, configuration, and documentation files relevant to {{research_question}}. Focus on {{locator_scope}}.\n\n# Change\nDo not change files. Find entry points, related symbols, and directory boundaries.\n\n# Acceptance\nReturn grouped paths with concise roles and exact path:line references where available; facts only, no critique or recommendations."
    },
    {
      "name": "AnalyzeImplementation",
      "agent": "wb-codebase-analyzer",
      "task": "# Target\nAnalyze how {{research_subject}} currently works, starting from {{known_entry_points}}.\n\n# Change\nDo not change files. Trace entry points, calls, data flow, dependencies, error behavior, and tests.\n\n# Acceptance\nReturn an evidence-backed current-state explanation with exact path:line ranges; identify unanswered factual questions; no critique or recommendations."
    },
    {
      "name": "FindPatterns",
      "agent": "wb-pattern-finder",
      "task": "# Target\nFind conventions and analogous implementations relevant to {{research_subject}} in {{pattern_scope}}.\n\n# Change\nDo not change files. Compare naming, organization, integration, and test patterns already present.\n\n# Acceptance\nReturn concrete examples with exact path:line ranges and a factual description of each observed pattern; no critique or recommendations."
    }
  ]
}
```

After the call returns ids, wait for every job to settle. Then read each `agent://<id>` result in full before synthesis. Never treat an auto-delivery preview as the complete evidence record.
