# First port: implementation plan

Target: upstream `447a1c6` (Workbench 2.6.0). Rules and file map:
[`upstream-sync.md`](./upstream-sync.md). Verification:
[`evals.md`](./evals.md). Rationale: [`port-findings.md`](./port-findings.md).

This plan supersedes the Delivery Plan section of `port-findings.md`. Agents
land before document workflows because every research skill spawns them; the
workflows cannot be exercised without them.

Conventions used below:

- **Files**: exact paths created or changed.
- **Done when**: observable acceptance; never "written".
- **Evals**: the tier and case that proves it (see `evals.md`).
- Phases are sequential. Tasks inside a phase marked `‖` are independent and
  may run concurrently; all others are ordered.
- Each phase ends with a checkpoint: the user reviews the phase's artifacts and
  eval output before the next phase starts.

## Phase 0: Scaffold and probes

Goal: a discoverable empty plugin, the static gate, and answers to every
watch-list question that changes the design.

| # | Task | Files | Done when |
| --- | --- | --- | --- |
| 0.1 | Package skeleton | `package.json` (`name`, `version: 2.6.0`, `omp.extensions: ["extensions/workbench.ts"]`), `.omp-plugin/plugin.json`, `.omp-plugin/marketplace.json`, `extensions/workbench.ts` (registers nothing yet), `README.md` (install instructions) | `omp plugin install wb@<local-marketplace>` succeeds; `/reload-plugins` lists `wb` |
| 0.2 | Probe agent and command | `agents/wb-codebase-locator.md` (frontmatter per file map; upstream body), `skills/wb-help/SKILL.md` (stub body: one line), `commands/help.md` | `/wb:help` resolves; `task` description lists `wb-codebase-locator` |
| 0.3 ‖ | Static gate | `scripts/validate` (Tier 0 checks 1–5), `scripts/lint` (copy upstream; markdownlint dependency documented) | `scripts/validate` passes on the scaffold and fails on a fixture file containing `Task({` |
| 0.4 ‖ | Discovery smoke script | `evals/discover.ts` invoked by `scripts/validate` | Reports discovered `wb-*` commands, skills, agents, rules, and extension load result as JSON; asserts against an expected list in the script |
| 0.5 | Probe P1 rules from marketplace | `rules/wb-project-structure.md` (temporary one-line rule) | Tier 1 reports the rule discovered from a marketplace install. If not: decision recorded in `upstream-sync.md` (rules become always-apply skills, or distribution moves to `omp plugin link`) |
| 0.6 | Probe P3 Claude shell hooks | none | Install upstream `wb@gvarela-workbench` alongside; observe whether `setup-beads-mode.sh` runs at session start. Record; uninstall |
| 0.7 | Probe P4 unresolved role alias | `agents/wb-codebase-locator.md` | Spawn with empty `modelRoles`; record whether `["@smol"]` fails, skips, or falls through. Decide whether every agent needs a trailing `"@default"` |
| 0.8 | Probe P2 extensions in subagents | `extensions/workbench.ts` (temporary `tool_call` logger) | Spawn `wb-codebase-locator`; record whether the handler fires for the child's tool calls. Remove the logger |
| 0.9 | Probe P5, P7, P8 | none | `skills.enableSkillCommands` default; `:level` suffix on `task.agentModelOverrides`; `bash.patterns` deny under subagent yolo. Record in the watch list |
| 0.10 | Settings template | `docs/reference/profiles/balanced.yml` (`modelRoles` with `review`, `retry.fallbackChains`, `task.softRequestBudget`, `task.maxConcurrency`, `task.enableEffort: false`, `modelRoleStorage: project`) | Referenced from `README.md`; contains no concrete model id |

Checkpoint: watch list P1–P8 all have a recorded answer; D1/D5/D6/D7 confirmed
or amended in `upstream-sync.md`.

## Phase 1: Command surface and help

| # | Task | Files | Done when |
| --- | --- | --- | --- |
| 1.1 | All command wrappers | `commands/` × 18 per file map; each: `$ARGUMENTS` preserved, `skill://wb-<name>` reference, one-paragraph invocation contract, no skill body | Tier 0 check 3 passes; `/wb:<name>` tab-completes for all 18 |
| 1.2 | `wb-help` full port | `skills/wb-help/SKILL.md` | Lists OMP command names, describes `Decide:` lifecycle and Beads commands; no `/beads:*` Claude slash references; Tier 3 `help-discovery` passes |
| 1.3 ‖ | Eval runner | `evals/run.ts`, `scripts/eval`, `evals/config.yml`, `evals/fixtures/empty/`, `evals/cases/help-discovery.json` | `scripts/eval --dry-run` and `--case help-discovery` pass |
| 1.4 ‖ | Reference docs | `skills/wb-reference/beads-not-initialized.md`, `documentarian-philosophy.md` (copy); `beads-mode.md` (adapt per D5); hidden skill `wb-reference` | Tier 0 passes |

