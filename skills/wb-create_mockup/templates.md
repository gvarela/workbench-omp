# Create mockup output templates

Read the relevant section in full when its step directs you here; match its structure exactly. Replace every `[bracketed]` value with research evidence or the user's answers; never leave a placeholder.

## UI Research Summary (Step 2)

```markdown
## UI Research Summary

### Layout System
- Pattern: [grid/flex/etc] ([path:line])
- Container widths: [values] ([path:line])
- Breakpoints: [mobile/tablet/desktop values] ([path:line])

### Component Library
- Location: [path]
- Key components: [list with path:line]
- Naming convention: [pattern]

### Styling Approach
- Method: [plain CSS/CSS modules/Tailwind/etc]
- Stylesheets to link: [paths a standalone HTML file must load]
- Colors: [token location path:line]
- Typography: [scale location path:line]
- Spacing: [system path:line]

### Icon System
- Library: [Font Awesome / Material Icons / Heroicons / SVG sprites / Custom / None]
- Location: [path:line where icons are imported or defined]
- Usage pattern: [<i class="..."> / <Icon name="..."> / <svg><use href="...">]
- Sizing: [classes or conventions]
- Examples: [path:line references to icon usage]

### Similar Features
- [Feature 1]: [path:start-end] - [how it is structured]
- [Feature 2]: [path:start-end] - [how it is structured]

### Patterns to Follow
1. [Pattern from research]
2. [Pattern from research]
```

## Clarifying Questions (Step 3)

```text
Based on my research of the existing UI, I have some questions:

**Scope & Purpose**
1. What problem does this [feature] solve for users?
2. Who is the primary user of this feature?

**Content & Data**
3. What information needs to be displayed?
4. What actions can users take?
5. Are there states to handle? (empty, loading, error, success)

**Placement & Flow**
6. Where does this fit in the navigation?
7. What triggers this UI to appear?
8. Where does the user go after completing this?

**Constraints**
9. Any technical constraints I should know about?
10. Mobile support required?

Please answer what you can - we can iterate on unknowns.
```

## mockup.md v001 Template (Step 5)

````markdown
---
version: 1
created: [YYYY-MM-DD]
status: draft
feature: [feature name]
based_on: [similar feature from research]
---

# Mockup: [Feature Name] v001

## Overview

**Purpose**: [From clarifying questions]
**User**: [From clarifying questions]
**Trigger**: [How user gets here]

## Layout

```text
+-------------------------------------------------+
| [Header/Navigation - per existing pattern]      |
+-------------------------------------------------+
|                                                 |
|   +-----------------------------------------+   |
|   | [Component Area]                        |   |
|   |                                         |   |
|   |  [Content structure using ASCII]        |   |
|   |                                         |   |
|   |  +----------+  +----------+             |   |
|   |  | Button 1 |  | Button 2 |             |   |
|   |  +----------+  +----------+             |   |
|   |                                         |   |
|   +-----------------------------------------+   |
|                                                 |
+-------------------------------------------------+
```

## Components Used

| Component | From Library | Purpose |
| --- | --- | --- |
| [Component] | [path:line] | [what it does here] |

## Content Specifications

### [Section 1]
- **Data**: [what is displayed]
- **Source**: [where data comes from]
- **Empty state**: [what shows when no data]

### [Section 2]
...

## Interactions

1. **[Action]**: User clicks [element] → [result]
2. **[Action]**: User types in [field] → [validation/result]

## States

| State | Trigger | Display |
| --- | --- | --- |
| Loading | Initial load | [skeleton/spinner] |
| Empty | No data | [message + CTA] |
| Error | API failure | [error message] |
| Success | Action complete | [confirmation] |

## Styling Notes

- Uses [color tokens] from [path:line]
- Follows [spacing system]
- Typography: [heading/body styles]

## Icons

- System: [icon library/approach from research, or "None - text only"]
- Usage: [how icons are applied, with examples]
- Locations: [where icons appear in this mockup]

**If no icon system found but icons needed:**
Create beads issue: `bd create "UI Q: Icon system?" --type=task --priority=2 -d "Mockup needs icons but no system found. Options: add library, use text only, custom SVG"`

## Open Questions

UI questions are tracked in beads, NOT in this document.

**To add a UI question**:

```bash
bd create "UI Q: [your question]" --type=task --priority=2 \
  -d "From mockup v[version]. Blocks: [what can't proceed without answer]"
# → Returns issue ID (e.g., prompts-abc)
```

**Active questions** (reference only, beads is source of truth):

Use `bd list -n 0 --status=open | grep "UI Q:"` to see all open UI questions, or reference by ID:
- `[id]`: [Brief question summary] - blocks finalization
- `[id]`: [Brief question summary] - blocks [what it blocks]

To see full question details: `bd show [id]`
````

## decisions.md Template (Step 5)

