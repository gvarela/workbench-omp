---
project: command-aliases
created: 2026-09-01
status: exploration
topic: command alias resolution boundary
tags: [thoughts, exploration, command-aliases]
---

# Exploration: Command alias resolution boundary

## Decision space

Alias behavior could live at the CLI boundary or inside the catalog contract.

## Directions considered

- CLI normalization keeps the catalog exact-name-only but aliases do not work for non-CLI callers.
- Catalog-owned resolution gives every caller the same behavior but expands the catalog contract.

## Discussion

The user prioritized one consistent alias contract for all catalog callers.

## Synthesis

- **Outcome:** Approved
- **Converged direction:** Catalog-owned alias resolution. Commands declare an optional immutable alias list. Registration rejects aliases that collide with any command name or earlier alias; lookup resolves exact command names before aliases.
- **Rationale:** Every current and future caller receives identical deterministic lookup behavior.
- **Rejected with reasons:** CLI-only normalization excludes direct catalog callers; last-registration-wins collisions make behavior order-dependent.
- **Deferred to design:** No unresolved direction; formalize the contract and measurable outcomes.
