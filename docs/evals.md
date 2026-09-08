# Evaluating the port

Principle: assert on artifacts and traces, never on prose. Model runs are
nondeterministic; files, Beads state, spawned-agent names, and schema-validated
outputs are not. Four tiers, cheapest first. Each tier gates the next.

| Tier | What | Cost | When |
| --- | --- | --- | --- |
| 0 | Static validation | seconds, no model | every commit |
| 1 | Discovery smoke via SDK | seconds, no model | every commit |
| 2 | Extension unit tests | seconds, no model | every commit |
| 3 | Live scenario evals | tokens, minutes | nightly, pre-release, before advancing the upstream baseline |
| 4 | Sync-time parity judge | tokens, cheap | every upstream sync; flag-only |

Tooling is Bun throughout: OMP is Bun-native and the SDK
(`@oh-my-pi/pi-coding-agent`) is a TypeScript package. No Python.

## Layout

```text
evals/
├── config.yml              # every role mapped to the cheapest available model
├── config.swap.yml         # Phase 7 overlay: roles swapped across providers (not yet consumed by run.ts)
├── cases/<name>.json       # prompt, fixture, timeout, assertions
├── fixtures/<name>/        # snapshot repos; .git and .beads created at run time
├── isolated-home.ts        # temp HOME with snapshotted credentials for every OMP child process
├── run.ts                  # tier 3 runner
├── compaction-reanchor.ts  # tier 3 special case driven through the SDK
└── unit/                   # tier 2 bun tests
scripts/validate            # tiers 0 and 1
scripts/eval                # tier 3 entry: --list, --validate-cases, --dry-run, --case <name|all>
bun test evals/unit         # tier 2
bun evals/compaction-reanchor.ts   # tier 3 compaction smoke
```

Results go to `.artifacts/evals/<timestamp>/<case>/`: `trace.jsonl`,
`stderr.log`, `final.md`, `workspace-after/`, `summary.json`. Never run a case
inside this repository or `../workbench`.

## Tier 0: static validation

`scripts/validate` fails on:

1. Source-harness constructs anywhere in `skills/`, `agents/`, `commands/`,
   `rules/`:

   ```text
   Task\(\{ | subagent_type: | \b(haiku|sonnet|opus|fable)\b | CLAUDE_ |
   mcp__ | allowed-tools: | user-invocable: | ^effort: | maxTurns: |
   Bash\( | BEADS_MODE | argument-hint:
   ```

2. Agent frontmatter that violates the OMP contract
   (`omp://task-agent-discovery.md` §Agent definition shape): missing `name`
   or `description`; `tools` not lowercase or unknown; `model` entries that
   are not `@role` aliases; `autoloadSkills` entries with no
   `skills/<name>/SKILL.md`; `output` that is not valid JSON Schema.
3. A `commands/*.md` whose `skill://` target does not exist.
4. An upstream workflow skill listed in `docs/upstream-sync.md` file map with
   no destination directory.
5. `scripts/lint --all` failures.

## Tier 1: discovery smoke

A Bun script (invoked by `scripts/validate`) re-executes itself under an
isolated HOME, injects this checkout as a `--plugin-dir` root exactly as the
CLI does, and asserts, without prompting a model:

- The discovered set is exactly: 18 `wb:*` commands named by the plugin-dir
  provider (no prefix is fabricated), every `wb-*` skill in the file map with
  `wb-reference`, `wb-task-worker-contract`, and `wb-tdd-discipline` hidden,
  and ten `wb-*` agents.
- Normalized agent fields: `readSummarize === false` on
  `wb-codebase-analyzer`, `wb-pattern-finder`, `wb-product-analyzer`,
  `wb-research-validator`, `wb-task-verifier`, `wb-oracle`; `blocking` on
  `wb-task-verifier` and `wb-research-validator`; `output` on all three
  `wb-task-worker-*` and `wb-task-verifier`; no concrete model ids.
