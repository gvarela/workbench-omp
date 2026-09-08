# Beads not initialized: standard response

Shared reference for Workbench skills that require durable task tracking. When
`bd info` fails or Beads is unavailable, report:

```text
Beads is not initialized.

Beads is required for task tracking in the Workbench workflow.

Initialize it from the project root:

    bd init            # git mode: .beads/ is committed
    bd init --stealth  # stealth mode: .beads/ is gitignored

Then run /wb:create_tasks to create the project issue hierarchy.
```

Stop and wait for the user to initialize Beads. Do not fall back to markdown
checkboxes or OMP `todo`; Beads is the only durable project-status authority.

If Beads is initialized but a command fails:

1. Run `bd info` to confirm initialization and `bd status` for the overview.
2. Report the exact error.
3. For an unknown issue, use `bd list -n 0` to locate the current id.
4. For a locked database, wait and retry; inspect `.beads/daemon.lock` only after
   confirming no active Beads process owns it.
5. Retry the failed command after correcting the cause.
