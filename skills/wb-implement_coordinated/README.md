# Coordinated implementation

This workflow keeps the main session as the sole Beads coordinator while tiered workers implement collision-free tasks in shared-worktree waves. Independent verifiers gate every task close.

The ownership boundary is deliberate: workers edit code and tests, verifiers are read-only, and only the coordinator claims, closes, or blocks Beads issues. This prevents a worker from marking unverified code complete and prevents concurrent database mutation.

Workers are not isolated because a budget-aborted worker must be resumable through `hub` with its partial changes intact. File overlap is therefore represented as task dependencies and rechecked before every wave.
