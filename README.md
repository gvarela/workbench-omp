# Workbench for OMP

Workbench workflows ported to [oh-my-pi](https://github.com/can1357/oh-my-pi).

## Installation

### From GitHub

```sh
omp plugin marketplace add git@github.com:gvarela/workbench-omp.git
omp plugin install wb@gvarela-workbench-omp
```

Use the SSH form while the repository is private; the `gvarela/workbench-omp`
shorthand clones over HTTPS and needs a token. Upgrade with
`omp plugin upgrade wb`.

The cached clone has no `node_modules`. The extension's Markdown lint report
then uses a `markdownlint` found on `PATH` (`npm i -g markdownlint-cli`) and is
silently skipped when none exists; every other feature works without it.

### From a local checkout (development)

```sh
bun install
omp plugin link "$PWD"
```

A linked plugin reads the working tree directly, so skill and command edits
are live after `/reload-plugins`; extension edits need a session restart.
Do not add the same checkout as a second marketplace while it is linked: both
register the plugin name `wb` and the extension loads twice.

Both paths load `extensions/workbench.ts` through `package.json#omp.extensions`.

The settings template enables OMP's `claude-plugins` discovery provider. This
is required for task agents in a user-scoped install; commands, skills, and
rules are available without it.

Restart OMP after installing or upgrading. Marketplace installs are cached
copies: source changes arrive through `omp plugin upgrade`, not by editing the
cache.

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

All 18 `/wb:*` commands, 22 `wb-*` skills, and ten `wb-*` task agents are
discoverable. Two agents ride the cross-family `review` role: `wb-task-verifier`
is the hard pass/fail gate on every coordinated task, and `wb-oracle` is the
bigger hammer for when a session is stuck or a decision is expensive: say "ask
the oracle" or "@oracle" and the main model spawns it with the question; it
reads, reframes, and recommends, and never writes. Phase 7 dual-provider
scenarios 7.1 and 7.2 pass; see [`docs/port-plan.md`](docs/port-plan.md).
