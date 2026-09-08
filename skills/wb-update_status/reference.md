# Status synchronization reference

## Research

- `draft`: scaffold or no substantive current findings.
- `in-progress`: some substantive findings exist, but required scope, citations, or unresolved questions remain incomplete.
- `complete`: project-specific summary and detailed findings answer the research question, cited repository evidence exists, no placeholders or blocking open questions remain, and `validation_status` is not `failed`.

A failed research validation blocks `complete` and every downstream-ready transition.

## Tasks and progress

Let mapped tasks be the unique ids in `beads_tasks`, and mapped phases the ordered ids in `beads_phases`.

- `total_tasks` is the number of mapped tasks.
- `completed_tasks` is the number of mapped tasks with Beads status `closed`.
- `not-started`: no mapped task is `in_progress` or `closed`; `current_phase` is `0`.
- `in-progress`: at least one mapped task is `in_progress` or `closed`, but not every mapped task and phase is closed.
- `complete`: every mapped task and mapped phase is closed.

For in-progress work, `current_phase` is the lowest numbered phase containing an in-progress task or an unblocked open task after all earlier phases are closed. If all work is complete, it is the highest numbered phase. If the mapping is empty or inconsistent, do not synthesize progress values; report and stop.

Only mapped ids count. Planning issues and unrelated closed issues do not affect progress.

## Design

- `draft`: formal decisions are absent, approval is pending, research is incomplete, or a relevant blocking `Decide:` remains open.
- `ready`: research is complete, formal design content and measurable success criteria exist, `approval: approved`, and mapped tasks have not started.
- `implementing`: ready conditions hold and at least one mapped task is in progress or closed while task status is not complete.
- `complete`: ready conditions hold and task status is complete.

Design cannot skip directly from draft to implementing merely because an unrelated Beads issue changed.

## Transition constraints

Statuses normally move only forward in their listed order. A backward transition requires the update plan to show the inconsistency, the proposed correction, and the user's explicit reason-bearing approval. Never silently normalize an invalid state.

Tasks cannot become in-progress while design remains draft. Design cannot become ready before research is complete. Design cannot become complete before tasks are complete.

## Error responses

Missing documents: list each expected file with present/missing state and direct the user to `/wb:create_project`.

Missing Beads mapping or id: name the exact frontmatter field or id, explain that progress cannot be derived, and direct the user to repair the mapping or rerun `/wb:create_tasks` as appropriate.

Inconsistent state: show document value beside authoritative evidence, propose the smallest valid correction, then wait for explicit approval.