Checkpoint: user runs `/wb:help` interactively.

## Phase 2: Agents

All nine agent files. Research and validator bodies track upstream with
frontmatter adaptations. Tiered workers are thin model profiles that autoload a
single shared worker contract with Beads mutation removed.

| # | Task | Files | Done when |
| --- | --- | --- | --- |
| 2.1 ‖ | Read-only research agents | `agents/wb-codebase-locator.md`, `wb-pattern-finder.md`, `wb-codebase-analyzer.md`, `wb-product-analyzer.md` | Tier 1 field assertions pass; spawning each from a scratch repo returns file:line evidence |
| 2.2 ‖ | Validators | `agents/wb-research-validator.md`, `wb-task-verifier.md` with `output` schema (verifier shape from findings), `blocking: true` | Tier 1 passes; a spawn against a fixture with one wrong `file:line` returns `status: "fail"` with the finding |
| 2.3 ‖ | Tiered worker profiles | `agents/wb-task-worker-smol.md`, `-task.md`, `-slow.md`; shared output schema; `autoloadSkills: [wb-task-worker-contract, wb-tdd-discipline]` | Tier 1 profile-matrix assertions pass; a spawn on a fixture task returns a schema-valid payload and runs no `bd` command |
| 2.4 | Shared worker disciplines | `skills/wb-task-worker-contract/SKILL.md`, `skills/wb-tdd-discipline/SKILL.md` (`hide: true`) | Tier 0 resolves both autoload entries; discovery reports both hidden; worker execution follows Red, Green, Refactor |
| 2.5 | Recommended settings check | `docs/reference/profiles/balanced.yml` | Same worker spawn with `config.swap.yml` resolves on the other provider |

Checkpoint: user inspects one worker and one verifier transcript.

## Phase 3: Document workflows

Order follows the workflow. Each task ports `SKILL.md` + `templates.md`
(Adapt) and rewrites `sub-agent-prompts.md` to `{context, tasks[]}` batches
with explicit wait-then-read barriers.

| # | Task | Files | Done when |
| --- | --- | --- | --- |
| 3.1 | Background rules and skills | `rules/wb-project-structure.md` (final), `rules/wb-red-flags.md` (TTSR `condition`, `scope` on `docs/plans/**` writes), `skills/wb-doc-adherence/` (`globs`), `skills/wb-status-sync/` | Tier 1 lists all; a scratch session writing `TBD` into `docs/plans/x/design.md` gets interrupted |
| 3.2 | `wb-create_project` | `skills/wb-create_project/` | Tier 3 `create-project` and `natural-project-discovery` pass |
| 3.3 | `wb-create_research` | `skills/wb-create_research/` | Tier 3 `create-research`: spawns locator/analyzer/pattern-finder in one batch, waits, `research.md` citations resolve |
| 3.4 ‖ | `wb-create_product_research`, `wb-research-validation` | respective dirs | `research-validation` on a fixture with a bad citation reports it |
| 3.5 | `wb-explore_design` | `skills/wb-explore_design/`; `effort: high` intent via command text | Tier 3 `explore-design-checkpoint`: stops at the framing gate with fake-UI "not confirmed"; no `design.md` written; `Decide:` issues created |
| 3.6 | `wb-create_design` | `skills/wb-create_design/` | Tier 3 `create-design` on `designed`-minus-design fixture; consumes closed `Decide:` issues |
| 3.7 | `wb-create_tasks` | `skills/wb-create_tasks/` (budget sizing restated against `task.softRequestBudget`) | Tier 3 `create-tasks`: epic/milestone/task hierarchy created, frontmatter keys match, file-overlap edges annotated |
| 3.8 ‖ | `wb-validate_project`, `wb-update_status` | respective dirs | `validate-project` flags a fixture with a missing `beads_epic`; `update-status` is the only skill that writes `status:` (trace assertion) |
| 3.9 ‖ | `wb-create_handoff`, `wb-resume_handoff` | respective dirs | `create-handoff` writes `handoff-*.md` with `git_commit`/`beads_*` frontmatter; `resume-handoff` in a new headless session reloads it and reports stale-HEAD warning on a fixture with a moved HEAD |

Checkpoint: user runs research → explore → design → tasks on a real small
project.

## Phase 4: Execution and verification

