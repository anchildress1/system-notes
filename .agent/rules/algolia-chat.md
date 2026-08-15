---
trigger: model_decision
description: Apply only when changing the Algolia AI chat integration. Do not use for the search page or non-chat results.
---

# Algolia Chat Contracts

## Architecture

- Keep `AIChat` client-only and dynamically loaded by `ClientShell`.
- Portal the chat dock and toggle directly to `document.body`.
- Keep the chat out of transformed, clipped, or scrolling layout containers.
- Use the dedicated dock and FAB; do not add a second Algolia toggle.

## State

- React owns the `open` boolean.
- Synchronize `ChatHandle.setOpen(open)` in an effect after commit.
- Never call the widget setter during render or inside the React state updater.
- Close React state when Algolia's header close control fires.

## Credentials and search

- Read public Algolia values through `@/lib/algolia.ts` and `@/config`.
- Create the client only when `hasValidAlgoliaCredentials()` passes.
- Never place admin or write-scoped keys in `NEXT_PUBLIC_*` variables.
- Use `getSearchPageURL` for widget routing and `getItemUrl` for result-card `q` links; do not add competing facet state.
- Preserve Algolia click events before client-side navigation.

## Blog tool

- Treat tool input as `unknown`.
- Trim strings, cap them at 200 characters, and clamp integer limits to 50.
- Fetch only `/api/blog/search` with a 10-second timeout.
- Return structured empty results for HTTP or network failure.
- Keep raw search/recommend tool layouts hidden; render result cards through the chat item component.

## Layout and styling

- Keep visibility on the dock's open class; do not mutate Algolia DOM state with observers.
- Do not add click-propagation workarounds for the Hero glitter trigger. It is a dedicated button, not a document listener.
- Prefer Algolia CSS custom properties and public component slots.
- Do not solve clipping with arbitrary z-index escalation. Fix portal placement or stacking context.

## Tests

- Cover missing credentials, toggle state, and post-commit widget synchronization.
- Cover tool input normalization, successful results, HTTP errors, timeouts, and thrown failures.
- Cover result URLs, click events, modified clicks, and client navigation.
