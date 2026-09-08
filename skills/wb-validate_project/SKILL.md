---
name: wb-validate_project
description: Audits a Workbench project directory for document, frontmatter, workflow, Beads, dependency, and cross-file consistency without changing state.
---

# Validate a project

Argument: project directory under `docs/plans/`.

This workflow is read-only. Report observed failures and exact corrective actions; never edit documents, mutate Beads, or claim an unchecked result.

## 1. Read the complete project state

If the argument is missing, ask for the project directory and stop.

List the directory structure. Read `research.md`, `design.md`, and `tasks.md` completely when present. Read the project `README.md`, every thoughts record, the latest handoff, and mockup log when they exist. Missing required files do not excuse the remaining checks.

Read `skill://wb-validate_project/reference.md` and `skill://wb-validate_project/templates.md` in full before evaluating or reporting.

## 2. Inspect authoritative Beads state

Run `bd info`; initialization failure is a critical error. Determine mode from the Workbench extension session message. If it is absent, run `git check-ignore -q .beads/`: success means stealth, failure means git mode. Mode changes persistence only and is not inferred from an environment variable.

Run `bd stats` and obtain every issue, including closed issues, only with `bd list --all -n 0 --json`. Never use `bd q`: in current Beads it quick-creates an issue rather than executing a read query. Extract `beads_epic`, every `beads_phases` value, and every `beads_tasks` value from `tasks.md`. Run `bd show <id> --json` for every referenced id. An unreadable or missing id is a critical error.

Planning records whose titles begin `Q:`, `Decide:`, `Validate:`, `UI Q:`, or `UI Assumption:` intentionally need not appear in task frontmatter; exempt them from the orphan check. Any other project issue that is not mapped is an orphan warning.

## 3. Execute every validation category

Use the rules in the reference. Record a result for every category even when another category fails:

1. required file structure;
2. YAML and required frontmatter;
3. allowed status values and stage ordering;
4. content completeness and unresolved placeholders;
5. Beads initialization, id existence, hierarchy, and state alignment;
6. document dependencies;
7. project, repository, Git, approval, count, and phase consistency;
8. task dependency direction, milestone gates, and annotated file-overlap serialization.

Do not accept markdown checkboxes as execution state. Beads is authoritative for task and milestone state. Do not infer that an issue exists or is closed from prose.

## 4. Report, do not repair

Only after all categories and all referenced Beads ids have been checked, render the report template with observed counts and concrete locations. Overall result:

- `FAIL` when any critical error exists;
- `PASS WITH WARNINGS` when no critical error exists and at least one warning exists;
- `PASS` otherwise.

For each finding state file or Beads id, observed value, invariant, impact, and one precise correction. Omit empty example sections and generic optional recommendations. End with the appropriate next command. Never offer to auto-fix in the same invocation; validation remains non-mutating.