| # | Task | Files | Done when |
| --- | --- | --- | --- |
| 4.1 | `rules/wb-verification.md` | `agents: [main, wb-task-worker-*]` | Tier 1 lists it scoped |
| 4.2 | `wb-implement_tasks` | `skills/wb-implement_tasks/` | Tier 3 `implement-tasks-checkpoint`: milestone not closed while fake-UI answers "not confirmed" |
| 4.3 | `wb-implement_coordinated` | `skills/wb-implement_coordinated/` (waves, coordinator-owned Beads, D1 ladder, plan-defect protocol, truncation via `hub`), rewritten `sub-agent-prompts.md` | Tier 3 `implement-coordinated-wave`: two workers in one batch; issues open until `pass`; second FAIL lands in blocking list; plan defect files `Design revision:` and halts |
| 4.4 | `wb-validate_execution` | `skills/wb-validate_execution/` | Tier 3 `validate-execution` on `implemented` fixture; ad-hoc agents carry the documentarian constraint (trace) |

Checkpoint: user runs one coordinated phase on a real project.

## Phase 5: Lifecycle extension

| # | Task | Files | Done when |
| --- | --- | --- | --- |
| 5.1 | Beads lifecycle | `extensions/workbench.ts` `session_start` detects mode, persists it with `appendEntry`, and arms bounded `bd prime` context for the next agent turn; skills read the persisted mode | Tier 2 unit; a stealth-mode fixture session reports `stealth`; initialized fixture injects `bd prime` once |
| 5.2 | Re-anchoring | `session.compacting` context injection; `session_compact`/`session_tree`/`session_switch` message; plan-detection rule | Tier 2 unit; Tier 3 `compaction-reanchor` via SDK with low threshold |
| 5.3 | Shutdown drift notice | `session_shutdown` | Tier 2 unit |
| 5.4 | Lint report | `tool_result` on `write`/`edit`/`apply_patch` `.md`, non-mutating | Tier 2 unit proves file bytes unchanged |
| 5.5 | Autonomy/verification stop check | `session_stop` continue/block | Tier 2 unit; scratch session ending with "I will now…" is continued once |
| 5.6 | Active-plan pointer | `appendEntry` on `/wb:*` command dispatch (`registerCommand` or `tool_call` observation) | 5.2 uses it instead of scanning when present |

Checkpoint: user triggers `/compact` mid-phase on a real project and confirms
the re-anchor.

## Phase 6: UI workflows

| # | Task | Files | Done when |
| --- | --- | --- | --- |
| 6.1 | `wb-create_mockup` | `skills/wb-create_mockup/` (Eval browser prelude; `hub start` for servers; screenshot copied to `preview-v001.png`) | Tier 3 `create-mockup` on `ui` fixture: `mockups/v001/{mockup.md,mockup.html,preview-v001.png}` exist, PNG > 10 KB |
| 6.2 | `wb-mockup-iteration` | `skills/wb-mockup-iteration/` | Tier 3 `mockup-iteration`: `v002/` created, `mockup-log.md` `current_version: 2`, `UI Q:` issue blocks finalization |
| 6.3 | `wb-review-prep` | `skills/wb-review-prep/` + `nvim-helper.sh` (skill-relative) | Manual: helper resolves from the skill directory |

## Phase 7: Dual-provider verification and baseline

| # | Task | Done when |
| --- | --- | --- |
| 7.1 | Scenarios 1–2 | `create-research` and `implement-coordinated-wave` pass under `config.yml` and `config.swap.yml` |
| 7.2 | Scenario 3 | `review` role and `advisor:` on a worker resolve to the opposite family (trace shows provider) |
| 7.3 | Scenario 4 | Manual: exhausted account with `retry.fallbackChains` from the template; run completes on the fallback |
| 7.4 | Scenarios 5–9 | Tier 3 `compaction-reanchor`, `resume-handoff`, `implement-coordinated-wave`, `create-mockup` pass |
| 7.5 | Full suite | `scripts/validate`, `bun test evals/unit`, `scripts/eval --case all` green |
| 7.6 | Baseline | `UPSTREAM_BASELINE.json#baseline_commit = 447a1c6`, `ported_on` set; first row of the translation log; every upstream file accounted for; divergences D1–D13 marked `adopted` or amended; `CHANGELOG.md` 2.6.0-omp.1 |

## Out of scope for the first port

- Tier 4 parity judge (first upstream sync).
- `create_execution` alias (D8).
- Shared dual-runtime asset extraction with upstream.
- Eval harness for `review-prep`.

## Tracking

This repository is not yet a Workbench project (the plugin it needs is the
deliverable). Track phases with `bd init` once Phase 1 lands and file one epic
per phase from the tables above; until then this document is the tracker.
