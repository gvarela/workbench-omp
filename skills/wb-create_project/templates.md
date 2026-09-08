# Create-project templates

Read this file fully before creating the initial project documents. Replace every `{{token}}`; none may remain in generated files.

## README.md

```markdown
# {{project_title}}

**Created:** {{date}}
**Ticket:** {{ticket_display}}
**Status:** Planning

## Overview

Workbench project documentation for `{{project_name}}`.

## Documents

- [Research](research.md): current-system facts and evidence.
- [Design](design.md): approved decisions and rationale.
- [Tasks](tasks.md): executable phases and Beads linkage.
- `thoughts/`: optional design explorations when created.

## Workflow

1. Project structure created.
2. Run `/wb:create_research {{project_directory}}`.
3. Optionally run `/wb:explore_design {{project_directory}}` for consequential choices.
4. Run `/wb:create_design {{project_directory}}`.
5. Run `/wb:create_tasks {{project_directory}}`.
6. Run `/wb:implement_tasks {{project_directory}}` or `/wb:implement_coordinated {{project_directory}}`.
7. Run `/wb:validate_execution {{project_directory}}`.

## Git information

- Branch: `{{git_branch}}`
- Commit: `{{git_commit}}`
- Repository: `{{repository}}`
```

## research.md

```markdown
---
project: {{project_name}}
ticket: {{ticket_yaml}}
created: {{date}}
created_timestamp: {{timestamp}}
status: draft
last_updated: {{date}}
researcher: {{username}}
git_commit: {{git_commit}}
git_branch: {{git_branch}}
repository: {{repository}}
tags: [research, codebase, {{project_name}}]
---

# Research: {{project_title}}

## Research question

Research has not started. `/wb:create_research` establishes the question before gathering evidence.

## Summary

No findings recorded. This document remains `draft` until research begins.

## Detailed findings

No research evidence recorded.

## Architecture and patterns

No source-backed patterns recorded.

## Code references

No code references recorded.

## Open questions

No research questions recorded.

## References

- [Design](design.md)
- [Tasks](tasks.md)
```

## design.md

```markdown
---
project: {{project_name}}
ticket: {{ticket_yaml}}
created: {{date}}
created_timestamp: {{timestamp}}
status: draft
last_updated: {{date}}
designer: {{username}}
git_commit: {{git_commit}}
git_branch: {{git_branch}}
repository: {{repository}}
tags: [design, architecture, {{project_name}}]
depends_on: research.md
---

# Design: {{project_title}}

## Problem statement

Design has not started. `/wb:create_design` writes this section after approved research.

## Design approach

No approach selected.

## Technical decisions

No technical decisions recorded.

## Scope

No scope approved.

## Success criteria

No success criteria approved.

## Risks and alternatives

No risks or rejected alternatives recorded.

## Pending decisions

No pending decisions recorded.

## References

- [Research](research.md)
- [Tasks](tasks.md)
```

## tasks.md

```markdown
---
project: {{project_name}}
ticket: {{ticket_yaml}}
created: {{date}}
created_timestamp: {{timestamp}}
status: not-started
last_updated: {{date}}
assignee: {{username}}
current_phase: 0
total_tasks: 0
completed_tasks: 0
git_commit: {{git_commit}}
git_branch: {{git_branch}}
repository: {{repository}}
tags: [tasks, tracking, {{project_name}}]
---

# Tasks: {{project_title}}

## Progress

The execution plan and Beads hierarchy do not exist yet. Beads becomes the durable status authority when `/wb:create_tasks` runs.

## Planning record

- Project structure created on {{timestamp}}.
- Research, design, and task generation have not started.

## Implementation phases

No implementation phases generated.

## Blockers

No blockers recorded.

## Next action

Run `/wb:create_research {{project_directory}}`.

## References

- [Research](research.md)
- [Design](design.md)
```
