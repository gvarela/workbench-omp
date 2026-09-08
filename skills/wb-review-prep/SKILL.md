---
name: wb-review-prep
description: Interactive code review walkthrough using tmux and nvim, pair-programming style. Use when the user says "review", "walk through changes", "explain this diff", "prep for PR", or wants to understand what changed.
---

# Code review prep

Walk through a diff as pair programming: open each change in an nvim pane, give one line of context, wait for questions.

## Helper script

`nvim-helper.sh` in this skill's directory drives tmux and nvim. OMP injects `[Skill directory: <path>]` when this skill loads; use that path for every call below (`<skill-dir>/nvim-helper.sh`). Never hardcode an install location.

Each call is a `bash` invocation subject to the session's approval mode. To avoid a prompt per file, the user can add the helper to `bash.patterns` in their OMP config as an allow entry, or run the session in an approval mode that does not prompt. Do not ask the user to edit any other harness's permission files.

## Setup

1. Initialize the nvim pane:

   ```bash
   <skill-dir>/nvim-helper.sh setup
   # Returns: NVIM_PANE=%123
   ```

   If it reports `Not in a tmux session`, tell the user the walkthrough needs tmux and stop.

2. Get the diff:

   ```bash
   # Default: last commit
   git show HEAD --stat

   # Or the range the user named
   git diff main..HEAD --stat
   ```

3. Parse changes into logical groups: hunks that solve the same problem belong together; test files stay paired with their implementation.

## Start the review

State the problems being solved (one or two at most):

```text
This diff addresses:
1. [Problem A] - files: x.ts, y.ts, x.test.ts
2. [Problem B] - files: z.ts

Total: N files, M logical changes
```

More than two or three problems is a code smell: suggest splitting.

## For each change

1. Open the file at the line:

   ```bash
   <skill-dir>/nvim-helper.sh open src/auth.ts 42
   ```

2. Focus nvim for inspection:

   ```bash
   <skill-dir>/nvim-helper.sh focus
   ```

3. Give one line of context: "Change X/N - [Problem]. [brief description]"
4. Wait for questions. Do not advance until the user does.

## TDD check

For each production code change, verify:

- Corresponding test file changed?
- New code has test coverage?

Flag violations without blocking; the user decides if intentional:

```text
TDD: src/auth.ts changed but src/auth.test.ts unchanged
```

## Navigation

| Command | Action |
| --- | --- |
| `next` | Next logical change |
| `back` | Previous change |
| `skip to [file]` | Jump to specific file |
| `show test` | Open corresponding test file |
| `done` | Wrap up review |

## Conversation style

- One or two lines per response.
- Wait for questions; do not front-load explanation.
- Answer directly, then offer: "want to see the test?"
- Move up or down abstraction layers on request.

## Wrap-up

When the user says `done`:

```text
## Review Summary

**Changes reviewed**: X/Y
**Problems addressed**: [list]

**TDD Status**:
- Changes with tests: N
- Changes without tests: M [list files if any]

**Notes**: [flags raised during review]

Ready for PR? [yes/concerns]
```

## Script reference

```bash
<skill-dir>/nvim-helper.sh status          # Check if an nvim pane exists
<skill-dir>/nvim-helper.sh setup           # Find or create the nvim pane
<skill-dir>/nvim-helper.sh open FILE LINE  # Open file at line
<skill-dir>/nvim-helper.sh focus           # Focus the nvim pane
```

## Code smell flags

| Smell | Response |
| --- | --- |
| >2-3 problems per diff | "Consider splitting this PR" |
| Change doesn't map to stated problem | "This seems unrelated - intentional?" |
| Pattern repeated 3+ times | "Extract helper? (your call)" |
| Large file change, no tests | "Missing test coverage?" |
| Commented-out code added | "Dead code - remove?" |
