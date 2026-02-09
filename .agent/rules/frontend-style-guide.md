---
trigger: model_decision
description: Apply this contract when rendering or styling cards, chat, or controls on the search page.
---

# SEARCH PAGE COLOR CONTRACT (AI-OPTIMIZED)

SCOPE: Cards + Chat + Search UI
GOAL: Deterministic color usage with no interpretation
GOAL: Deterministic color usage with no interpretation

---

## COLOR TOKENS (EXPLICIT)

- Surface: #3A3D46
- Text Primary: #E6E6EB
- Text Secondary: #B9BBC4
- Purple (Primary Action / Agent Control): #B56BFF
- Pink (Human Identity): #F16197
- Teal (Navigation / References): #3EC7C2

Only these colors are permitted.

---

## CARDS

### Card Base

- Background: #3A3D46
- Text: #E6E6EB
- Secondary text: #B9BBC4

### Card Interaction

- Hover state: Purple #B56BFF (border or glow)
- Selected state: Purple #B56BFF (border or glow)

### Card Content

- Primary action (button): Purple #B56BFF
- Secondary action (link/icon): Teal #3EC7C2
- Human attribution or marker: Pink #F16197

Cards remain structural surfaces. Color indicates state or intent.

---

## CHAT

### Human Signal

- Human icon: Pink #F16197
- Human-authored indicators: Pink #F16197

### Agent Signal

- Agent responses: Purple #B56BFF
- Active agent state: Purple #B56BFF
- Agent primary action: Purple #B56BFF

### Navigation from Chat

- Links to results or cards: Teal #3EC7C2

---

## SEARCH UI (NON-CARD, NON-CHAT)

### Search Input

- Focused state: Purple #B56BFF
- Text: #E6E6EB
- Placeholder: #B9BBC4

### Filters and Controls

- Inactive: #B9BBC4
- Active: Purple #B56BFF

### Result Links

- Clickable references: Teal #3EC7C2

---

## AGENT DECISION RULES

1. If element role == primary action → use #B56BFF
2. If element role == human presence → use #F16197
3. If element role == navigation or reference → use #3EC7C2
4. If element role == structure or container → use #3A3D46
5. If element role == text → use #E6E6EB or #B9BBC4

---

## TYPOGRAPHY

### Fonts

- **Primary / Headers**: JetBrains Mono (`var(--font-mono)`)
  - Used for: Titles, Headings, Hero text.
  - Style: Bold/ExtraBold for impact.
- **Secondary / Body**: Inter (`var(--font-sans)`)
  - Used for: Standard text, descriptions.
- **Accents**: Courier New (Monospace fallback)
  - Used for: Subtitles, small technical accents.

**FORBIDDEN**: Ribeye font is not to be used.

---

## SINGLE DIRECTIVE

Apply color strictly by role:

- Action = Purple
- Human = Pink
- Navigation = Teal
- Structure = Surface
