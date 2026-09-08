# Execution validation report

```text
# Validation report: [project]

Overall: PASS | PASS WITH ISSUES | FAIL

## Authoritative plan state
- Beads: [mapped task and milestone states]
- Scope validated: [phases or tasks]
- Manual checks: [confirmed, pending, failed, or unavailable]

## Task requirements
### [task id]: [title]
- [criterion]: PASS | FAIL — [file:line and executable evidence]
- Scope: PASS | FAIL — [evidence]

## Automated verification
- `[exact command]` — PASS | FAIL — [exit status and relevant output]

## Regression and pattern review
- [affected path or named convention]: PASS | FAIL | NOT EXECUTED — [evidence]

## Deviations and blockers
- [none, or exact plan/implementation mismatch with impact]

## Manual verification remaining
1. [only checks explicitly present in the plan]

## Verdict
[What is established, what is not, and why the overall status follows.]
```

Rules:

- `PASS` requires every mapped requirement and exact automated command to pass with no blocking deviation. Pending plan-defined manual checks remain explicit; they do not become fabricated passes.
- `PASS WITH ISSUES` requires all core behavior and commands to pass; every issue must be concrete, non-blocking, and evidenced.
- `FAIL` applies when planned behavior is missing or wrong, a required command fails, a material regression or scope violation exists, or Beads claims completion contradicted by implementation.
- Do not add generic deployment, documentation, coverage, performance, error-handling, or future-improvement recommendations.
