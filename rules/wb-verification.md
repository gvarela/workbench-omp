---
description: Requires fresh executable evidence before any implementation, task, test, build, or phase completion claim.
agents: [main, wb-task-worker-*]
---

# Verification before completion

No completion claim without fresh verification evidence.

Before stating that work is complete, fixed, passing, or ready:

1. Identify the command or executable scenario that proves the exact claim.
2. Run it after the latest relevant change.
3. Read the complete result and exit status.
4. Confirm it exercises the requested behavior, not merely adjacent plumbing.
5. Report the observed evidence; claim only what it establishes.

A previous run, worker summary, source inspection, linter result, partial suite, or confidence statement is not proof of a different claim. A passing test is useful only when it would fail for a plausible defect in the behavior under review.

Task completion requires every acceptance criterion plus the task-specific verification. Phase completion requires every mapped task closed on fresh executable evidence, every phase command successful, and the required human checkpoint confirmed. In coordinated execution (`wb-implement_coordinated`) that evidence is a schema-valid independent verifier pass per task; in inline execution (`wb-implement_tasks`) it is the implementer's own fresh run of the task verification after the final change. Never close a Beads task or phase milestone before its applicable gate passes.

When evidence fails or cannot run, report the exact failure or blocker. Do not weaken the contract, suppress the error, special-case the fixture, or replace execution with an unsupported success claim.
