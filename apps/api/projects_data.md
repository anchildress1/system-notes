# Projects

---

## System Notes
**Status:** Active

**Description**  
A living, queryable system map of projects, decisions, and evolution over time.

**Project Output**  
System Notes replaces a traditional developer website with a structured, machine-readable system. Projects are treated as evolving systems with relationships, intent, and history, designed to be navigated by both humans and AI.  
Includes an interactive chatbot that allows users to query and explore the system as designed. This interface is currently a proof of concept, with additional enhancements planned as part of the Algolia challenge.

**Tech Stack**  
- Markdown-first documentation  
- GitHub repository–driven system modeling  
- AI-assisted navigation and context layering  
- Chat-based interface (POC)

**Outcome**  
Early-stage system that is already stable enough to serve as a live portfolio backbone. Validation to date is qualitative, with planned expansion of the interactive layer.

---

## Underfoot: Underground Travel Planner
**Status:** Active

**Description**  
An experimental travel planner for discovering hidden, off-grid destinations.

**Project Output**  
A full-stack application that surfaces unconventional travel destinations using narrative context rather than ranking algorithms, prioritizing discovery over optimization.

**Tech Stack**  
- JavaScript / TypeScript  
- Full-stack web application  
- AI-assisted discovery and scoring logic  
- Privacy-first data handling

**Outcome**  
Shipped as the first hackathon project in nearly 20 years. Did not place, but produced a complete concept and informed a documented postmortem and follow-up writing.

---

## eslint-config-echo
**Status:** Active

**Description**  
Enterprise ESLint configuration with dual v8 and v9 support.

**Project Output**  
A shared ESLint configuration package designed to standardize linting across repositories while supporting both legacy ESLint v8 and modern v9 flat config workflows.

**Tech Stack**  
- JavaScript  
- ESLint  
- Prettier  
- Sonar-aligned rule sets  
- Node.js ecosystem

**Outcome**  
Adopted in a real production codebase to reduce configuration drift and standardize linting behavior.

---

## Delegate Action
**Status:** Active (Experimental)

**Description**  
A GitHub Action that turns prompts into pull requests, not auto-merges.

**Project Output**  
A theoretical human-in-the-loop automation pattern designed to compensate for the absence of a reliable coding agent in GitHub Actions. Generates changes, opens a pull request, and enforces review boundaries.

**Tech Stack**  
- GitHub Actions  
- JavaScript / Node.js  
- GitHub Copilot  
- CI security and quality gates  
- Responsible AI attribution enforcement

**Outcome**  
Design-stage solution informed by prior experience with similar automation flows. Not yet production-tested, but early outlook is positive.

---

## Dev.to Mirror
**Status:** Active (planned move to CheckMarkDevTools)

**Description**  
A set-and-forget static mirror for Dev.to blogs.

**Project Output**  
Automatically generates a static, crawlable mirror of Dev.to content optimized for search and AI discovery while preserving canonical links to original posts.

**Tech Stack**  
- JavaScript  
- Static site generation  
- HTML-first output  
- GitHub Pages–compatible structure  
- Search and AI discoverability optimization

**Outcome**  
Successfully increased inbound discovery across search engines, syndication networks, and AI tools without requiring analytics infrastructure or operational overhead.

---

## RAI Lint
**Status:** Active

**Description**  
Dual-language commit validation enforcing Responsible AI attribution.

**Project Output**  
A validation framework that enforces explicit AI attribution in commits using structured footers, with native plugins for both JavaScript (commitlint) and Python (gitlint).

**Tech Stack**  
- JavaScript  
- TypeScript  
- Python  
- Node.js  
- commitlint  
- gitlint  
- ESLint  
- GitHub Actions  
- SonarCloud  
- Codecov  
- Polyform Shield License

**Outcome**  
Works reliably in daily workflows and is gradually being adopted by the team using non-blocking warnings to encourage compliance without disruption.

---

## Awesome GitHub Copilot
**Status:** Active

**Description**  
A curated collection of Copilot instructions, prompts, and agents.

**Project Output**  
A structured library of reusable Copilot instructions, prompts, and agent configurations labeled by lifecycle stage, serving as both an experimentation sandbox and an incubation space before upstreaming.

**Tech Stack**  
- Node.js (24.x)  
- Markdown-based prompt and instruction system  
- GitHub Copilot  
- ChatGPT  
- MCP-compatible agent patterns

**Outcome**  
By far the most shared and starred project in the portfolio, exceeding expectations and demonstrating strong community interest.

---

## My Hermantic Agent (Hermes)
**Status:** Active (WIP)

**Description**  
A self-hosted, tool-using AI agent with long-term memory.

**Project Output**  
A CLI-driven autonomous agent built around a reasoning-capable local LLM, combining short-term conversational context with long-term semantic memory, tool usage, and persistent state.

**Tech Stack**  
- Python 3.12+  
- Ollama  
- NousResearch Hermes-4-14B  
- Hugging Face models  
- OpenAI embeddings  
- PostgreSQL  
- TimescaleDB  
- pgvector  
- GitHub Copilot  
- ChatGPT  
- Polyform Shield License

**Outcome**  
Early-stage research project exploring agent autonomy, memory design, and local-first AI systems.

---

## CheckMark Copilot Chat
**Status:** Archived

**Description**  
An early experiment in portable Copilot chat workflows.

**Project Output**  
Explored reusable Copilot chat configuration patterns. Archived after a core assumption proved false: chat context is not meaningfully editable in the way required. A workaround was identified but deemed unsuitable for a production product.

**Tech Stack**  
- GitHub Copilot Chat  
- JavaScript  
- Early MCP-adjacent experimentation

**Outcome**  
Hypothesis disproven, boundary documented, project archived intentionally.
