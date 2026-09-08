# Workbench OMP Port Findings

> Status: one-time analysis (2026-09-05). Corrections from the follow-up review
> (`session_stop` vs `session_shutdown`, isolated agents not revivable,
> `schemaMode` semantics, fallback chains opt-in, per-task tiering, skill
> namespacing) and the permanent translation rules live in
> [`upstream-sync.md`](./upstream-sync.md). Where the two disagree, that
> document wins.

## Executive Summary

Build an OMP-native Workbench sibling rather than running the Claude Code plugin unchanged or rewriting its product concepts from scratch.

The existing Workbench architecture remains valuable:

- research documents describe what exists;
- design documents record what to build and why;
- task documents describe how to build it;
- explicit barriers prevent synthesis from incomplete inputs;
- Beads provides durable cross-session status;
- specialized agents separate locating, analysis, implementation, and verification;
- phase checkpoints preserve human control.

OMP already provides the runtime primitives needed to reproduce and improve that workflow: marketplace plugins, file-backed skills and commands, custom task agents, parallel background tasks, model roles, cross-provider fallback, strict structured output, lifecycle extensions, rules, isolated workspaces, browser automation, and Anthropic/OpenAI authentication.

The required work is primarily an adapter and orchestration port. Claude-specific task syntax, model names, skill metadata, hook contracts, and tool names must be replaced with OMP-native equivalents.

## Scope and Evidence

These findings were produced from:

- the Claude Code Workbench plugin in sibling repository `workbench`;
- OMP runtime documentation for version 18.1.11;
- an isolated temporary OMP marketplace installation and runtime probe.

No port code was created during the review.

### Verified OMP compatibility

The isolated probe established that:

1. OMP accepted the existing `.claude-plugin/marketplace.json` catalog.
2. OMP installed `wb@gvarela-workbench` version `2.6.0`.
3. `skill://create_research` resolved to the existing Workbench skill.
4. OMP discovered the existing custom task agents:
   - `codebase-analyzer`
   - `codebase-locator`
   - `pattern-finder`
   - `product-behavior-analyzer`
   - `research-validator`
   - `task-verifier`
   - `task-worker`
5. An OpenAI main session spawning `codebase-locator` still attempted to use `anthropic/claude-haiku-4-5`, because the current agent definition hardcodes `model: haiku` in `workbench/plugin/agents/codebase-locator.md`.
6. An OMP `task.agentModelOverrides` setting rerouted that agent to an OpenAI model successfully.

The current plugin is therefore discoverable, but discovery is not equivalent to correct provider-neutral runtime behavior.

## Compatibility Assessment

| Workbench concern | Reuse potential | OMP-native change |
| --- | --- | --- |
| Research/design/tasks document separation | High | Preserve; move compact invariants into rules |
| Templates and reference documents | High | Update host-specific paths and invocation wording |
| Beads durable status | High | Make the coordinator own status transitions |
| Marketplace catalog | High | Add an OMP-native marketplace and package manifest |
| Skill prose | Medium-high | Replace Claude task, tool, and model syntax |
| `/wb:*` command UX | Medium | Add OMP `commands/` wrappers |
| Custom agents | Medium | Rewrite frontmatter for the OMP agent contract |
| Subagent orchestration | Low | Replace `Task({...})` with OMP `task` batches |
| Model routing | Low | Replace model literals with role aliases |
| Claude shell hooks | Low | Implement a small TypeScript extension |
| Playwright MCP calls | Low | Use OMP's native browser runtime |
| `CLAUDE_PLUGIN_ROOT` scripts | Low | Resolve assets relative to the OMP package |

## Existing Workbench Strengths to Preserve

### Document boundaries

The current repository consistently separates:

- `research.md`: facts about the current state;
- `design.md`: decisions, rationale, scope, and success criteria;
- `tasks.md`: implementation sequence and verification;
- `thoughts/`: exploratory material that is not yet a formal decision.

This separation is the core product behavior and should remain runtime-independent.

### Explicit barriers

The research, design, planning, implementation, and validation skills use barriers before:

- acting on partially read context;
- synthesizing before all research agents return;
- writing documents with placeholder values;
- declaring a phase complete before automated and manual verification.

OMP supports these barriers naturally, but asynchronous task delivery means the port must explicitly wait for every background job and then read each `agent://` result before synthesis.

