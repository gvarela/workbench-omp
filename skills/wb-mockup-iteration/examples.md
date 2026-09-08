# Mockup iteration example

An example interaction; match its shape when classifying and versioning.

```text
User: "Keep the card layout but remove the sidebar. The header should be sticky."

Assistant: Updated mockup-log.md:

KEEPING:
  - Card layout - "Keep the card layout"
  - Header (will make sticky)

REMOVING:
  - Sidebar - "remove the sidebar"

CHANGING:
  - Header: static → sticky - "header should be sticky"

Ready to create v002?

User: "Yes, and make the cards 3 columns on desktop"

Assistant: Got it, adding to changes:

CHANGING:
  - Card grid: current → 3 columns on desktop

Creating v002...

Created mockups/v002/
- mockup.md: Updated ASCII with all changes
- mockup.html: Updated HTML with all changes
- preview-v002.png: Visual screenshot
- decisions.md: Documented rationale
- mockup-log.md: Added v002 entry, current_version: 2

[preview-v002.png shown]

Visual preview updated with your changes. Anything else to adjust?
```
