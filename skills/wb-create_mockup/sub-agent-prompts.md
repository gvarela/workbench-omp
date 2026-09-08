# UI research agent batch

Fill every `{{token}}`, then issue one `task` call containing all five items. Keep the shared documentarian constraint in `context` and restate it in every item; do not split these into sequential calls.

Tokens: `{{project_directory}}`, `{{feature_description}}`, `{{feature_type}}` (panel, modal, page, form, list), `{{ui_scope}}` (source roots holding templates, components, and styles).

```json
{
  "context": "# Goal\nDocument the existing UI of this codebase so a mockup for {{feature_description}} ({{project_directory}}) can reuse its real layouts, components, styles, and icons.\n\n# Constraints\nRead-only investigation. Document what exists, not what should exist. No critique, recommendations, redesign ideas, or file writes. Cite every claim as path:line or path:start-end. If something does not exist, say so plainly.\n\n# Contract\nReturn a compact evidence report grouped by the headings in your item. The coordinator alone synthesizes and writes mockup files.",
  "tasks": [
    {
      "name": "ResearchLayout",
      "agent": "wb-codebase-analyzer",
      "task": "# Target\nPage layout patterns in {{ui_scope}}: grid or flex systems, containers and max widths, navigation structure, content-area organization, responsive breakpoints.\n\n# Change\nDo not change files. Read the templates, layout components, and stylesheets that define page structure.\n\n# Acceptance\nReturn each pattern with the exact path:line where it is defined and one place it is used; document what exists, no improvements or recommendations."
    },
    {
      "name": "ResearchComponents",
      "agent": "wb-codebase-analyzer",
      "task": "# Target\nThe existing component library in {{ui_scope}}: buttons, forms and inputs, cards, modals or panels, tables, notices; naming conventions; props or class API patterns; where components are defined.\n\n# Change\nDo not change files. Read component definitions and at least one usage of each.\n\n# Acceptance\nReturn each component with its class names or props, definition path:line, and a usage path:line; document what exists, no improvements or recommendations."
    },
    {
      "name": "ResearchStyling",
      "agent": "wb-codebase-analyzer",
      "task": "# Target\nThe styling approach in {{ui_scope}}: CSS method (plain CSS, CSS modules, Tailwind, styled-components, or other), color tokens or variables, typography scale, spacing system, theme configuration, and how stylesheets are loaded by pages.\n\n# Change\nDo not change files. Read the stylesheet entry points and token definitions.\n\n# Acceptance\nReturn the method, every token group with path:line, the stylesheet paths a standalone HTML file would need to link, and body or root classes pages rely on; document what exists, no improvements or recommendations."
    },
    {
      "name": "FindSimilarFeatures",
      "agent": "wb-pattern-finder",
      "task": "# Target\nExisting features similar to {{feature_description}}: panels, modals, pages, or forms of type {{feature_type}} in {{ui_scope}}, how each is structured, and the recurring pattern for {{feature_type}} surfaces in this codebase.\n\n# Change\nDo not change files. Compare structure, class usage, action placement, and state handling (loading, empty, error, success) across the examples.\n\n# Acceptance\nReturn each example with path:start-end for its markup and a factual description of its structure; document what exists, no improvements or recommendations."
    },
    {
      "name": "ResearchIcons",
      "agent": "wb-codebase-analyzer",
      "task": "# Target\nThe icon system in {{ui_scope}}: library (Font Awesome, Material Icons, Heroicons, SVG sprites, custom components, or none), where icons are imported or defined, how components reference them, sizing and color conventions, and examples in buttons, headers, and navigation.\n\n# Change\nDo not change files. Search stylesheets, templates, and dependency manifests for icon libraries and inline SVG usage.\n\n# Acceptance\nReturn exact usage patterns with path:line. If no icon system exists, state that clearly and do not suggest adding one; document what exists, no improvements or recommendations."
    }
  ]
}
```

After the call returns ids, wait for every job to settle. Then read each `agent://<id>` result in full before writing the UI Research Summary. Never treat an auto-delivery preview as the complete evidence record.
