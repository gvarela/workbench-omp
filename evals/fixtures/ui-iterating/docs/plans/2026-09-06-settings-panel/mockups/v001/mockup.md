---
version: 1
created: 2026-09-06
status: draft
feature: Workspace settings panel
based_on: Account settings page (settings.html:21-40)
---

# Mockup: Workspace settings panel v001

## Overview

**Purpose**: Let workspace admins change the workspace name, notification email, and weekly digest without leaving the dashboard.
**User**: Workspace admins.
**Trigger**: The Settings link in the app header.

## Layout

```text
+------------------------------------------------------------------+
| Ledgerboard                              DASHBOARD    SETTINGS   |
+------------------------------------------------------------------+
|                                                                  |
|   Workspace settings                                             |
|                                                                  |
|   +----------------------------------------------------------+   |
|   | Workspace                                                |   |
|   +----------------------------------------------------------+   |
|   | Workspace name                                           |   |
|   | [ Acme Billing                                         ] |   |
|   | Notification email                                       |   |
|   | [ billing@acme.example                                 ] |   |
|   | Receives payment alerts and the weekly digest.           |   |
|   | Weekly digest                                            |   |
|   | [x]                                                      |   |
|   +----------------------------------------------------------+   |
|   |                              [ Cancel ]  [   Save   ]    |   |
|   +----------------------------------------------------------+   |
|                                                                  |
+------------------------------------------------------------------+
```

## Components Used

| Component | From Library | Purpose |
| --- | --- | --- |
| `app-header`, `app-nav` | `styles/app.css:40-69` | Shared shell |
| `card`, `card__header`, `card__body`, `card__footer` | `styles/app.css:90-112` | Settings container |
| `form-field` family | `styles/app.css:114-136` | Name, email, digest inputs |
| `btn btn--primary`, `btn btn--secondary` | `styles/app.css:138-160` | Save and Cancel |
| `notice notice--error` | `styles/app.css:172-181` | Save failure message |

## Content Specifications

### Workspace card

- **Data**: workspace name, notification email, weekly digest flag
- **Source**: workspace record
- **Empty state**: not applicable; a workspace always has these values

## Interactions

1. **Save**: User clicks Save → settings persist, success message shown on the dashboard
2. **Cancel**: User clicks Cancel → returns to the dashboard unchanged

## States

| State | Trigger | Display |
| --- | --- | --- |
| Loading | Initial load | Inputs disabled until values arrive |
| Error | Save failure | `notice--error` shown above the footer |
| Success | Save complete | Dashboard confirmation message |

## Styling Notes

- Uses color tokens from `styles/app.css:2-23`
- Follows the `--space-*` spacing scale
- Typography: `page-title` heading, body text at `--text-md`

## Icons

- System: None - text only (no icon library in the codebase)
- Usage: none
- Locations: none

## Open Questions

UI questions are tracked in beads, NOT in this document.

Use `bd list -n 0 --status=open | grep "UI Q:"` to see all open UI questions.