```markdown
---
version: 1
created: [YYYY-MM-DD]
---

# v001 Decisions

## Choices Made

### Layout Choice
- **Decision**: [what was chosen]
- **Rationale**: [why, referencing research]
- **Alternative considered**: [what else could work]

### Component Choices
- **Decision**: Use [component] for [purpose]
- **Rationale**: Matches existing pattern at [path:line]

## Based On Research

- Layout follows pattern from [similar feature]
- Components reused from [library location]
- Styling matches [existing page]

## Assumptions

1. [Assumption made due to unclear requirement]
2. [Assumption about user behavior]

## Needs Validation

- [ ] [Thing to verify with user/stakeholder]
- [ ] [Technical feasibility question]
```

## HTML Mockup Template (Step 6)

Keep only the stylesheet and icon lines that research supports; delete the rest. No emojis anywhere in the file.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mockup: [Feature Name] v001</title>

  <!-- App stylesheets from research; paths relative to mockups/v001/ or the dev-server URL -->
  <link rel="stylesheet" href="[relative path from mockups/v001/ to the app stylesheet; count every parent directory]">
  <!-- Tailwind only when research found it: <script src="https://cdn.tailwindcss.com"></script> -->

  <!-- Icon library only when research found it -->
  <!-- Font Awesome: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"> -->
  <!-- Material Icons: <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons"> -->

  <style>
    /* Only overrides needed to match the app exactly; copy from discovered tokens */
  </style>
</head>
<body class="[discovered body classes from research]">

  <!-- Header/Navigation - copy structure from research path:line -->
  <header class="[actual header classes from app]">
    <!-- Use actual nav structure from research -->
  </header>

  <!-- Main content area -->
  <main class="[layout classes from research]">

    <!-- Feature mockup using real component HTML -->
    <div class="[container classes from research]">

      <h1 class="[heading classes from research]">
        <!-- Icon only if the researched system has one: <i class="fa-solid fa-[icon-name]"></i> -->
        [Feature Title]
      </h1>

      <!-- Content sections matching the ASCII diagram -->

      <!-- Buttons using the app's actual button HTML -->
      <div class="[button container classes]">
        <button class="[primary button classes from research]">
          Primary Action
        </button>
        <button class="[secondary button classes from research]">
          Secondary Action
        </button>
      </div>

    </div>

  </main>

  <!-- Footer if app has one -->

</body>
</html>
```

## mockup-log.md Template (Step 8)

Frontmatter values are literal: `status` is exactly `iterating` until finalization changes it to `finalized`; per-version review state belongs in the Version History entry (`**Status**: In Review`), never in frontmatter.

```markdown
---
feature: [feature name]
created: [YYYY-MM-DD]
current_version: 1
status: iterating
project_directory: [full path to project directory]
last_updated: [YYYY-MM-DD]
---

# Mockup Iteration Log

## Feature: [Name]

**Goal**: [From clarifying questions]

## Version History

### v001 - [YYYY-MM-DD] - Initial Draft
- **Status**: In Review
- **Key decisions**: [brief summary]
- **Feedback needed**: [what to validate]

## UI Research Reference

_From initial research - apply to all versions:_

- **Layout pattern**: [pattern from research]
- **Component library**: [location]
- **Styling system**: [approach]
- **Icon system**: [library and usage pattern, or "None - text only"]
- **Similar features**: [references]

## Running Requirements

### Confirmed (KEEP)
_Requirements confirmed through iteration_

### Rejected (REMOVE)
_Ideas explored and rejected with rationale_

### Open (DECIDING)
_Still being discussed_

## Design Principles Emerging

1. [Principle discovered through iteration]
```

## Presentation (Step 9)

```text
Visual preview of mockup v001: [preview-v001.png shown above]

Does this match your app's visual style?
- Colors match app theme? [Y/N]
- Spacing looks consistent? [Y/N]
- Typography matches app? [Y/N]
- Icons follow app pattern? [Y/N] (or text-only confirmed)
- Layout structure correct? [Y/N]

Location: [project-dir]/mockups/v001/

**What I created based on research:**
- Layout following [pattern] from [similar feature]
- Using components: [list with path:line]
- Styling: [CSS approach from research]
- Icons: [icon system from research, or text-only]

**Files created:**
- mockup.md - ASCII structure and specifications
- mockup.html - Working HTML with the app's actual styles
- decisions.md - Rationale for design choices
- preview-v001.png - Visual screenshot
- mockup-log.md - Iteration log at current_version: 1

**Key decisions made:**
1. [Decision 1] - because [rationale from research]
2. [Decision 2] - because [rationale from research]

**Open questions:**
[UI Q: issue ids, or "none"]

**Next steps:**
- Review the visual preview and confirm or correct the checks above
- Open mockups/v001/mockup.html in a browser to interact
- Give feedback with /wb:mockup-iteration: what to keep, change, or remove

I will wait for your visual check before iterating.
```
