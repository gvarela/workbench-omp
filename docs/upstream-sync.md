# Keeping Workbench OMP synchronized with upstream

`workbench-omp` is a semantic port of `gvarela/workbench` (the Claude Code
plugin) to the OMP harness. Upstream owns workflow intent; this repository owns
OMP packaging and runtime adaptation. Upstream content is never copied
unchanged: task syntax, agent and skill frontmatter, hook contracts, model
routing, tool names, browser calls, and environment variables all translate
through the rules in this document.

This document is permanent and is updated on every sync. `docs/port-findings.md`
is the one-time analysis that justified the port; treat it as historical.

## Source of truth

- `UPSTREAM_BASELINE.json#baseline_commit` records the last upstream commit
  fully reviewed and ported. `port_target_commit` records the commit the initial
  port is aiming at until the baseline is first set.
- The sibling `../workbench` checkout is read-only from this repository. Fetch
  it in a separate user-authorized step. Never modify it while porting.
- `../workbench-codex` is the earlier Codex port. Its `docs/upstream-sync.md`
  procedure informed this document; its mapping content does not apply to OMP.

### Port-owned paths (never overwritten from upstream)

- `.omp-plugin/`, `package.json`, `UPSTREAM_BASELINE.json`
- `commands/` (thin `/wb:*` wrappers; no upstream equivalent)
- `extensions/` (replaces upstream `hooks/` and `.claude-plugin/plugin.json#hooks`)
- `rules/`
- `docs/upstream-sync.md`, `docs/port-findings.md`
- `scripts/validate`
- Agent frontmatter blocks in `agents/*.md` (bodies track upstream)

## Harness differences

Each row is a translation rule. Column "Upstream" is Claude Code; "OMP" is the
form this plugin must use. Cite the OMP doc when the rule depends on runtime
behavior that could change.

### Packaging and invocation

| Concern | Upstream (Claude Code) | OMP | Rule |
| --- | --- | --- | --- |
| Marketplace catalog | `.claude-plugin/marketplace.json` | `.omp-plugin/marketplace.json` (`.claude-plugin/` is a read fallback) | Maintain the OMP catalog; do not rely on the fallback. `omp://marketplace.md` |
| Plugin manifest | `.claude-plugin/plugin.json` (name, version, hooks) | `.omp-plugin/plugin.json` + `package.json#omp.extensions` | Version and description track upstream; `hooks` block is not ported (see Hooks). |
| User command surface | Every skill is `/wb:<skill>` automatically | Skills are `/skill:<name>` only if `skills.enableSkillCommands`; marketplace `commands/*.md` become `/wb:<name>` | Every user-invocable upstream skill gets a `commands/<name>.md` wrapper that preserves `$ARGUMENTS` and points at `skill://<skill>`. `omp plugin link` installs get no prefix. `omp://slash-command-internals.md` |
| Skill names | Plugin-namespaced | Flat first-wins namespace across all providers | Prefix every skill directory `wb-` (see divergence D6). |
| Agent names | Plugin-namespaced | Flat exact-name first-wins | Prefix every agent `wb-`. |
| Asset paths | `${CLAUDE_PLUGIN_ROOT}` | `[Skill directory: <baseDir>]` header injected on skill load | Rewrite to skill-relative paths. `omp://skills.md` |
| Argument variables | `$ARGUMENTS`, `$1` | `$ARGUMENTS`, `$1`, `$@`, `$@[start:length]` in `commands/*.md`; inline-argument append fallback | Keep `$ARGUMENTS`/`$1` in the command wrapper; skills read them from the wrapper's expansion. |
| Reload after edit | Restart | `/reload-plugins` for skills/commands/MCP; restart for tools, hooks, extensions | Dev-loop note only. `omp://marketplace.md` |

### Skill frontmatter

| Upstream key | OMP handling | Where the intent goes |
| --- | --- | --- |
| `name`, `description` | Kept. `description` drives rulebook matching. | — |
| `argument-hint` | Preserved as unknown metadata; not rendered | `commands/<name>.md` body |
| `allowed-tools` | Not honored | Drop. Tool restriction is an agent concept in OMP. For read-only background skills, no replacement is needed. |
| `user-invocable: false` | No equivalent (skill commands are all-or-nothing) | Drop. Background skills are reached via `autoloadSkills`, rules, or `skill://`. |
| `disable-model-invocation: true` | Supported; normalized to `hide` | Keep (kebab-case accepted). |
| `effort: high` (`explore_design`, `research-validation`, `validate_execution`) | Not honored by `/skill:` injection | Extension command that calls `pi.setThinkingLevel`, or document as user action. Record in the translation log when ported. |
| `model: sonnet` (`research-validation`, `validate_execution`) | Not honored | Route through the agent the skill spawns (`wb-research-validator`), not the skill. |
| `when_to_use` | Preserved as unknown metadata | Fold into `description`. |
| — | `globs`, `alwaysApply`, `hide` | OMP-only. Use `alwaysApply` for `wb-project-structure`; `globs: ["docs/plans/**"]` for `wb-doc-adherence`. |

