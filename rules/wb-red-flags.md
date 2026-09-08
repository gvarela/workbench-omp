---
description: Stops placeholder content from entering formal Workbench project documents.
condition:
  - "\\bTBD\\b"
  - "\\bTODO\\b"
  - "\\[To be added\\]"
  - "\\[placeholder\\]"
  - "\\[Fill this in\\]"
scope:
  - "tool:edit(docs/plans/**)"
  - "tool:write(docs/plans/**)"
interruptMode: always
---

Do not write placeholders into formal Workbench project documents. Replace the placeholder with specific evidence, a decided value, or an executable step. If the required information is unknown, record the uncertainty as a Beads planning issue or in `thoughts/` and stop before presenting the formal document as complete.
