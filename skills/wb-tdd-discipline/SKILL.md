---
name: wb-tdd-discipline
description: Enforces behavior-first Red, Green, Refactor implementation for production-code changes.
hide: true
---

# Test-driven development

Write the behavioral test first. Observe the correct failure. Implement the minimum production change that makes it pass.

## Iron law

```text
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Code written before its test is deleted and the work restarts from the failing test.

No exceptions:

- Do not keep it as reference.
- Do not adapt it while writing the test.
- Delete means delete.

A test must earn permanent maintenance cost. It must assert an observable contract and fail for a plausible defect. Do not add tests that only assert wiring, field copies, mock echoes, incidental defaults, source text, or that code does not throw.

The law names a failing test, not a specific harness. When no automated harness in the repository can exercise the changed surface, the failing check is the smallest executable smoke scenario that fails before the change and passes after it; the worker result reports that scenario as the evidence and states why no durable test was possible. A scenario that was not run before the change is not Red.

## Red, Green, Refactor

### Red: establish the missing behavior

1. Write one minimal test for the required behavior, boundary, invariant, transition, precedence rule, or real error.
2. Run that specific test.
3. Confirm it fails because the requested behavior is absent, not because of syntax, setup, or an unrelated defect.
4. Record the command and relevant failure.

A test that passes immediately is not evidence. Correct the test or establish that the behavior already exists before changing production code.

### Green: implement only the requirement

1. Make the smallest maintainable production change that satisfies the failing contract.
2. Run the focused test and observe it pass.
3. Run directly related regression checks when the change can affect them.

Do not add adjacent features, speculative validation, compatibility aliases, or unrelated refactors.

### Refactor: improve structure without changing behavior

After Green only:

- Remove duplication introduced by the change.
- Improve names or local structure where the test protects behavior.
- Remove obsolete code made unreachable by the clean cutover.
- Keep the focused and related tests green.

## Evidence required in the worker result

- The durable test changed, or the executable smoke scenario used in its place and why no durable test was possible.
- The Red command and why it failed.
- The Green command and observed pass.
- Any related regression command and result.
- Why the test asserts consumer-visible behavior.

## Stop conditions

Stop and report a blocker rather than weakening the contract when:

- The required behavior cannot be isolated from an external decision.
- Neither the test harness nor any executable smoke scenario can exercise the changed surface.
- The documented requirement conflicts with observed repository behavior.
- A pre-existing failure prevents observing Red or Green.

Do not suppress an error, special-case the fixture, weaken an assertion, or replace an executable check with source inspection.