### Agent frontmatter

Contract: `omp://task-agent-discovery.md` §Agent definition shape. Missing
`name` or `description` makes the agent invalid and silently skipped.

| Upstream key | OMP key | Rule |
| --- | --- | --- |
| `tools: Read, Grep, Glob, Bash(ls:*)` | `tools: [read, grep, glob]` | Lowercase. `Bash(cmd:*)` restrictions have no per-agent form; read-only agents omit `bash` entirely. Subagents run `approvalMode: yolo`, so `bash.patterns` is not a substitute. |
| `model: haiku\|sonnet\|opus` | `model: ["@smol"]`, `["@task"]`, `["@slow"]` | Role aliases only. Multi-entry list = per-spawn fallback chain. Never write a provider/model id. |
| (no `model`, per-spawn override) — `task-worker` | See divergence D1 | OMP has no per-call model on the task wire. |
| `effort: medium\|high` | `thinkingLevel: medium\|high` | `xhigh`/`max` are valid; OMP clamps unsupported levels per model. |
| `skills: [tdd-discipline]` | `autoloadSkills: [wb-task-worker-contract, wb-tdd-discipline]` | Worker behavior and TDD policy are centralized hidden skills. Unknown names are silently ignored; `scripts/validate` resolves every entry. |
| `maxTurns: N` | (none) | Drop. Runaway bound is session-level `task.softRequestBudget` (default 200) and `task.maxRuntimeMs`. Document in recommended settings. |
| — | `readSummarize: false` | Add to every agent that must quote exact code: analyzer, pattern-finder, product-analyzer, research-validator, task-verifier. Markdown is never summarized, so planners do not need it. |
| — | `output: <schema>` | Add to `wb-task-worker-*` and `wb-task-verifier`; replaces `### Status: PASS` marker parsing. |
| — | `blocking: true` | Add to `wb-task-verifier` and `wb-research-validator`; verification is a barrier. |
| — | `advisor`, `prewalk`, `spawns` | OMP-only. Optional; record in the translation log if adopted. |

### Model routing and user settings

Upstream hardcodes model families in agent frontmatter and per-spawn overrides.
The port ships no concrete model id anywhere.

| Concern | Upstream | OMP | Rule |
| --- | --- | --- | --- |
| Where routing lives | Agent `model:` + coordinator per-spawn override | Agent frontmatter `model: ["@role", ...]` | Shippable routing is frontmatter only. `task.agentModelOverrides` is optional per-user tuning a plugin cannot ship. Precedence: overrides → frontmatter list → parent model. |
| Roles used | haiku / sonnet / opus / fable | `@smol`, `@task`, `@slow`, `@plan` | Built-in roles: `default, smol, slow, vision, plan, commit, tiny, task, advisor`. Do not alias verifiers to `@advisor`; that role drives the advisor runtime. `smol` also backs `tiny` unless set. |
| Concrete models | Fixed in plugin | User config: `modelRoles` in `~/.omp/agent/config.yml` or project `.omp/config.yml` (`modelRoleStorage: project`), or `/model` Roles view | Ship a documented settings template, not defaults. OpenAI OAuth is provider `openai-codex`, not `openai`. |
| Cross-provider fallback | None | `retry.fallbackChains` keyed by role or `provider/model`; default `{}`; no per-agent key | Opt-in. Phase 7 scenario 4 requires an explicit chain in the template. Per-agent chains come only from multi-entry frontmatter `model` lists. |
| Worker runaway bound | `maxTurns` | `task.softRequestBudget` (200), `task.maxRuntimeMs`, `task.maxConcurrency` | Session settings; include in the template with upstream's ~70-call sizing heuristic restated against them. |

### Subagent dispatch

| Upstream | OMP | Rule |
| --- | --- | --- |
| `Task({ description, prompt, subagent_type, model })` | `task` tool batch: `{ context, tasks: [{ name, agent, task, outputSchema?, schemaMode?, effort? }] }` | `context` is required. `prompt`→`task`, `subagent_type`→`agent`. No `model` field. Independent items go in one `tasks[]`. |
| Synchronous return | Asynchronous; results auto-deliver or are read at `agent://<id>` | Every synthesis step must wait for all jobs, then read each `agent://` result. Barrier wording in skills must say this explicitly. |
| `### Status: PASS/FAIL` marker | `outputSchema` + `schemaMode: strict` on the verifier | `schemaMode` validates the child's `yield` payload OMP-side; it is unrelated to provider structured-output support. Any validation error ⇒ FAIL. |
| Per-spawn `effort: xhigh` | Per-item `effort: lo\|med\|hi`, only when `task.enableEffort` is on (default off) | The port leaves it disabled; tiered agent frontmatter supplies effort without widening every task call. |
| Retry the same worker | `hub send` to a completed non-isolated agent revives it | Isolated agents are torn down and not revivable. See D1/D7. |
| `agent://` output as evidence | Lives in the session artifact dir; `/drop` deletes it | Implementation Notes and Beads close reasons must carry the evidence text, not `agent://` ids. |

