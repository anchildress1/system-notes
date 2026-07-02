![System Notes Banner](https://repository-images.githubusercontent.com/1136108938/63dfb9e9-71d4-47c9-8ea8-fa58bef2bafc)

<!-- Build & Status -->

[![CI](https://github.com/anchildress1/system-notes/actions/workflows/ci.yml/badge.svg)](https://github.com/anchildress1/system-notes/actions/workflows/ci.yml) ![License](https://img.shields.io/badge/License-PolyForm%20Shield%201.0.0-blue) ![Security: Lefthook](https://img.shields.io/badge/Security-Lefthook%20guarded-success)

<!-- Tech Stack -->

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?logo=typescript&logoColor=white) ![Next JS](https://img.shields.io/badge/Next-black?logo=next.js&logoColor=white) ![Algolia](https://img.shields.io/badge/Algolia-003DFF?logo=algolia&logoColor=white)

![Google Cloud](https://img.shields.io/badge/GoogleCloud-%234285F4.svg?logo=google-cloud&logoColor=white) ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?logo=github-actions&logoColor=white) ![Release Please](https://img.shields.io/badge/Release_Please-Configured-brightgreen)

![Antigravity](https://img.shields.io/badge/Antigravity-4285F4?logo=google&logoColor=white) ![Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?logo=googlegemini&logoColor=white) ![ChatGPT](https://img.shields.io/badge/ChatGPT-74aa9c?logo=openai&logoColor=white) ![OpenAI GPT 5.2](https://img.shields.io/badge/OpenAI_GPT_5.2-74aa9c?logo=openai&logoColor=white)

# System Notes

Welcome to the digital nervous system of my professional existence. This isn't a static portfolio or a dusty résumé; it's a living, breathing, and occasionally glittering map of what I've built, broken, and fixed.

System Notes treats projects like evolving organisms rather than finished artifacts. It acknowledges that "finished" is a myth and that the relationships between projects are often more interesting than the projects themselves. It is built to be queried, explored, and poked at.

It is **Incomplete by Design**.

## The Architecture

[Read the full System Architecture](./ARCHITECTURE.md)

One Next.js app, no backend to babysit:

- **apps/web**: The whole show. A Next.js app that believes in "More Sparkles, More Problems" and handles them anyway — UI, search, and the AI chat all live here.
- **Search & brains**: Algolia does the heavy lifting (search + AI), and a lone Next.js route handler (`/api/blog/search`) aggregates my DEV blog on the side. No separate service to keep alive at 3am.

## Quick Start

We use a `Makefile` to keep things civilized.

```bash
# Setup everything (Node + vibes)
make setup

# Run the development environment
make dev

# Run all the checks because you care about quality
make ai-checks
```

## Performance & Accessibility

Recent updates have focused on creating an experience that is both **lightning-fast for users** and **transparently readable for AI agents**.

- **Optimized Assets**: Audio and visual assets are lazy-loaded or pre-loaded intelligently to respect user bandwidth (especially on mobile).
- **Interactive Glitter**: Particle effects are batched and scaled based on device capabilities, ensuring high-fidelity fun without the frame drops.
- **AI-Ready Context**: System prompts and project data are structured to be ingested by LLMs, making this entire repository a queryable knowledge base.

This aims to provide **AI accessible info at a speed users can enjoy**, without overloading the developer (me) or your browser.

## Mine. Read Before You Get Ideas. ⚖️

This project is my work and it’s licensed under the [PolyForm Shield License 1.0.0](./LICENSE).

**Fork it?** Absolutely.
**Learn from it?** Please do.
**Monetize it?** Absolutely not.

If you’re selling it, bundling it, or otherwise profiting from my late-night coding sessions, we’re going to have a problem. Keep it open, keep it personal, and we'll be fine.
