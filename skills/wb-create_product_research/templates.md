# Product research output

Replace every `{{token}}` with observed facts. Remove irrelevant rows or sections rather than leaving empty scaffolding.

Frontmatter: for a new file, use every field below. For an existing file, carry `project` and `created` over unchanged; `status: complete` is written on completion either way.

````markdown
---
project: {{project_name}}
created: {{date}}
status: complete
audience: product
last_updated: {{date}}
validation_status: not-yet-run
---

# Product research: {{feature_or_area}}

## Feature overview

{{plain_language_current_capabilities_with_claim_ids}}

## User flows

### {{flow_name}}

1. {{user_action}} [B1]
2. {{observable_system_response}} [B2]
3. {{branch_and_user_visible_outcomes}} [B3]

**Success outcome:** {{observed_success_outcome}} [B4]

**Error outcomes:**

- {{condition_and_observed_error}} [B5]

## Product behaviors

| Claim | Trigger | Current behavior | Configurable? |
| --- | --- | --- | --- |
| B6 | {{user_action_or_event}} | {{observable_result}} | {{setting_or_no}} |

## Data and integrations

### Data involved

- **User provides:** {{observed_inputs}} [B7]
- **System stores:** {{observed_persistence_or_none}} [B8]
- **User receives:** {{observed_outputs}} [B9]

### Connected capabilities

- **{{feature_or_service}}:** {{observed_interaction}} [B10]

### Behavior configuration

| Claim | Setting | Current effect | Default |
| --- | --- | --- | --- |
| B11 | `{{setting}}` | {{observed_effect}} | `{{value}}` |

## Engineering approach

- **Organization:** {{high_level_observed_structure}} [E1]
- **Patterns:** {{observed_implementation_pattern}} [E2]
- **Testing:** {{observed_test_approach}} [E3]

## Technical appendix

### Claim evidence

| Claim | Source | Evidence |
| --- | --- | --- |
| B1 | `{{path:start-end}}` | {{concise_factual_support}} |
| E1 | `{{path:start-end}}` | {{concise_factual_support}} |

### Key files

- `{{path:start-end}}` — {{role_in_product_terms}}

### Validation notes

No uncertain claims.

## Open questions

Questions requiring resolution are tracked in Beads:

```bash
bd create "Q: {{your question}}" --type=task --priority=2 \
  -d "Product research question. Context: {{what this affects}}"
```

{{Either "No unresolved product research questions." or one line per open issue: `{{id}}`: {{brief question}}. `bd list --status=open` is the source of truth.}}

## References

- [Engineering research](research.md)
- [Design](design.md)
````

Every `B*` and `E*` marker used above the appendix must appear exactly once in the claim-evidence table with a valid current `path:line` or `path:start-end` citation.