### Hooks and lifecycle

Upstream `plugin.json#hooks` runs shell scripts. OMP loads only TS/JS extension
and hook modules; the upstream `hooks` block is not executed and is not ported.

| Upstream hook | Script | OMP event | Translation |
| --- | --- | --- | --- |
| `SessionStart` | `setup-beads-mode.sh` exports `BEADS_MODE` via `CLAUDE_ENV_FILE` | `session_start` detects; `before_agent_start` delivers | No env-injection channel exists. The extension detects the mode and runs bounded `bd prime` at `session_start`, persists `wb-beads-mode`, and returns the `wb-beads-context` message from the first `before_agent_start` so delivery is turn-synchronous in print, SDK, and TUI modes (P10). See D5. |
| `SessionStart` matcher `compact` | `compact-recovery.sh` prints re-anchor text | `session.compacting` (inject `context[]` into the summary) + `session_compact` (post-hoc re-anchor) + `session_tree` + `session_switch` with `reason: resume` | Stronger than upstream: the summary itself can carry the active plan dir and "plan-doc content is paraphrase". `session_compact` also fires after `/handoff`. `omp://compaction.md` |
| `PostToolUse` `Write`/`Edit` | `lint-hook` runs `lint --fix` | `tool_result` filtered on `write`, `edit`, `apply_patch` | Non-mutating lint report only (D4). Mutating the file invalidates the hashline snapshot. Browser writes emit no tool events. |
| `SessionEnd` | `beads-drift-check.sh` one-line reminder | `session_shutdown` (`ctx.ui.notify`) | Not `session_stop`: that is a per-turn main-session hook and would nag every turn. |
| — | — | `session_stop` `{ continue \| block }` | OMP-only. Enforces the coordinator autonomy contract and verification-before-completion at turn end. Main session only; never fires in subagents. |

Extension constraints: in-process, no isolation. A restricted-tool subagent
loads no extension of its own, but Phase 0 proved the parent extension runner
observes child tool events. With `claude-plugins` enabled, handlers can observe
the same event twice, so child-aware guards must be idempotent.

### Browser

| Upstream | OMP |
| --- | --- |
| `mcp__plugin_playwright_playwright__browser_*` MCP tools in `allowed-tools` | Eval prelude `browser.open`, `tab.observe`, `tab.click/fill/type`, `tab.screenshot`, `browser.close`. Not tools: agents need `eval` in `tools`; unavailable under plan mode. |
| Screenshot to `preview-v00N.png` | `tab.screenshot()` accepts no output path and downsizes to WebP/JPEG unless `browser.screenshotDir` is set; write the versioned PNG from `tab.run(({ page }, path) => page.screenshot({ path, type: "png", fullPage: true }), { args: [absPath] })`. |
| Dev server via background bash | `hub start` with `ready.port`/`ready.log`. |
| — | Infinite CSS animations (`animation: … infinite`) in mockup HTML hang `Page.captureScreenshot` on the shared headless Chrome (60 s protocol timeout) and leave the browser wedged for later sessions; mockups render every state statically. |

### Beads and status

| Concern | Upstream | OMP port |
| --- | --- | --- |
| Status authority | Beads; todo tools forbidden outright | Beads. OMP `todo` may model the current turn only; never closes or contradicts Beads (D3). Subagents do not receive `todo`. |
| Claim/close | Worker claims and closes as final action (truncation detector) | Coordinator claims and closes after verifier pass (D2). Completion signal comes from `SingleResult.exitCode/abortReason` + `output` schema. |
| `bd remember` | Used for constraints; pruned at handoff | Unchanged. OMP memory backend is off by default and not authoritative; do not substitute. |
| Frontmatter writer | `update_status` is the sole writer | Unchanged. Extension only reports drift. |
| Planning-prefix issues (`Q:`, `Decide:`, `Validate:`, `UI Q:`, `UI Assumption:`), `-n 0`, `--claim`, milestone `blockedBy`, dependency-graph rules | Portable prose | Copy verbatim. |

## File map

Destination paths are relative to this repository. "Rewrite" = OMP-specific
content that must be authored; "Adapt" = copy, then apply the rules above;
"Copy" = content is portable with path/wording edits only.

### Workflow skills → `skills/wb-<name>/` + `commands/<name>.md`

