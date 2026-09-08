# Formal design output

Carry `project`, `ticket`, `created`, and other existing frontmatter fields over unchanged, then set these fields:

```yaml
status: draft
last_updated: {{date}}
depends_on: research.md
design_approach: {{approved_approach}}
decision_records: [{{closed_decide_issue_ids}}]
approval: pending
```

Then replace the body with the following structure. Resolve every token and remove irrelevant subsections rather than leaving scaffolding. Use the `bd create` commands as written.

````markdown
# Design: {{project_title}}

## Problem statement

{{problem_and_why_it_matters}}

### Success metrics

- {{measurable_outcome}}

### Constraints

- {{research_backed_or_user_constraint_with_reference}}

## Design approach

{{approved_what_level_architecture}}

### Why this approach

- {{rationale}}
- {{alignment_with_observed_pattern_and_reference}}
- {{accepted_tradeoff}}

## Technical decisions

### Architecture

- **Decision:** {{what_is_selected}}
  - **Rationale:** {{why}}
  - **Trade-off:** {{what_is_given_up}}
  - **Evidence:** `{{path:start-end}}`

### Data model and contracts

- {{data_shape_or_interface_contract_and_rationale}}

### Integration boundaries

- {{component_boundary_or_external_contract_and_rationale}}

## Scope

### In scope

- {{capability}}

### Out of scope

- {{excluded_capability_and_reason}}

## Success criteria

### Functional

- {{observable_behavior_or_invariant}}

### Non-functional

- {{measurable_performance_reliability_or_security_requirement}}

## Risks and mitigations

| Risk | Impact | Likelihood | Mitigation |
| --- | --- | --- | --- |
| {{risk}} | {{high_medium_low}} | {{high_medium_low}} | {{design_level_mitigation}} |

## Assumptions

Knowledge gaps from research, tracked in Beads so they get validated:

| Assumption | Validate issue | Impact if wrong |
| --- | --- | --- |
| {{assumption}} | `{{issue_id}}` | {{impact}} |

```bash
# Create beads issues for assumptions that need validation:
bd create "Validate: {{assumption}}" --type=task --priority=2 \
  -d "Assumption from design. If wrong: {{impact}}"
```

If there are none, write `No unresolved design assumptions.`

## Rejected alternatives

### {{alternative}}

- **Approach:** {{what_it_would_build}}
- **Rejected because:** {{decision_rationale}}
- **Trade-offs:** {{benefits_and_costs}}

## Pending decisions

Design decisions that need stakeholder input, tracked in Beads:

| Decision | Decide issue | Blocks |
| --- | --- | --- |
| {{decision}} | `{{issue_id}}` | {{blocked_scope}} |

```bash
# Create beads issues for pending decisions:
bd create "Decide: {{brief decision}}" --type=task --priority=1 \
  -d "Options: {{A, B, C}}. Trade-offs: {{summary}}. Blocks: {{what}}"
```

Decisions blocking execution must be resolved before `/wb:create_tasks`. If there are none, write `No pending design decisions.`

## References

- [Research](research.md)
- {{thoughts_document_link}}
- {{decision_issue_id_and_title}}
````

The final design must contain WHAT and WHY only. Implementation commands, ordered implementation actions, file-change lists, and task checkboxes are execution-plan content and must be removed; the `bd create` tracking snippets above are the only commands that belong.