- `extensionsResult` shows `extensions/workbench.ts` loaded with no errors
  and the expected event registrations.
- Rules discovered include `wb-project-structure`, `wb-verification`,
  `wb-red-flags`; `wb-verification` normalizes to
  `agents: [main, wb-task-worker-*]`.

This tier is where watch-list items P1, P3, and P5 in `docs/upstream-sync.md`
are answered once and then guarded.

## Tier 2: extension unit tests

`extensions/workbench.ts` is the only code with logic. `bun test evals/unit`
drives it with a fake `pi`/`ctx` and a temp directory:

| Behavior | Assertion |
| --- | --- |
| Plan detection | newest `docs/plans/*/tasks.md` with `status != complete`; ambiguous → candidate list; none → no message |
| `session.compacting` | returns `context[]` naming the active plan dir and the paraphrase warning |
| `session_compact`, `session_tree`, `session_switch` | emit the re-anchor message; `session_compact` also after `/handoff` |
| `session_shutdown` | drift notice on dirty `.beads/`; silent in stealth mode; never spawns `bd` |
| `tool_result` lint | fires for `write`, `edit`, `apply_patch` on `.md` only; file content unchanged after the handler |
| `session_stop` | blocks when the last paragraph is a plan, question, or promise; stops continuing at the cap |
| Beads mode | detected on `session_start`, persisted via `appendEntry`, read back on later events |

## Tier 3: live scenario evals

Each case runs in a fresh temporary repository under an isolated HOME
(`evals/isolated-home.ts` snapshots `~/.omp/agent/{agent.db,models.db}` so
credentials resolve while no user plugins are visible). The checkout is
staged as a `--plugin-dir` root for commands, skills, and rules, `agents/` is
copied into the scratch `.omp/agents` (user-scope plugin-dir agents are gated
behind the opt-in `claude-plugins` provider), and `-e extensions/workbench.ts`
loads the extension module: the Claude-plugin provider never loads TS
extension modules, while marketplace and `omp plugin link` installs load them
through `package.json#omp.extensions` (watch-list P9). OMP runs with
`--print --no-session --approval-mode yolo`; set `OMP_BIN` to test another
binary. A watchdog kills a case at `timeoutSeconds + 30`; every case writes
`summary.json` (`status`, `reason`) and `--case all` aggregates and exits 1 on
any failure. Use the runner rather than invoking OMP in this checkout:

```bash
scripts/eval --case help-discovery
```

### Case file

```json
{
  "name": "help-discovery",
  "fixture": "empty",
  "prompt": "/wb:help workflow commands",
  "timeoutSeconds": 120,
  "assert": {
    "commands": [
      "wb:create_project",
      "wb:implement_tasks",
      "wb:validate_execution"
    ],
    "finalContains": [
      "/wb:create_project",
      "/wb:implement_tasks",
      "/wb:validate_execution"
    ]
  }
}
```

Case keys: `fixture`, `prompt`, `timeoutSeconds`, optional `beads.issues`
seeding (`id`, `title`, `type`, `parent`, `status`), and `assert` with
`commands`, `finalContains`, `workspace.{files,missing,contains,absent,frontmatter,citations}`,
`trace.{singleTaskBatchAgents,singleTaskBatchSize,adHocTaskContains,taskBatches,maxTaskCalls,closeAfterVerifierPass,customMessages,forbiddenTools}`,
and `beads.{titles,hierarchy,exactTotal,contains}`. Task items without an
`agent` count as `task`. `customMessages` counts distinct extension-injected
custom messages by type (P2 double-emit guard). `closeAfterVerifierPass`
pairs each `bd close <id>` with a schema-valid `wb-task-verifier` pass whose
prompt cites that id.

### Assertion sources

- **Discovery**: command files from the explicit plugin root must match the
  case's `commands` list before a model is invoked.
- **Final message**: `finalContains` checks stable command tokens or checkpoint
  outcomes, never exact prose.