| Upstream `plugin/skills/<name>/` | Destination | Mode |
| --- | --- | --- |
| `create_project/{SKILL,templates}.md` | `skills/wb-create_project/`, `commands/create_project.md` | Adapt |
| `create_research/{SKILL,templates}.md` | `skills/wb-create_research/`, `commands/create_research.md` | Adapt |
| `create_research/sub-agent-prompts.md` | same dir | Rewrite (all `Task({...})`) |
| `create_product_research/{SKILL,templates}.md`, `sub-agent-prompts.md` | `skills/wb-create_product_research/`, `commands/create_product_research.md` | Adapt / Rewrite |
| `explore_design/{SKILL,templates}.md` | `skills/wb-explore_design/`, `commands/explore_design.md` | Adapt; `effort: high` per skill table |
| `create_design/{SKILL,templates}.md`, `sub-agent-prompts.md` | `skills/wb-create_design/`, `commands/create_design.md` | Adapt / Rewrite |
| `create_tasks/{SKILL,templates,examples}.md`, `sub-agent-prompts.md` | `skills/wb-create_tasks/`, `commands/create_tasks.md` | Adapt / Rewrite; tool-call budget sizing → `task.softRequestBudget` terms |
| `create_execution/*` | — | Not ported (D8) |
| `implement_tasks/{SKILL,templates}.md` | `skills/wb-implement_tasks/`, `commands/implement_tasks.md` | Adapt |
| `implement_coordinated/{SKILL,README,reference,templates}.md` | `skills/wb-implement_coordinated/`, `commands/implement_coordinated.md` | Adapt; wave execution, coordinator-owned Beads (D1, D2, D7) |
| `implement_coordinated/sub-agent-prompts.md` | same dir | Rewrite; worker/verifier/fix-worker prompts |
| `validate_execution/{SKILL,templates}.md`, `sub-agent-prompts.md` | `skills/wb-validate_execution/`, `commands/validate_execution.md` | Adapt / Rewrite; ad-hoc agents must restate the documentarian constraint |
| `validate_project/{SKILL,reference,templates}.md` | `skills/wb-validate_project/`, `commands/validate_project.md` | Adapt |
| `update_status/{SKILL,reference,templates}.md` | `skills/wb-update_status/`, `commands/update_status.md` | Adapt |
| `create_handoff/{SKILL,templates}.md` | `skills/wb-create_handoff/`, `commands/create_handoff.md` | Adapt; stays file-based, distinct from OMP `/handoff` |
| `resume_handoff/{SKILL,reference,templates}.md` | `skills/wb-resume_handoff/`, `commands/resume_handoff.md` | Adapt |
| `create_mockup/{SKILL,templates}.md`, `sub-agent-prompts.md` | `skills/wb-create_mockup/`, `commands/create_mockup.md` | Adapt / Rewrite; browser table |
| `mockup-iteration/{SKILL,templates,examples}.md` | `skills/wb-mockup-iteration/`, `commands/mockup-iteration.md` | Adapt; browser table |
| `review-prep/SKILL.md`, `nvim-helper.sh` | `skills/wb-review-prep/` (+ `nvim-helper.sh`), `commands/review-prep.md` | Adapt; skill-relative path for the helper |
| `research-validation/SKILL.md` | `skills/wb-research-validation/`, `commands/research-validation.md` | Adapt; `model`/`effort` move to `wb-research-validator` |
| `help/SKILL.md` | `skills/wb-help/`, `commands/help.md` | Adapt; command list is OMP's |

### Background skills → `skills/wb-<name>/` and/or `rules/`

| Upstream | Destination | Mode |
| --- | --- | --- |
| `project-structure/SKILL.md` | `rules/wb-project-structure.md` (always-apply, compact) | Adapt |
| `tdd-discipline/SKILL.md` | `skills/wb-tdd-discipline/` (`hide: true`, autoloaded by `wb-task-worker-*`) | Adapt |
| — | `skills/wb-task-worker-contract/` (`hide: true`, autoloaded by all workers) | OMP-only D1 support; centralizes behavior shared by the three model profiles |
| `doc-adherence/SKILL.md` | `skills/wb-doc-adherence/` with `globs: ["docs/plans/**"]`; `rules/wb-red-flags.md` (TTSR `condition` on red-flag phrases) | Adapt; "same uncompacted window" wording → "full read text visible" (reads are prunable pre-compaction) |
| `verification-before-completion/SKILL.md` | `rules/wb-verification.md` scoped `agents: [main, wb-task-worker-*]`; `session_stop` check in extension | Adapt |
| `status-sync/SKILL.md` | `skills/wb-status-sync/` (interactive drift check) + `session_shutdown` notice in extension | Adapt; never auto-writes frontmatter |

### Agents → `agents/wb-<name>.md`

