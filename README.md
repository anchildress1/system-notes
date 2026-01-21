# System Notes

![CI](https://github.com/anchildress1/system-notes/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-Polyform%20Shield%201.0.0-blue)
![Status](https://img.shields.io/badge/status-active%20%26%20evolving-success)

## The Narrative

Welcome to the digital nervous system of my professional existence. This isn't a static portfolio or a dusty résumé; it's a living, breathing, and occasionally glittering map of what I've built, broken, and fixed.

System Notes treats projects like evolving organisms rather than finished artifacts. It acknowledges that "finished" is a myth and that the relationships between projects are often more interesting than the projects themselves. It is built to be queried, explored, and poked at.

It is **Incomplete by Design**.

## The Architecture

This monorepo houses the full stack of the system:

- **apps/web**: The face. A Next.js frontend that believes in "More Sparkles, More Problems" but handles them anyway.
- **apps/api**: The brain. A FastAPI service that talks to LLMs so you don't have to guess what I was thinking.
- **packages/**: The shared tissue connecting the organs.

## Quick Start

We use a `Makefile` to keep things civilized.

```bash
# Setup everything (Node + Python + vibes)
make setup

# Run the development environment (Frontend + Backend)
make dev

# Run all the checks because you care about quality
make ai-checks
```

## Contributors

**None.**

(Unless you count the AI assistants I argue with daily. I don't. They don't push code, they just critique it.)

## Mine. Read Before You Get Ideas. ⚖️

This project is my work and it’s licensed under the [Polyform Shield License 1.0.0](./LICENSE).

**Fork it?** Absolutely.  
**Learn from it?** Please do.  
**Monetize it?** Absolutely not.

If you’re selling it, bundling it, or otherwise profiting from my late-night coding sessions, we’re going to have a problem. Keep it open, keep it personal, and we'll be fine.
