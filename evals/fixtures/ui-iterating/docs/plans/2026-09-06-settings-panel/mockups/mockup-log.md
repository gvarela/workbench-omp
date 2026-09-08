---
feature: Workspace settings panel
created: 2026-09-06
current_version: 1
status: iterating
project_directory: docs/plans/2026-09-06-settings-panel
last_updated: 2026-09-06
---

# Mockup Iteration Log

## Feature: Workspace settings panel

**Goal**: Let workspace admins change the workspace name, notification email, and weekly digest without leaving the dashboard.

## Version History

### v001 - 2026-09-06 - Initial Draft

- **Status**: In Review
- **Key decisions**: full-page card matching the account settings page; text-only, no icons
- **Feedback needed**: checkbox presentation; post-save navigation

## UI Research Reference

_From initial research - apply to all versions:_

- **Layout pattern**: shared `app-header` plus centered `app-main` column (`styles/app.css:40-75`)
- **Component library**: `styles/app.css:90-181`
- **Styling system**: plain CSS with `:root` tokens (`styles/app.css:2-23`)
- **Icon system**: None - text only
- **Similar features**: account settings page (`settings.html:21-40`)

## Running Requirements

### Confirmed (KEEP)

_Requirements confirmed through iteration_

### Rejected (REMOVE)

_Ideas explored and rejected with rationale_

### Open (DECIDING)

_Still being discussed_

## Design Principles Emerging

1. Reuse the account settings card structure for every settings surface
