# AGENTS.md

Canonical instruction source for this repository. Treat this file as authoritative.

## Scope

- Apply these rules when changing code in this repo.
- If a local instruction file conflicts with this file, prefer this file.

## Non-Negotiable Constraints

### Security: file access and path handling

- If changes touch file loading, path resolution, or file-serving behavior, apply `SECURITY_RULES.md` as mandatory policy.
- Required invariants:
  - Reject any user-controlled path input containing `..`.
  - Resolve to absolute paths before use.
  - Enforce sandbox-root containment after resolution.
  - Allowlist served file types to `.md`, `.json`, `.txt`.
  - Default to deny on validation failure.

### Commit format (when committing is requested)

- Use Conventional Commits.
- Include required RAI footer.

## Frontend Style Skill

- Refer to `.claude/skills/frontend-style.md`.

## Documentation

- Do not add docs to project unless specifically asked
- Aim for witty, humorous tone in docs.