| Upstream | Destination | Frontmatter |
| --- | --- | --- |
| `codebase-locator.md` | `wb-codebase-locator.md` | `tools: [grep, glob]`, `model: ["@smol"]` |
| `pattern-finder.md` | `wb-pattern-finder.md` | `tools: [grep, glob, read, ast_grep]`, `model: ["@smol"]`, `readSummarize: false` |
| `codebase-analyzer.md` | `wb-codebase-analyzer.md` | `tools: [read, grep, glob]`, `model: ["@task"]`, `thinkingLevel: medium`, `readSummarize: false` |
| `product-behavior-analyzer.md` | `wb-product-analyzer.md` | as analyzer |
| `research-validator.md` | `wb-research-validator.md` | `tools: [read, grep, glob]`, `model: ["@slow", "@task"]`, `thinkingLevel: high`, `readSummarize: false`, `blocking: true` |
| `task-verifier.md` | `wb-task-verifier.md` | `tools: [read, grep, glob, bash, lsp]`, `model: ["@review", "@slow"]` (the other provider family; see settings template), `thinkingLevel: xhigh`, `readSummarize: false`, `blocking: true`, `output: <verifier schema>` |
| `task-worker.md` | `wb-task-worker-smol.md`, `wb-task-worker-task.md`, `wb-task-worker-slow.md` (D1; thin profiles) | `tools: [read, write, edit, grep, glob, bash]`, `model: ["@smol"]` / `["@task"]` / `["@slow","@task"]`, `autoloadSkills: [wb-task-worker-contract, wb-tdd-discipline]`, `thinkingLevel: high` / `medium` / `high` (effort is part of the tier), `output: <worker schema>`; bodies only invoke the shared contracts |

Research and validator agent bodies track upstream. The shared worker contract
tracks the upstream worker body with Beads mutation removed; the three worker
files are declarative model profiles.

### Hooks, scripts, reference docs

