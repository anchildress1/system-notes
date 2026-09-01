Paste into the intake agent's **user instructions** field in Agent Studio.

The text to paste is `user-instructions.generated.md`, beside this file. It
embeds the full project roster, so a roster copied by hand goes stale the first
time a project ships — which is the exact failure the prompt's own rules exist
to prevent.

```
node scripts/generate-agent-prompt.mjs --out .agent/agent-studio/user-instructions.generated.md
node scripts/generate-agent-prompt.mjs | pbcopy   # straight to the clipboard
```

Regenerate and repaste whenever `src/data/projects.json` changes. The generated
file is committed so a stale roster shows up as a diff, and
`generate-agent-prompt.test.ts` fails when it no longer matches the data. Neither
can tell whether the dashboard was repasted — that step is still yours.

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
- Project citations resolve to that project's filtered notes in Algolia; the
  catalogue is deliberately finite and has no project reader route.
