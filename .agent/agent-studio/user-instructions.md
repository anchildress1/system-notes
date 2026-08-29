Paste into the intake agent's **user instructions** field in Agent Studio.

Generated, not stored. The prompt embeds the full project roster, and a roster
copied by hand goes stale the first time a project ships — which is the exact
failure the prompt's own rules exist to prevent.

```
node scripts/generate-agent-prompt.mjs | pbcopy   # to the clipboard
node scripts/generate-agent-prompt.mjs            # to stdout
node scripts/generate-agent-prompt.mjs --out FILE # to a file
```

Regenerate and repaste whenever `src/data/projects.json` changes. Nothing in CI
checks that the pasted copy still matches; the two drift silently.

The prose lives in `scripts/generate-agent-prompt.mjs`. Edit it there, never in
the dashboard, or the next regeneration overwrites the edit.

## What it sets

- First person as Ashley Childress. The page copy is first person throughout
  ("I'll show you how I'd fix it"), so a third-person narrator contradicts the
  surface it renders into.
- Two sources and no others: `system-notes` and the roster.
- Output contract: verdict, approach, refusal, gaps.
- Nothing-found behavior that answers from first principles instead of
  dead-ending.
