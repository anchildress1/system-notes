---
name: frontend-style
description: Deterministic style contract for search UI, cards, and chat.
trigger: When working on search page components, cards, chat interface, or any UI styling
---

# Frontend Style Skill

This skill is the canonical source of frontend style rules.

## Scope

- Applies to search UI, cards, chat, and controls in that surface area.

## Color Tokens (only these)

- `surface`: `#3A3D46`
- `text.primary`: `#E6E6EB`
- `text.secondary`: `#B9BBC4`
- `action.agent`: `#B56BFF`
- `identity.human`: `#F16197`
- `nav.reference`: `#3EC7C2`

## Deterministic Role Mapping

1. Primary action or agent control -> `#B56BFF`
2. Human identity/ownership markers -> `#F16197`
3. Navigation/reference affordances -> `#3EC7C2`
4. Structural surfaces/containers -> `#3A3D46`
5. Text -> `#E6E6EB` or `#B9BBC4`

## Typography

- Headings/titles: `var(--font-mono)` (JetBrains Mono)
- Body text: `var(--font-sans)` (Inter)
- Forbidden font: Ribeye
