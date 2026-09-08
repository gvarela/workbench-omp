---
version: 1
created: 2026-09-06
---

# v001 Decisions

## Choices Made

### Layout Choice

- **Decision**: Full-page card under the shared header, matching the account settings page
- **Rationale**: The only existing settings pattern is a single `card` form (`settings.html:21-40`)
- **Alternative considered**: Slide-over panel on the dashboard; no existing pattern to copy

### Component Choices

- **Decision**: Use `form-field` blocks for every input, including the digest checkbox
- **Rationale**: Matches existing pattern at `settings.html:24-32`

## Based On Research

- Layout follows pattern from the account settings page
- Components reused from `styles/app.css:90-181`
- Styling matches `settings.html`

## Assumptions

1. The digest checkbox can reuse `form-field__input` without a dedicated checkbox style

## Needs Validation

- [ ] Checkbox alignment inside `form-field__input`
- [ ] Whether the panel should return to the dashboard after Save
