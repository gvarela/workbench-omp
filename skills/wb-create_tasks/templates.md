# Execution-plan output

Preserve existing creation metadata and all progress fields: `status`, `current_phase`, `total_tasks`, and `completed_tasks`. `/wb:update_status` reconciles those values after planning. After Beads creation, update or insert only:

```yaml
last_updated: {{date}}
depends_on: [research.md, design.md]
beads_epic: {{epic_id}}
beads_phases:
  phase1_milestone: {{phase1_id}}
beads_tasks:
  phase1_{{category}}_1: {{task_id}}
```

Include every phase and task in document order. Then use this body structure:

````markdown
# Execution plan: {{project_title}}

## Overview

{{implementation_bridge_from_current_to_approved_target}}

- **Design approach:** {{design_approach_reference}}
- **Target state:** {{success_criteria_reference}}
- **Worker request budget:** {{configured_soft_request_budget}} requests; each task reserves at least 25% for verification and wrap-up.

## Strategy

### Phase rationale

{{dependency_and_risk_based_ordering}}

### Testing strategy

{{existing_test_patterns_and_observable_verification}}

### Dependency policy

Edges name consumed outputs. File-overlap-only edges are explicitly labeled; unconnected work remains parallel.

## Beads tracking

- **Epic:** `{{epic_id}}`
- **Phase milestones:** {{ordered_milestone_ids}}
- **Granular tasks:** see frontmatter `beads_tasks`.

Use `bd ready`, `bd blocked`, and `bd show <id>` for current state. This document contains no task-status checkboxes; Beads is authoritative.

## Phase {{number}}: {{name}}

### Objective

{{single_phase_outcome}}

### Prerequisites

- {{actual_precondition_or_none}}

### Task {{number}}: {{specific_outcome}}

- **Beads:** `{{task_id}}`
- **Type:** {{setup_implementation_test_integration}}
- **Targets:** `{{path:start-end}}`, `{{approved_new_path}}`
- **Current state:** {{research_reference}}
- **Target behavior:** {{design_reference}}
- **Actions:** {{bounded_implementation_actions}}
- **Acceptance:** {{observable_completion_contract}}
- **Verification:** `{{focused_command}}`; {{human_scenario_or_none}}
- **Outputs:** {{artifacts_consumed_by_dependents}}
- **Allowed files:** {{exclusive_file_set}}
- **Estimated worker requests:** {{estimate}} / {{budget}}, including verification reserve.
- **Depends on:** {{issue_ids_and_concrete_consumed_outputs_or_none}}
- **Serialization:** {{file_overlap_reason_or_none}}

{{repeat_tasks}}

### Phase verification

- **Automated:** `{{phase_command}}` — {{expected_result}}
- **Human:** {{manual_observation}}
- **Milestone:** `{{milestone_id}}` depends on every phase task.
- **Checkpoint:** do not continue until automated evidence passes, the human confirms, the milestone closes, and `/wb:update_status` reconciles frontmatter.

### Modified Files (Phase {{number}})

Track all files changed in this phase (the implementation workflow fills this at the phase gate):

#### Code Files
- (none yet)

#### Test Files
- (none yet)

**Quick test commands:**

```bash
{{focused_phase_test_command}}
```

{{repeat_phases}}

## Implementation discoveries

Things to determine during implementation: {{technical_detail_or_configuration_to_confirm_or_none}}. Record evidence in Beads issue notes first, then summarize stable plan-relevant facts here. Do not introduce scope without a design revision.

## Implementation Notes

Appended by the implementation workflows only: dated worker discoveries, plan deviations with evidence, task splits, and phase entries. Never a restatement of a Beads transition.

- (none yet)

## References

- [Research](research.md)
- [Design](design.md)
````

No token may remain in the generated file; the literal `(none yet)` entries under Modified Files and Implementation Notes are the only placeholders, and the implementation workflows replace them. Each plan task has exactly one `beads_tasks` key and live issue id.
