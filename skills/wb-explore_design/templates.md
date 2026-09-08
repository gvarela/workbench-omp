# Design exploration records

## Thoughts document

Create only after the user confirms the decision framing. Replace every token with discussion evidence.

```markdown
---
project: {{project_name}}
created: {{date}}
status: exploration
topic: {{decision_topic}}
decision_issues: [{{decide_issue_ids}}]
tags: [thoughts, exploration, {{project_name}}]
---

# Exploration: {{decision_topic}}

{{orientation_linking_research_and_prior_thoughts}}

## Decision space

### Axes

- {{confirmed_decision_axis}}

### Constraints from research

- {{constraint_with_research_reference}}

### Already fixed

- {{explicit_user_choice_or_none}}

## Directions considered

### {{direction_name}}

**Thesis:** {{one_line_thesis}}

{{decision_level_description}}

- **Strengths:** {{strengths}}
- **Weaknesses:** {{weaknesses}}
- **Main risk:** {{risk}}
- **Reversibility:** {{reversibility}}
- **Codebase precedent:** {{research_backed_precedent_or_none}}

## Discussion

- {{timestamped_key_move_or_user_reaction}}

## Synthesis

- **Outcome:** {{approved_or_no_convergence}}
- **Converged direction:** {{approved_name_and_scope_when_approved}}
- **Rationale:** {{cold_readable_reasoning}}
- **Rejected with reasons:** {{unchosen_directions_and_reasons}}
- **Deferred to design:** {{remaining_design_questions_or_none}}
```

For an unconverged session, set Outcome to `No convergence`, state where discussion stopped, and omit claims that a direction was selected.

## Decide record

Create an open issue while framing:

```bash
bd create "Decide: <decision summary>" --type=task --priority=1 -d "Why this decision is open: <research-backed context>. Options: not yet explored. Constraints: <known constraints>. Exploration record: pending framing confirmation."
```

After the thoughts file exists, update the open issue description only after reading its current contents. Preserve prior text and add the named directions and repo-relative thoughts path.

Close only after explicit approval:

```bash
bd close <issue-id> --reason "Chosen: <direction> — <one-line thesis>. Rationale: <cold-readable reason>. Rejected: <direction and reason; repeat>. Exploration: <repo-relative thoughts path>."
```

The title must begin with `Decide:`. An open issue means pending; a closed issue means approved. The close reason must stand alone without session history.

For later amendments, prefer `bd comments add <issue-id> "AMENDMENT <date>: <change and reason>"`. If comments are unavailable, read the current notes with `bd show` before replacing them via `bd update --notes`.
