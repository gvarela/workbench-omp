# Project validation report template

```text
# Project Validation Report

Project: <project>
Location: <project-directory>
Validated: <UTC timestamp>

## Summary

- Passed: <count>
- Warnings: <count>
- Critical errors: <count>

Overall Status: <PASS | PASS WITH WARNINGS | FAIL>

## Critical Errors

### <finding>
- Location: <file, field, or Beads id>
- Observed: <actual state>
- Required: <invariant>
- Impact: <why this blocks>
- Fix: <one concrete corrective action>

## Warnings

### <finding>
- Location: <file, field, or Beads id>
- Observed: <actual state>
- Impact: <specific consequence>
- Fix: <one concrete corrective action>

## Passed Checks

- <category>: <evidence checked>

## Validation Details

- research.md: <status and metadata result>
- design.md: <status, approval, and metadata result>
- tasks.md: <status, counts, and metadata result>
- Epic: <id and status>
- Phase milestones: <mapped count and status counts>
- Task issues: <mapped count and status counts>
- Beads mode: <git | stealth and evidence>

## Next Action

<single command or manual correction appropriate to the result>
```

Omit `Critical Errors` or `Warnings` when its count is zero. Never include placeholder examples in a rendered report.
