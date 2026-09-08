# Workbench for OMP

Workbench workflows ported to [oh-my-pi](https://github.com/can1357/oh-my-pi).

## Installation

Install dependencies in the checkout first; the extension's Markdown lint
report and `scripts/lint` use `node_modules/.bin/markdownlint`, and marketplace
installs copy the checkout (including `node_modules`) into OMP's plugin cache:

```sh
bun install
omp plugin marketplace add "$PWD"
omp plugin install wb@gvarela-workbench-omp
```

For development against a live checkout use `omp plugin link "$PWD"` instead of
the marketplace install; linked plugins read the working tree directly. Both
paths load `extensions/workbench.ts` through `package.json#omp.extensions`.

The settings template enables OMP's `claude-plugins` discovery provider. This
is required for task agents in a user-scoped install; commands, skills, and
rules are available without it.

Restart OMP after installing, upgrading, or editing the plugin. Marketplace
installs are cached copies: rerun `omp plugin install` (or use a linked install)
to pick up source changes. `/reload-plugins` refreshes skills and slash commands
of a linked install but never reloads the extension module.

Use `/wb:help` to verify command discovery.

## What the extension does

`extensions/workbench.ts` runs in every session of a repository where the
plugin is enabled:

- On session start it detects the Beads mode (`git`, `stealth`, or `none`),
  and when `.beads/` exists runs `bd prime` with a 5 s budget and injects the
  trimmed output plus `Beads mode: <mode>` as hidden context for the first
  turn.
- On compaction, tree navigation, and resume it re-anchors the model on the
  newest incomplete `docs/plans/*/tasks.md` (or the plan named by the last
  `/wb:` command).
- After every Markdown write or edit it appends `markdownlint` findings to the
  tool result using the repository's own markdownlint config when present,
  otherwise the plugin's. It never modifies files.
- On shutdown in git mode it warns when `.beads/` has uncommitted changes. It
  never runs `bd` there.
- When a main-session turn ends on a promise, plan, or open question that is
  not a human checkpoint, it continues the turn once or twice with the
  autonomy contract.

## Configuration

Copy [`docs/reference/settings-template.yml`](docs/reference/settings-template.yml)
into the applicable global or project OMP `config.yml` and adjust the concrete
model ids to what you have authenticated. The role split is the stable part:

| Role | Used by | Template (Anthropic Max + OpenAI Plus, 2026-09) |
| --- | --- | --- |
| `default` | main session, coordinator, planning skills | `anthropic/claude-sonnet-5` |
| `smol` | locator, pattern finder, mechanical workers | `anthropic/claude-haiku-4-5:high` |
| `task` | standard workers, analyzers | `anthropic/claude-sonnet-5:medium` |
| `slow` | cross-cutting work, the single escalation fix worker | `anthropic/claude-fable-5-1:high` |
| `review` | `wb-task-verifier`, reviews: always the other provider family | `openai-codex/gpt-5.6-sol:xhigh` |

The higher-quota subscription carries volume; the lower-quota one carries the
one-call-per-task verification. `retry.usageAwareFallback` with per-role
`fallbackChains` keeps the verifier cross-family until that quota is inside the
reserve, then falls to the strongest same-family model. Swap the two families
if your subscriptions are the other way round. Effort is part of the tier, so
`task.enableEffort` stays off.

## Development

Run `scripts/validate` (static checks and discovery smoke) and
`bun test evals/unit` before committing. Live scenario evals cost tokens and
run through `scripts/eval`; see [`docs/evals.md`](docs/evals.md). Markdown
linting is available through `scripts/lint`.

All 18 `/wb:*` commands, 22 `wb-*` skills, and nine `wb-*` task agents are
discoverable. Phase 7 (dual-provider verification and the upstream baseline)
is outstanding; see [`docs/port-plan.md`](docs/port-plan.md).