- **Workspace** (Phase 3 onward): files exist, frontmatter fields are present,
  forbidden text is absent, `file:line` citations resolve, and Beads issues
  match required prefixes and states.
- **Trace** (Phase 3 onward): expected agents, task batches, output schemas, and
  forbidden tool calls are checked from JSON events.

### Fixtures

Snapshot per phase so later cases do not pay for earlier ones:

| Fixture | Contains | Cases |
| --- | --- | --- |
| `empty` | README only | discovery and project creation |
| `research-target`, `researched`, `design-input`, `planning-input` | successive research/design/planning states | Phase 3 document workflows |
| `status-input`, `resume-input` | mapped task state and handoff inputs | status and resume workflows |
| `execution-input` | one ready implementation task | `implement-tasks-checkpoint`, `lifecycle-beads-context`, compaction smoke |
| `coordinated-input` | two file-disjoint ready tasks | `implement-coordinated-wave` |
| `retry-failure-input`, `plan-defect-input` | resumed verifier failure states | coordinated failure branches |
| `validated-input` | implemented source/tests and closed mappings | `validate-execution-implemented` |

Fixtures hold no `.git` or `.beads`; `run.ts` initializes both and seeds issues
from each case's `beads.issues` declaration.

### Special cases

- **Checkpoints**: headless cases state that confirmation is unavailable or
  not confirmed, then assert the phase milestone remains open. No model may
  infer approval from successful automation.
- **Compaction re-anchoring**: `bun evals/compaction-reanchor.ts` creates an
  SDK session with the extension, dispatches a `/wb:` prompt, compacts, and
  asserts the `wb-active-plan` entry, one `wb-reanchor` message, and that the
  next turn can quote `Active plan:` plus the paraphrase warning.
- **Beads context**: `lifecycle-beads-context` forbids every tool and asserts
  the model quotes `Beads mode: git` from the first-turn injected `bd prime`
  context.
- **Stop check**: the `session_stop` continuation is unit-tested against the
  real event shape; forcing a live model to end on a promise is not
  deterministic, so no live case exists.
- **Coordinated execution**: the wave case asserts two file-disjoint workers
  share one batch, verifiers share a later batch, and `bd close` follows
  schema-valid pass evidence. Separate resumed cases prove second-verifier
  failure enters the blocking list and plan-defect evidence files a
  `Design revision:` issue before halting.
- **Cross-provider** (Phase 7): rerun `create-research` and
  `implement-coordinated-wave` with `config.swap.yml` layered over `config.yml`;
  the runner does not consume the overlay yet.
- **Flakiness**: no repeat/margin support; a case that fails on prose variance
  is fixed by replacing the prose assertion with a workspace, Beads, or trace
  assertion, not by retrying.

### Cost controls

`evals/config.yml` maps every role to the cheapest available model;
`--max-time` per case; `task.softRequestBudget` lowered in the overlay so
truncation paths are exercised cheaply.

## Tier 4: sync-time parity judge

At each upstream sync, for every file classified Adapt in the file map, a
one-shot `completion(model="smol", schema=...)` receives the upstream text and
the ported text and reports whether each numbered step, barrier, and `bd`
command survives. Output is a flag list attached to the sync Beads issue. Never
blocking; it catches dropped steps a diff review misses.

## Not automated

- Mockup visual quality. `preview-v00N.png` existence and non-trivial size are
  asserted; layout is not.
- Real quota-exhaustion fallback (scenario 4). Requires a provider stub;
  verified manually with a deliberately exhausted account.
- `review-prep` tmux/nvim interaction.
- `resume_handoff` in a genuinely fresh shell across machines. Scriptable but
  slow; pre-release manual scenario.

## When each tier lands

| Tier | Lands with |
| --- | --- |
| 0 | Phase 0 scaffold |
| 1 | Phase 0, as the probe harness; grows with every phase |
| 2 | Phase 5 extension |
| 3 | `help-discovery` and `create-project` in Phase 1; one case per subsequent phase |
| 4 | First upstream sync after the baseline is set |
