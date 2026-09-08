# Changelog

Port releases are versioned `<upstream version>-omp.<n>`. Upstream changes are
tracked in the translation log in `docs/upstream-sync.md`.

## 2.6.0-omp.1 - 2026-09-07

Initial port of Workbench 2.6.0 (`447a1c6`) to oh-my-pi 18.1.11.

- 18 `/wb:*` commands wrapping 22 `wb-*` skills: project creation, research,
  product research, research validation, design exploration and creation,
  task planning, inline and coordinated implementation, execution and project
  validation, status reconciliation, handoff and resume, mockup creation and
  iteration, review prep, help.
- Nine `wb-*` task agents: four read-only research agents, a research
  validator, a task verifier with a structured pass/fail schema, and three
  tiered task workers (`@smol`, `@task`, `@slow`) sharing a hidden worker
  contract and TDD discipline.
- Rules: always-apply project structure, red-flag TTSR, and verification
  scoped to the main session and task workers.
- `extensions/workbench.ts`: Beads mode detection with bounded `bd prime`
  context, compaction and resume re-anchoring on the active plan, Markdown
  lint report on writes, shutdown drift notice, and the turn-end autonomy
  check.
- Evaluation harness: static validation and discovery smoke (`scripts/validate`),
  extension unit tests, and 20 live scenario cases under an isolated HOME.
- Divergences from upstream D1-D13 are documented in `docs/upstream-sync.md`;
  the largest are coordinator-owned Beads transitions with verifier-gated
  closes, collision-free worker waves, and the Eval browser prelude in place
  of Playwright MCP.

Known limits: dual-provider scenarios and the quota-fallback scenario are not
yet verified; the shared headless browser can wedge on `captureScreenshot`
(watch-list P11), so mockup skills bound screenshots and fall back to
presenting the HTML.