### Specialized agents

The current task-agent roles are useful semantic boundaries. Preserve their intent while renaming them with a `wb-` prefix to avoid OMP's exact-name collision domain.

Recommended roles:

- `wb-codebase-locator`
- `wb-codebase-analyzer`
- `wb-pattern-finder`
- `wb-product-analyzer`
- `wb-research-validator`
- `wb-task-worker`
- `wb-task-verifier`

### Durable Beads state

Beads should remain the durable source of truth across sessions. OMP's native todo list serves a different purpose and should not be prohibited outright.

The port should define the boundary as:

> Beads is the sole durable project-status authority. OMP todos may represent the active turn's execution sequence but never replace, close, or contradict Beads issues.

#### OMP integration choice

Workbench does not depend on the Beads Claude Code plugin. That plugin is a
Claude-specific command, skill, and lifecycle wrapper around the same `bd` CLI;
its own documentation recommends direct CLI operation to avoid MCP schema
overhead. Beads 1.1.0 has setup recipes for Claude, Codex, Gemini, Copilot,
OpenCode, and other hosts, but no OMP recipe.

Two Pi packages are available but do not fit the core Workbench contract:

- [`pi-beads-extension`](https://pi.dev/packages/pi-beads-extension) 0.1.0
  injects `bd prime`, adds `/beads:*` prompt aliases, and replaces compaction
  through Pi's model API. It overlaps Workbench's command and compaction policy,
  and adds another prompt owner without adding hierarchy enforcement.
- [`@soleone/pi-tasks`](https://github.com/Soleone/pi-tasks) 0.5.0 adds a useful
  human TUI and several task backends, but its Beads adapter explicitly exposes
  neither hierarchy nor dependency editing. Workbench requires both for
  epic/milestone/task graphs and ready-wave execution.

OMP 18.1.11 can load packages declaring legacy `pi.extensions`, but compatibility
is a bridge rather than a reason to add a redundant runtime dependency. The port
will use the installed official `bd` CLI directly and implement the small
host-specific lifecycle seam in `extensions/workbench.ts`: mode detection,
bounded `bd prime` injection, compaction re-anchoring, and shutdown drift
reporting. It will not expose a second Beads tool schema, install Claude assets,
or let a generic task UI mutate Workbench's coordinator-owned hierarchy.

Beads 1.1.0 also changed the meaning of `bd q`: it quick-creates an issue rather
than querying state. Workbench read paths therefore use explicit
`bd list --all -n 0 --json`, `bd show <id> --json`, `bd ready --json`, and
`bd blocked --json` commands. Read-only workflows explicitly prohibit `bd q`.

## Required Runtime Adaptations

### Replace Claude `Task({...})` calls

Existing supporting files use Claude-oriented calls such as:

```javascript
Task({
  description: "Analyze implementation",
  prompt: "...",
  subagent_type: "codebase-analyzer",
  model: "sonnet"
})
```

OMP uses one batch call with shared context and one item per independent agent:

```json
{
  "context": "# Goal\nDocument current behavior.\n# Constraints\nRead-only; facts only.\n# Contract\nReturn evidence-backed findings.",
  "tasks": [
    {
      "name": "ImplementationAnalyzer",
      "agent": "wb-codebase-analyzer",
      "task": "Analyze the specified implementation and cite exact file locations. Do not modify files."
    }
  ]
}
```

Key differences:

- OMP requires `context` for batch task calls.
- The assignment field is `task`, not `prompt`.
- The agent field is `agent`, not `subagent_type`.
- OMP's task wire does not expose a per-call `model` field.
- Independent items should be placed in one `tasks[]` fan-out.
- Asynchronous results must be joined before synthesis.

### Rewrite agent frontmatter

Current agents contain Claude-specific metadata such as:

```yaml
tools: Read, Grep, Glob, Bash(ls:*)
model: sonnet
effort: medium
skills: [tdd-discipline]
maxTurns: 60
```

OMP-native agents should use:

```yaml
tools: [read, grep, glob]
model: ["@task"]
thinking-level: high
autoloadSkills: [wb-tdd-discipline]
read-summarize: false
```

Required changes:

- use lowercase OMP tool names;
- remove Claude command restrictions such as `Bash(ls:*)`;
- use `thinking-level` or `thinking`, not `effort`;
- use `autoloadSkills`, not `skills`;
- remove `maxTurns`; the runaway bound is session-level `task.softRequestBudget` / `task.maxRuntimeMs`;
- use model roles instead of provider-specific family names;
- set `read-summarize: false` for agents that must inspect complete source.

### Make full reads explicit

Workbench frequently requires complete reads. OMP may structurally summarize parseable code on a bare read.

When exact source is required, agents must either:

- read `path/to/file.ts:raw`;
- read explicit complete line ranges; or
- declare `read-summarize: false` in the agent definition.

This affects agents that quote code: analyzers, pattern-finder, research validator, and task verifier. Markdown is never summarized, so planners reading `research.md`/`design.md` do not need it.

### Add command wrappers

OMP exposes discovered skills through `/skill:<name>` only when `skills.enableSkillCommands` is on. Preserve the existing user interface by shipping commands such as:

```text
commands/create_research.md  -> /wb:create_research
commands/create_design.md    -> /wb:create_design
commands/create_tasks.md     -> /wb:create_tasks
```

OMP prefixes marketplace commands with the plugin name. A plugin named `wb` therefore turns `commands/create_research.md` into `/wb:create_research`. `omp plugin link` installs get no prefix. Every user-invocable upstream skill gets a wrapper, including `help`, `create_mockup`, `mockup-iteration`, `review-prep`, `research-validation`, `create_product_research`, and `validate_project`.

Each command should remain thin:

1. preserve `$ARGUMENTS`;
2. direct the model to the corresponding `skill://` resource;
3. identify the workflow invocation and arguments;
4. avoid duplicating the skill body.

### Port background disciplines to rules

Claude `user-invocable: false` has no OMP equivalent; `disable-model-invocation` is honored (normalized to `hide`). Skills also accept `globs` and `alwaysApply`.

Recommended mappings:

| Current capability | OMP form |
| --- | --- |
| `project-structure` | Small always-apply rule |
| `tdd-discipline` | Hidden skill autoloaded by the worker agent |
| `doc-adherence` | Skill with `globs: ["docs/plans/**"]`, plus a TTSR red-flag rule and `session.compacting` summary injection |
| `verification-before-completion` | Rule scoped `agents: [main, wb-task-worker]`; `session_stop` check in the main session only (the hook never fires in subagents) |
| `status-sync` | Remains an interactive skill; the extension emits a `session_shutdown` notice and never writes frontmatter |

Avoid injecting every long discipline into every session. Use agent scoping, rulebook descriptions, and skill autoloading to keep context bounded.

### Replace Claude hooks with an extension

The current plugin manifest invokes shell hooks using `CLAUDE_PLUGIN_ROOT`, `CLAUDE_ENV_FILE`, and Claude lifecycle event names.

Create one small OMP TypeScript extension with these responsibilities:

| Workbench behavior | OMP extension event |
| --- | --- |
| Detect Beads state | `session_start`; publish via namespaced `appendEntry` (no env-injection channel exists) |
| Re-anchor after compaction | `session.compacting` (inject plan dir into the summary) and `session_compact`, `session_tree`, `session_switch` |
| Observe Markdown writes | `tool_result` for `write`, `edit`, `apply_patch` |
| Check Beads drift at session end | `session_shutdown` (`session_stop` fires every turn and would nag) |
| Autonomy and verification contract | `session_stop` continue/block, main session only |

Do not automatically run Markdown `--fix` after an OMP hashline edit. An external formatter can invalidate OMP's file snapshot and make a subsequent anchored edit stale. Prefer a non-mutating lint result or an explicit model-invoked fix.

### Replace Playwright MCP tool names

The current mockup workflow names Playwright MCP tools directly. The OMP port should use the native browser runtime:

- `browser.open`
- `tab.observe`
- direct click/type/fill helpers
- `tab.screenshot`
- `browser.close`

This removes a separate MCP dependency and matches OMP's required visual-verification path.

## Provider-Neutral Model Strategy

Workflow files should express workload roles rather than model brands.

Routing ships in agent frontmatter (`model: ["@smol"]`, `["@task"]`, `["@slow", "@task"]`); a plugin cannot ship settings. Concrete models are user configuration:

```yaml
modelRoles:
  smol: <fast-low-cost-model>
  task: <implementation-model>
  plan: <architecture-model>
  slow: <deep-review-model>
  review: <opposite-family-review-model>   # custom role; do not reuse `advisor`
```

`task.agentModelOverrides` is optional per-user tuning that takes precedence over frontmatter. Per-task worker tiering uses three worker agents (`wb-task-worker-smol`, `-task`, `-slow`) rather than one `@task` worker; see `upstream-sync.md` D1. Users select models through `/model` (Roles view) or `omp models`; OpenAI OAuth is provider `openai-codex`.

### Example mixed-provider deployment

One effective split is:

- planning and design main session: Anthropic subscription OAuth;
- implementation workers: OpenAI Codex OAuth;
- validation agents: Anthropic;
- opposite-family reviewer: custom `review` role.

The inverse is equally valid. The Workbench workflow should not change when role assignments change.

### Cross-provider fallback

OMP fallback is opt-in: `retry.fallbackChains` defaults to `{}`, is keyed by role or `provider/model` (no per-agent key), and reverts per `retry.fallbackRevertPolicy`. Usage-limit errors first rotate credentials across accounts. The recommended settings template should define chains for:

- Anthropic to OpenAI fallback when an Anthropic quota window is exhausted;
- OpenAI to Anthropic fallback when an OpenAI quota window is exhausted.

Model-diversity review comes from the `review` role or per-agent `advisor:` frontmatter, not from fallback.

## OMP-Native Execution Improvements

### Execute Beads-ready waves

The current coordinated workflow spawns workers one at a time. OMP can execute every collision-free `bd ready` wave concurrently, bounded by `task.maxConcurrency`:

1. The coordinator reads ready issues for the active phase.
2. It excludes tasks with file overlap or unmet non-Beads constraints.
3. It claims the selected wave.
4. It launches one task batch containing one worker per independent task.
5. It waits for every worker result.
6. It launches verification.
7. It closes only tasks that pass.
8. It reads the next ready wave.

The task planner already models file overlap as a dependency. Preserve that rule so concurrent workers do not edit the same file.

### Make the coordinator own Beads transitions

The current task worker claims and closes its issue before independent verification. This produces an unsafe state: a verifier can fail work that Beads already records as closed.

The OMP port should use this ownership model:

- coordinator claims the issue;
- worker does not mutate Beads;
- worker returns implementation evidence;
- verifier checks requirements, tests, and scope;
- coordinator closes the issue only after a verified pass;
- failed or blocked work remains open, in progress, or explicitly blocked.

Workers never run `bd`, so shared-database contention disappears without isolated workspaces. Workers stay non-isolated so a budget-aborted worker can be revived through `hub` to finish its slice.

### Use strict structured results

Replace Markdown marker parsing such as `### Status: PASS` with OMP output schemas.

Worker result shape:

```json
{
  "status": "completed",
  "filesChanged": [],
  "testsChanged": [],
  "verificationCommands": [],
  "observedResults": [],
  "blockers": []
}
```

Verifier result shape:

```json
{
  "status": "pass",
  "requirements": [],
  "testResults": [],
  "scopeViolations": [],
  "findings": []
}
```

Set `schemaMode: strict` on every worker and verifier item. `schemaMode` validates the child's `yield` payload OMP-side and is independent of provider structured-output support; any validation error is treated as FAIL. Ship the shapes as agent frontmatter `output` so the coordinator does not repeat them.

### Escalation and worker reuse

Non-isolated completed agents stay reachable through `hub`, `agent://`, and `history://`; isolated agents are torn down and cannot be revived.

- Verifier FAIL (implementation defect): spawn one `wb-task-worker-slow` with the exact finding. A second FAIL goes to the checkpoint blocking list. No same-tier retry (upstream rebaseline decision D1).
- Verifier FAIL (plan defect): file a `Design revision:` issue, block dependents, halt the phase.
- Worker aborted on `task.softRequestBudget` (truncation, not failure): `hub send` the remaining slice to the same worker; it retains context.

## Proposed Repository Layout

```text
workbench-omp/
├── .omp-plugin/
│   └── marketplace.json
├── package.json
├── commands/                      # one wrapper per user-invocable skill (18)
│   ├── help.md
│   ├── create_project.md
│   ├── create_research.md
│   ├── create_product_research.md
│   ├── research-validation.md
│   ├── explore_design.md
│   ├── create_design.md
│   ├── create_tasks.md
│   ├── implement_tasks.md
│   ├── implement_coordinated.md
│   ├── validate_execution.md
│   ├── validate_project.md
│   ├── update_status.md
│   ├── create_handoff.md
│   ├── resume_handoff.md
│   ├── create_mockup.md
│   ├── mockup-iteration.md
│   └── review-prep.md
├── skills/
│   ├── wb-<workflow>/             # one per upstream workflow skill
│   ├── wb-tdd-discipline/         # hidden, autoloaded by workers
│   ├── wb-doc-adherence/          # globs: docs/plans/**
│   └── wb-status-sync/
├── agents/
│   ├── wb-codebase-locator.md
│   ├── wb-codebase-analyzer.md
│   ├── wb-pattern-finder.md
│   ├── wb-product-analyzer.md
│   ├── wb-research-validator.md
│   ├── wb-task-worker-smol.md
│   ├── wb-task-worker-task.md
│   ├── wb-task-worker-slow.md
│   └── wb-task-verifier.md
├── rules/
│   ├── wb-project-structure.md    # alwaysApply
│   ├── wb-verification.md         # agents: [main, wb-task-worker-*]
│   └── wb-red-flags.md            # TTSR condition rule
├── extensions/
│   └── workbench.ts
├── scripts/
│   └── lint
└── docs/
    └── reference/
```

The package manifest should declare the extension through `package.json#omp.extensions`. Conventional `skills/`, `commands/`, `rules/`, and `agents/` directories can then use OMP's plugin discovery.

## Delivery Plan

> Superseded by [`port-plan.md`](./port-plan.md), which adds a probe phase and
> lands agents before document workflows. Kept for the original rationale.

### Phase 1: Package and command surface

- Create the OMP marketplace catalog.
- Add the package manifest.
- Add thin `/wb:*` command wrappers.
- Port `/wb:help` first so installed capabilities are self-documenting.

### Phase 2: Document workflows

Port the provider-independent workflow stages:

- `create_project`
- `create_research`
- `explore_design`
- `create_design`
- `create_tasks`
- `update_status`
- handoff creation and resume

Preserve document boundaries and barriers before changing execution behavior.

### Phase 3: Agents and model roles

- Add OMP-native agent definitions.
- Use lowercase tools.
- Add `read-summarize: false` where exact source is required.
- Use `@smol`, `@task`, `@plan`, and `@slow` roles.
- Add structured output contracts.

### Phase 4: Execution and verification

- Port direct implementation.
- Port coordinated implementation using ready-wave batches.
- Move Beads ownership to the coordinator.
- Close issues only after verification.
- Support agent follow-up through `hub`.

### Phase 5: Lifecycle extension

- Add compaction recovery.
- Add Beads stop checks.
- Add non-mutating Markdown lint reporting.
- Keep the extension small because OMP extensions execute in-process without isolation.

### Phase 6: UI workflows

- Port mockup creation and iteration to the native browser runtime.
- Port review preparation without relying on `CLAUDE_PLUGIN_ROOT`.

### Phase 7: Dual-provider verification

Verify at least these scenarios:

1. Anthropic main session with OpenAI workers.
2. OpenAI main session with Anthropic workers.
3. Opposite-family verifier and advisor.
4. One provider unavailable or rate-limited with fallback enabled.
5. Compaction followed by exact plan-document re-anchoring.
6. Handoff and resume in a fresh session.
7. Beads task remains open after worker completion but before verifier pass.
8. Independent ready tasks run concurrently without file collisions.
9. Mockup workflow opens the real surface and records a screenshot.

## Recommendation

Implement an OMP-native `workbench-omp` package while treating the Claude repository as a read-only semantic reference.

Do not begin with a shared dual-runtime refactor. First establish a correct OMP implementation with native commands, agents, extensions, and model roles. Shared assets can be extracted later after both runtimes have stable contracts and the genuinely portable content is clear.

A temporary compatibility shim could run the existing plugin with `task.agentModelOverrides`, but it would not resolve command namespacing, hook lifecycle, agent tool declarations, skill metadata, browser integration, structured verification, or Beads ownership. It is useful for experiments, not as the maintained port.
