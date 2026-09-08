# Engineering research output

Replace every `{{token}}` with current-code evidence; remove sections that have no relevant evidence rather than leaving empty scaffolding. Frontmatter fields marked "from existing frontmatter" are copied unchanged.

````markdown
---
project: {{from existing frontmatter}}
ticket: {{from existing frontmatter}}
created: {{from existing frontmatter}}
status: complete
last_updated: {{YYYY-MM-DD}}
---

# Research: {{project_title}}

## Research question

{{verbatim_or_faithful_user_question}}

## Summary

{{two_or_three_paragraph_factual_summary_with_citations}}

## Detailed findings

### {{component_or_area}}

**Location:** `{{path_or_directory}}`

**What exists:**

- {{factual_claim}} (`{{path:start-end}}`)
- {{connection_to_another_observed_component}} (`{{path:line}}`)

**How it works:**

1. {{observed_flow_step_with_citation}}
2. {{observed_flow_step_with_citation}}

{{repeat_component_sections_as_needed}}

## Architecture and patterns

### Current patterns

- {{observed_pattern_and_where_it_occurs}} (`{{path:start-end}}`)

### Component connections

- {{component_a}} → {{component_b}}: {{observed_interaction}} (`{{path:line}}`)

### Conventions

- {{observed_convention}} (`{{path:start-end}}`)

## Code references

- `{{path:line}}` — {{why_this_location_matters}}

## Similar implementations

- `{{path:start-end}}` — {{factual_description_of_the_existing_analogue}}

## Open questions

Questions that require resolution before proceeding are tracked in Beads, not in this document. To add one:

```bash
bd create "Q: {{your question}}" --type=task --priority=2 \
  -d "Research question. Blocks: {{what cannot proceed without this answer}}"
```

{{Either "No unresolved research questions." or one line per open issue: `{{id}}`: {{brief question}} - blocks {{what it blocks}}. `bd list --status=open` is the source of truth.}}

## References

- [Design](design.md)
- [Tasks](tasks.md)
````

A claim without a source reference does not belong in the final document. Do not include recommendations or a "next steps" implementation list in research.
