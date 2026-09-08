---
name: wb-create_project
description: Creates a dated Workbench project directory with research, design, task, and navigation documents.
---

# Initialize project documentation

Create `docs/plans/<date>-<name>/` or the user-supplied base-directory equivalent. This is the first Workbench stage; research follows.

The command arguments are, in order:

1. Project name: required, kebab-case.
2. Base directory: optional, defaults to `docs/plans`.
3. Ticket reference: optional, defaults to null.

Use supplied arguments directly. Ask only for required missing information. Never invent a project name or ticket.

## 1. Validate destination

Require a short kebab-case project name. Build the directory name as:

```text
<base>/<YYYY-MM-DD>-<TICKET-><project-name>/
```

Include the ticket segment only when supplied. If the destination exists, do not overwrite it. Report the collision and ask for a different name or destination.

## 2. Gather metadata

Collect current values, tolerating a non-git directory:

```bash
git rev-parse HEAD
git branch --show-current
git remote get-url origin
date -u +"%Y-%m-%dT%H:%M:%SZ"
date +"%Y-%m-%d"
whoami
```

Use `not-in-git` for an unavailable commit or branch, `no-remote` for an unavailable remote, and `unknown` only when a repository name cannot be derived. Derive the repository name from the remote when possible. For template values, use the supplied ticket as both `ticket_display` and `ticket_yaml`; with no ticket, use `N/A` for `ticket_display` and the YAML scalar `null` for `ticket_yaml`.

## 3. Create the directory and files

Read `skill://wb-create_project/templates.md` in full. Create:

- `README.md`
- `research.md`
- `design.md`
- `tasks.md`

Replace every `{{token}}` with a concrete collected value. Do not copy a token into the created files. Initial documents may state that their workflow stage has not started, but must not contain `TBD`, `TODO`, bracketed placeholder language, or invented findings and decisions.

Only `/wb:update_status` may later rewrite the `tasks.md` progress fields; the research and design workflows set their own document `status` on completion. Initial values are established here because the project does not yet have its Beads hierarchy.

## Barrier: verify creation

Before reporting success:

1. Read all four created files.
2. Confirm their paths and frontmatter values.
3. Confirm the formal documents contain no unexpanded `{{token}}` values or forbidden placeholder phrases.
4. Confirm links in `README.md` resolve within the project directory.

If any check fails, correct it before continuing.

## Result

Report the created directory, four files, captured git metadata, and the next command:

```text
/wb:create_research <project-directory>
```

Do not begin research, design, task generation, or Beads initialization in this workflow.
