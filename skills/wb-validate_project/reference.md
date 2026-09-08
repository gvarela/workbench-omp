# Project validation reference

## Required files and frontmatter

Required files are `research.md`, `design.md`, and `tasks.md`.

Every required file must have valid YAML frontmatter with non-empty `project`, `created`, `status`, `last_updated`, `git_commit`, and `git_branch` fields. `design.md` must also have `approval` once formal design content exists. A planned `tasks.md` must have non-empty `beads_epic`, `beads_phases`, and `beads_tasks`, plus integer `current_phase`, `total_tasks`, and `completed_tasks` fields. Missing tracking fields on a generated plan are critical errors.

Allowed statuses:

- research: `draft`, `in-progress`, `complete`;
- design: `draft`, `ready`, `implementing`, `complete`;
- tasks: `not-started`, `in-progress`, `complete`.

Critical ordering violations:

- design is `ready`, `implementing`, or `complete` while research is not `complete`;
- design is `ready` or later without `approval: approved`;
- tasks are `in-progress` or `complete` while design is `draft`;
- design is `complete` while tasks are not `complete`.

## Content

Report unresolved `TBD`, `TODO`, `{{token}}`, `[To be added]`, `[Fill this in]`, or equivalent scaffold text. A section heading without substantive project-specific content is a warning. A status claiming completion while required findings, decisions, success criteria, phase tasks, verification commands, or source citations are absent is a critical error.

References of the form `path:line` must name an existing repository file and a valid line. Research validation failure is critical for downstream-ready documents.

## Beads mapping

Every id in task frontmatter must resolve with `bd show`. The epic must be type `epic`. Every mapped phase must be a child milestone of that epic. Every mapped task must be a child of exactly one mapped phase. Mapping keys and document phase/task names must agree.

`total_tasks` must equal the number of unique mapped task ids. `completed_tasks` must equal the number of mapped task ids whose Beads status is closed. `current_phase` must match the active phase rule used by `/wb:update_status`.

State alignment:

- `not-started`: no mapped task is in progress or closed;
- `in-progress`: at least one mapped task is in progress or closed, but the complete condition is false;
- `complete`: every mapped task and every mapped phase milestone is closed.

Epic open while tasks are complete is a warning; epic closed while mapped work remains open is a critical error.

## Dependencies

`design.md` must depend on `research.md`. `tasks.md` must depend on both `research.md` and `design.md`.

For Beads dependencies, direction is `dependent -> prerequisite`. A task dependency is valid only when its work consumes the prerequisite's output, or when an explicitly documented exception serializes file overlap or structure before behavior. Parallel work must not be chained merely because it appears later in the document. Each phase milestone depends on its phase tasks. Every later milestone depends on the previous milestone.

If two tasks name the same files and can run concurrently, either document non-overlapping boundaries or add a dependency annotated as `file-overlap serialization`. Unexplained cycles and dependencies on descendants are critical errors.

## Cross-file checks

Project names, repository identity, and stable creation metadata must agree. `last_updated` and Git metadata may differ only when the difference reflects a documented later edit; stale metadata is a warning. Design decisions must not contradict completed research or closed `Decide:` records. Tasks must implement the approved design without adding scope. Open relevant `Decide:` or failed `Validate:` issues block downstream readiness.

## Severity

Critical errors make the next workflow stage unsafe or make authoritative state unknowable. Warnings identify stale metadata, weak content, or cleanup that does not invalidate the workflow. A passed check names evidence, not an assumption.
