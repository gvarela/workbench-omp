# Durable handoff template

Resolve every token. Remove irrelevant optional subsections; write `None observed` for an applicable empty state.

```markdown
---
created: {{UTC_timestamp}}
type: handoff
project: {{project_slug}}
phase: {{current_phase}}
handoff_reason: {{reason}}
last_task: {{last_task_or_action}}
git_commit: {{full_head_commit}}
git_branch: {{branch}}
repository: {{repository}}
beads_epic: {{epic_id}}
beads_active_phase: {{active_phase_id_or_null}}
beads_in_progress: [{{in_progress_ids}}]
beads_ready: [{{ready_ids}}]
beads_blocked: [{{blocked_ids}}]
---

# Handoff: {{project_title}} — {{brief_state}}

## Resume contract

- **Project directory:** `{{project_directory}}`
- **Resume with:** `/wb:resume_handoff {{handoff_path}}`
- **Recorded HEAD:** `{{full_head_commit}}`
- **Beads mode:** {{git_or_stealth_and_evidence}}
- **Document/Beads drift:** {{exact_drift_or_none}}

## Current state

- **What is being built:** {{design_level_summary}}
- **Where work stopped:** {{phase_task_and_issue_id}}
- **Last completed action:** {{specific_action_and_evidence}}
- **Immediate next task:** {{issue_id_and_executable_outcome}}
- **Overall mapped progress:** {{closed}}/{{total}} tasks; {{phase_state}}

## Work completed this session

### Changes

- `{{path:line}}` — {{observable change}}

### Verification evidence

- `{{command}}` — {{observed result and time}}

## Beads snapshot

- **Epic:** `{{id}}` — {{status}}
- **Phases:** {{id_status_list}}
- **In progress:** {{id_title_list_or_none}}
- **Ready:** {{id_title_list_or_none}}
- **Blocked:** {{id_blocker_list_or_none}}

This snapshot is historical. Query current Beads state when resuming.

## In-flight context

### Critical discoveries

- {{fact_with_source_reference_and_why_it_matters}}

### Decisions and deviations

- {{decision_or_deviation_with_rationale_and_issue_reference}}

### Failed attempts

- {{attempt}} — {{failure evidence}} — {{do_not_repeat_condition}}

### Active blockers

- `{{issue_id}}` — {{blocker, impact, evidence, attempted_resolution}}

## Working tree

- **Status:** {{clean_or_exact_changed_paths}}
- **Staged:** {{paths_and_purpose_or_none}}
- **Unstaged:** {{paths_and_purpose_or_none}}
- **Untracked:** {{paths_and_purpose_or_none}}

## Next actions

1. `{{issue_id}}` — {{specific action}}
   - Start at: `{{path:line}}`
   - Acceptance: {{observable contract}}
   - Verify: `{{focused_command}}`
2. {{next dependency-aware action_or_none}}

## Watch points

- {{project_specific_gotcha_or_scope_boundary}}

## References

- [Research](research.md)
- [Design](design.md)
- [Tasks](tasks.md)
- {{relevant_thoughts_or_mockup_links}}
```

Do not use markdown task-status checkboxes; Beads carries execution state.