| Upstream | Destination | Mode |
| --- | --- | --- |
| `hooks/setup-beads-mode.sh` | `extensions/workbench.ts` (`session_start`) | Rewrite (D5) |
| `hooks/compact-recovery.sh` | `extensions/workbench.ts` (`session.compacting`, `session_compact`, `session_tree`, `session_switch`) | Rewrite; keep plan-detection rule: newest `docs/plans/*/tasks.md` with `status != complete`, list candidates when ambiguous |
| `hooks/beads-drift-check.sh` | `extensions/workbench.ts` (`session_shutdown`) | Rewrite; keep stealth-mode skip and no-`bd` time budget |
| `scripts/lint-hook` | `extensions/workbench.ts` (`tool_result`, report-only) | Rewrite (D4) |
| `scripts/lint`, `scripts/README.md` | `scripts/lint` | Rewrite (staged/changed-file default, `--all`, `--fix`); markdownlint-cli is a devDependency |
| `docs/reference/beads-mode.md` | `skills/wb-reference/beads-mode.md` | Adapt; "never re-detect" rule revised per D5 |
| `docs/reference/beads-not-initialized.md` | `skills/wb-reference/` | Copy |
| `docs/reference/documentarian-philosophy.md` | `skills/wb-reference/` | Copy |
| `.claude-plugin/plugin.json` | `.omp-plugin/plugin.json`, `package.json` | Rewrite; version tracks upstream |
| `.claude-plugin/marketplace.json` (repo root) | `.omp-plugin/marketplace.json` | Rewrite |
| Repo `CLAUDE.md`, `README.md`, `CHANGELOG.md`, `RELEASING.md`, `docs/*.md` | `README.md`, `CHANGELOG.md`, `docs/` | Upstream-only unless a behavior the port ships changes; port keeps its own changelog |
| Repo `.codex/` | — | Not applicable (beads' own Codex hooks) |
| Repo `.markdownlintrc`, `.gitignore`, `.gitattributes` | `.markdownlintrc`, `.gitignore` | `.markdownlintrc` Copy; `.gitignore` Rewrite (`.artifacts/`, `node_modules/`); `.gitattributes` not needed |

## Intentional divergences

Each entry: what upstream does, what this port does, why, and when to revisit.
Status `proposed` becomes `adopted` when the implementing change lands and the
translation log cites it.

| ID | Upstream behavior | Port behavior | Rationale | Revisit when | Status |
| --- | --- | --- | --- | --- | --- |
| D1 | Coordinator picks haiku/sonnet/opus + `effort: xhigh` per task via per-spawn override on a model-less `task-worker`; escalation = one fix worker on fable@high (opus fallback), same-tier retry rejected (`docs/plans/2026-09-01-fable-5-1-rebaseline/design.md` D1) | Thin agents `wb-task-worker-smol`/`-task`/`-slow` select `["@smol"]`, `["@task"]`, or `["@slow","@task"]`; all autoload one hidden worker contract and the TDD skill. Escalation: verifier FAIL → one slow-worker spawn with the finding; second FAIL → checkpoint blocking list. Same-worker `hub` retry only for budget-aborted workers | OMP task wire has no per-call model. Three profiles preserve explicit batch routing while the shared contract removes prose drift | OMP adds a per-call model field, allowing one worker profile | adopted |
| D2 | Worker claims and closes its Beads issue as its final action; close doubles as truncation detector | Coordinator claims before spawn, closes only after verifier pass; worker never runs `bd`. Truncation detected from `SingleResult.abortReason`/`exitCode` and `output` validation | Prevents "closed but failed verification"; enables coordinator-owned wave execution; removes shared-DB writes from workers | Never; core port decision | adopted |
| D3 | `CLAUDE.md`: never use TaskCreate/TodoWrite | OMP `todo` allowed for the current turn's execution sequence only; Beads sole durable authority | OMP strips `todo` from subagents and drops completed items on resume, so it cannot masquerade as status | If OMP todo becomes persistent | adopted |
| D4 | `lint-hook` runs `markdownlint --fix` on every `.md` write | Extension reports lint findings; model fixes explicitly or runs `scripts/lint --fix` | External mutation after a hashline edit invalidates the snapshot; recovery is not guaranteed (`omp://tools/edit.md` §Constraints) | If OMP records post-formatter content into snapshots | adopted |
| D5 | `BEADS_MODE` exported to shell via `CLAUDE_ENV_FILE`; skills never re-detect | Extension detects on `session_start` and records it via `pi.appendEntry` (namespaced custom entry); skills read it from the extension-provided message. Fallback: `git check-ignore -q .beads/` inline | OMP has no env-injection channel into model-run bash | If OMP adds session env injection | adopted |
| D6 | Skill names unprefixed (plugin-namespaced by Claude) | All skill dirs `wb-<name>`; user-facing names stay `/wb:<name>` via `commands/` | OMP skill namespace is flat first-wins across every provider | Never | adopted |
| D7 | Workers spawned sequentially, one at a time | Collision-free `bd ready` waves run as one `tasks[]` batch, bounded by `task.maxConcurrency`; file overlap remains a planner dependency | OMP async tasks; upstream planner already models file overlap. Non-isolated workers so budget-aborted ones are revivable | If waves cause Beads DB contention in practice | adopted |
| D8 | `create_execution` deprecated alias (removed upstream at 3.0.0) | Not ported | Clean cutover; no OMP users depend on it | Never | adopted |
| D9 | `status-sync` background skill | Interactive drift check stays a skill; deterministic reminder moves to `session_shutdown`. No auto-writer | Upstream drift design rejected auto-sync; `session_stop` would fire every turn | Never | adopted |
| D10 | Playwright MCP | Eval browser prelude; `hub start` for dev servers | No MCP dependency; OMP's required visual-verification path | Never | adopted |
| D11 | Handoff file only | Handoff file unchanged; OMP native `/handoff` treated as a compaction method that triggers `session_compact` re-anchoring | OMP `/handoff` is in-session and not file-based; upstream rationale ("inspectable, correctable") still holds | If OMP `/handoff` gains a durable file output | adopted |
| D12 | Claude-specific Beads plugin supplies `/beads:*` commands and SessionStart hooks | No Claude or third-party Pi Beads plugin dependency. Workbench invokes official `bd` CLI JSON commands and owns minimal OMP-native mode, `bd prime`, compaction, and drift lifecycle behavior in its existing extension | Official Beads has no OMP setup recipe; `pi-beads-extension` duplicates prompt/compaction policy; `pi-tasks` cannot edit Beads hierarchy or dependencies; direct CLI keeps token and mutation ownership explicit | If Beads ships an official OMP recipe or OMP adds a first-class Beads service with the required graph semantics | adopted |
| D13 | Design approval is implicit: `create_tasks` proceeds when `design.md` has `status: ready` | `design.md` carries `approval: approved`, `approved_at`, and `decision_records: [...]`; `wb-create_design` writes them only after explicit user approval, and `wb-create_tasks`, `wb-update_status`, and `wb-validate_project` gate on them | Headless and coordinated runs cannot infer approval from a status word; an explicit field makes the human gate checkable by evals and by `wb-validate_project` | If upstream adds an equivalent approval field | adopted |
| D14 | Verifier and worker share the Anthropic family; effort fixed at `xhigh` per spawn | `wb-task-verifier` runs on `@review`, mapped to the other provider family; workers carry tier-specific effort (`smol` high, `task` medium, `slow` high, verifier `xhigh`). The settings template routes volume roles to the higher-quota subscription and the one-call-per-task review role to the lower-quota one, with `retry.usageAwareFallback` and per-role `fallbackChains` so the review stays cross-family until that quota is exhausted, then falls to the strongest same-family model | Amp's published routing pairs a writer with an oracle from the opposite family at every top tier and folds effort into the tier; independent verification by a different model family catches shared blind spots, and quota-aware routing keeps a Plus-tier subscription from becoming the bottleneck | If a provider ships a model that dominates on both quality and quota, or OMP adds per-call model selection on the task wire | adopted |

Statuses reflect landed behavior as of the Phase 5 review remediation; the
translation log's first sync row is written when `UPSTREAM_BASELINE.json` is
set in Phase 7. Phase 0 probes confirmed D1, D5, D6, and D7. Role aliases inherit the
authenticated parent when their priority model lacks credentials, override
thinking suffixes are honored, upstream Claude shell hooks do not execute, the
`wb` package name yields `/wb:*`, and task batches spawn asynchronously.
User-scoped marketplace agents require `enabledProviders: [claude-plugins]`;
the committed settings template enables it. In the probe logger, enabling that
provider caused identical extension events to be observed twice, so Phase 5
handlers must be idempotent per session/event.

## Synchronization procedure

1. Read `UPSTREAM_BASELINE.json`. In the read-only `../workbench` checkout:

   ```bash
   git -C ../workbench log --oneline --first-parent <baseline>..<target>
   git -C ../workbench diff --name-status <baseline>..<target> -- plugin docs/reference CLAUDE.md
   ```

   Upstream lands work as PRs; classify per PR (`--first-parent`), not per commit.

2. For every changed upstream file, classify:
   - **Portable**: templates, barriers, Beads rules, document invariants → apply
     per the file map (Copy/Adapt).
   - **Adaptation required**: skill/agent frontmatter, `sub-agent-prompts.md`,
     hooks, tool names, model names, browser calls → apply the Harness
     differences rules.
   - **Upstream-only**: Claude install docs, `.claude/`, `RELEASING.md`,
     upstream changelog → no action.
   - **Divergent**: touches a D-entry → re-read the entry; port the intent
     through the port behavior, or open a Beads `Decide:` issue if the upstream
     change invalidates the rationale.
3. Create and claim a Beads issue naming the upstream PR range.
4. Port file by file. Never copy a directory over `skills/` or `agents/`.
5. Append one Translation log row per upstream PR.
6. Run the quality gates.
7. Re-read the `--name-status` list; every file must appear in the log or be
   classified upstream-only.
8. Update `baseline_commit` and `ported_on`; commit the port and baseline
   together.

Conflict policy: upstream owns intent; the port owns packaging and runtime
adaptation. Preserve OMP-native improvements with no upstream equivalent. Never
advance the baseline to silence a delta.

## Translation log

Append-only. One row per upstream PR (or commit when unmerged).

| Date | Upstream ref | Classification | Destination files | Decision / notes |
| --- | --- | --- | --- | --- |
| 2026-09-07 | `447a1c6` (v2.6.0) | Initial port | Every file in the file map above | Baseline set at the port target. All `plugin/` skills, agents, hooks, scripts, and reference docs are ported or classified (D8: `create_execution` not ported); repo docs, `CLAUDE.md`, `RELEASING.md`, `.codex/`, `.gitattributes` are upstream-only. Divergences D1–D13 adopted. Verified by tiers 0–2 and the tier 3 cases listed in `docs/evals.md`; dual-provider scenarios (port-plan 7.1–7.3) remain open. |

## Quality gates

Defined in [`evals.md`](./evals.md). Before advancing the baseline:

1. Tier 0 static validation and Tier 1 discovery smoke (`scripts/validate`) pass.
2. Tier 2 extension unit tests pass.
3. Tier 3 cases touched by the sync pass, plus `help-discovery` and
   `create-project`; the full suite before a release.
4. Tier 4 parity judge output is attached to the sync issue and every flag is
   either fixed or logged as a divergence.
5. Install probe from the local marketplace: `/wb:help` resolves;
   `wb-codebase-locator` is listed with the settings template applied, and a
   session whose main model is on the other provider resolves its role alias
   without `task.agentModelOverrides`.

No test asserts skill prose. Behavioral invariants live in the divergence table
and are exercised by Tier 3 scenarios.

## Harness watch list

OMP behaviors this port depends on that are undocumented, contradictory, or
likely to change. Re-verify against `omp://` on every OMP upgrade and before
advancing the baseline.

| ID | Question | Current evidence | Impact if wrong |
| --- | --- | --- | --- |
| P1 | Do `rules/` load from a marketplace-installed plugin? | **Yes on OMP 18.1.11.** An isolated user-scope marketplace install injected `wb-project-structure` and its rule text into `get_state` without `--plugin-dir`. | Re-probe on OMP upgrades; if this regresses, move rules into always-apply skills or switch distribution to `omp plugin link`/npm. |
| P2 | Do plugin extensions attach to subagent sessions (`tool_call`, `tool_result`)? | **Yes on OMP 18.1.11.** A temporary marketplace extension logger observed a distinct child session's `glob` and `yield` events. Each event was observed twice with `claude-plugins` enabled. | Phase 5 handlers must be idempotent per session/event; worker-side guards can observe child activity but cannot assume a single callback. |
| P3 | Are `.claude-plugin/plugin.json#hooks` shell hooks executed by OMP? | **No on OMP 18.1.11.** With upstream installed beside the port and `CLAUDE_ENV_FILE` set to an observed file, session start left the file empty. | D5 remains required; do not ship the upstream shell hooks beside the extension. |
| P4 | Unresolved `@role` alias with empty `modelRoles`: skip, fall through to parent model, or fail preflight? | **Falls through when needed.** With no `smol` mapping, `@smol` first uses its built-in priority chain, then `resolveModelOverrideWithAuthFallback` selected the authenticated parent. A remote trace showed both main and child on `openai-codex/gpt-5.4-mini`. | No trailing `@default` is needed. Keep role mappings recommended for deterministic cross-provider selection. |
| P5 | Default of `skills.enableSkillCommands` | **`true` on OMP 18.1.11**, reported by `omp config get skills.enableSkillCommands --json` in an isolated home. | `/skill:*` remains an available fallback UX; `/wb:*` stays the documented surface. |
| P6 | Does `shake`/`snapcompact` append a `CompactionEntry` and fire `session_compact`? | **Yes in OMP 18.1.11.** Both successful methods converge on `SessionMaintenance.#commitCompactionEntry`, which calls `appendCompaction` and then awaits the `session_compact` extension emit. | Phase 5 can re-anchor from the normal compact event; re-check the shared commit path on OMP upgrades. |
| P7 | Can `task.agentModelOverrides` values carry `:level` suffixes? | **Yes on OMP 18.1.11.** A remote probe configured `openai-codex/gpt-5.4-mini:low`; the child event trace reported that model at `low`. | The settings template may use suffixes when future agent overrides are added. |
| P8 | Do `bash.patterns` deny rules apply under forced subagent `approvalMode: yolo`? | **Yes on OMP 18.1.11.** A remote child received `Blocked by bash pattern: printf phase0-denied` and was aborted. | Read-only agents may retain narrowly required Bash access, but explicit tool minimization remains preferred. |
| P9 | Which install paths load `extensions/workbench.ts`? | **Marketplace install and `omp plugin link` load it on OMP 18.1.11** through the `node_modules` symlink and `package.json#omp.extensions`; an isolated-HOME marketplace install injected `wb-beads-context` on the first turn. Bare `--plugin-dir` does not: the Claude-plugin provider wires only `hooks/pre` and `hooks/post` shell scripts, so the eval runner adds `-e extensions/workbench.ts`. | If marketplace installs stop creating the `node_modules` link, the extension silently disappears while commands still work; re-probe with the `lifecycle-beads-context` prompt after every OMP upgrade. |
| P10 | Does `session_start` fire and can extensions act during it in print and SDK modes? | **Print mode: yes.** `session_start`, `before_agent_start`, `session_stop`, and `session_shutdown` all fired with `--print --no-session`, and `appendEntry`/`exec` worked. **SDK: `createAgentSession` does not emit `session_start` and action methods throw until `initializeExtensions` (from `modes/runtime-init`) runs.** The extension therefore computes Beads context at `session_start` but delivers it through `before_agent_start`'s `message` return, which is turn-synchronous in every mode. | A `sendMessage` from `session_start` races the first prompt in print mode and was never seen by the model; keep first-turn delivery on `before_agent_start`. |
| P11 | Is the shared headless browser (`__omp_worker_daemon_broker` → Chrome for Testing) safe for repeated `page.screenshot` across sessions? | **Fragile on OMP 18.1.11.** A `Page.captureScreenshot` that hangs (observed on a page with an infinite CSS animation, and intermittently on plain static pages) wedges the shared instance for every session until it is killed; after `pkill -f "Chrome for Testing"` the next `browser.open` can fail with `Target.attachToTarget: No target with given id found` until the broker re-syncs. Eval-cell timeouts that force-kill the JS worker mid-CDP call leave the same wedge. | The mockup skills bound screenshots and fall back to presenting the HTML; `create-mockup`/`mockup-iteration` evals can fail on browser state rather than skill behavior. Re-check on OMP upgrades; consider an eval pre-step that restarts the shared browser. |
| P12 | Can the extension enable the advisor for planning skills and disable it for implementation? | **Not on OMP 18.1.11.** `AgentSession.setAdvisorEnabled()` exists and `/advisor on\|off` calls it as a session-scoped override, but neither `ExtensionContext` nor `ExtensionCommandContext` exposes it, and extensions cannot dispatch slash commands. The judgment skills therefore suggest `/advisor on` in their model self-check and the user toggles it. | When OMP exposes a context method (the `compact()` shape), the extension should enable the advisor on `/wb:explore_design` and `/wb:create_tasks` dispatch and restore the prior state afterwards, matching how Amp attaches the oracle to a mode. |

## OMP-native capabilities in use

Not upstream translations; listed so a future sync does not "correct" them back
to upstream form.

- `session.compacting` context injection and `compactionEntry.details.readFiles`
  for re-anchoring inside the summary.
- `session_stop` continue/block for the autonomy and verification contracts.
- Agent `output` schemas, `blocking`, `readSummarize`, `autoloadSkills`.
- Rule `agents:` scoping (`main`/`sub` sentinels) and TTSR `condition`/`scope`
  rules for placeholder and red-flag phrase barriers.
- `pi.appendEntry` active-plan pointer.
- `lsp diagnostics` as required verifier evidence; `ast_grep` for
  `wb-pattern-finder`.
- `hub start` for mockup dev servers.
- `task.softRequestBudget` as the tool-call-ceiling analog; budget-aborted
  workers revived via `hub` to finish the tail.
