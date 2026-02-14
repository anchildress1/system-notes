---
name: frontend-style
description: Apply frontend style guide for cards, chat, and search UI
trigger: When working on search page components, cards, chat interface, or any UI styling
---

# Frontend Style Guide Application

Before making ANY changes to card components, chat interface, or search page UI, you MUST follow the color contract defined in `.agent/rules/frontend-style-guide.md`.

## Quick Reference

**Color Tokens (ONLY these are permitted):**

- Purple `#B56BFF` → Primary Action / Agent Control
- Pink `#F16197` → Human Identity
- Teal `#3EC7C2` → Navigation / References
- Surface `#3A3D46` → Backgrounds
- Text Primary `#E6E6EB`
- Text Secondary `#B9BBC4`

**Decision Rules:**

1. Primary action → Purple
2. Human presence → Pink
3. Navigation/reference → Teal
4. Structure/container → Surface
5. Text → Primary or Secondary

**Typography:**

- Headers/Titles: JetBrains Mono (`var(--font-mono)`)
- Body text: Inter (`var(--font-sans)`)
- **FORBIDDEN**: Ribeye font

## When This Applies

- Creating/modifying card components (FactCard, PostCard, ProjectCard, etc.)
- Styling chat interface (AIChat component)
- Search page UI (SearchPage, filters, controls)
- Any button, link, or interactive element on these pages

## Full Contract

For complete specifications, always refer to:
**`.agent/rules/frontend-style-guide.md`**

This contract is deterministic - no interpretation needed. Apply colors strictly by role.
