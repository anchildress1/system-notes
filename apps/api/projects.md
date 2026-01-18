# Project Systems Overview

This portfolio is not a collection of products.  
It is a map of systems: intent, constraints, experiments, and outcomes over time.

Each project below represents a decision boundary, not a pitch.

---

## System Notes

**Status:** Active · Deployed

System Notes replaces a traditional developer website with a structured, machine-readable system. It exists to show how projects, decisions, and evolution are mapped consistently over time, not to behave like a product.

The UI is intentionally agent-generated. I do not know Next.js well on purpose. I constrained the system and let the agent handle rendering so I could focus on structure, intent, and limits. For this proof of concept, all content is sourced directly from Markdown in the repository. The system is strictly read-only: no state, no memory, no interaction beyond reading.

This is currently the only deployed project in the portfolio. Search and richer navigation are planned via Algolia, but that is explicitly out of scope for now.

**Technical Specs**

- Runtime: Next.js, Python
- Rendering: Next.js
- Data source (POC): Markdown
- State: None (read-only)
- Agent memory: None
- Tests: Unit tests passing
- Deployment: Google Cloud Run
- Scope: Single-page portfolio backbone

---

## RAI Lint

**Status:** Active

RAI Lint enforces a single rule: if AI helped, that attribution must exist. Nothing more, nothing less.

It integrates directly into commit creation using native plugins for both JavaScript and Python ecosystems. Configuration is intentionally minimal, output behavior is user-controlled, and enforcement can be tuned from warnings to hard failures. The goal is not debate or policy theater. The goal is making invisible assistance explicit.

This is actively rolling out to a real team using non-blocking enforcement to encourage adoption without disruption.

**Technical Specs**

- Languages: Node.js, TypeScript, Python
- Type: commitlint + gitlint plugins
- Enforcement point: Commit creation
- Configuration: Minimal, user-controlled
- Execution: Local development and CI
- CI/Security: GitHub Actions, CodeQL, Dependabot, Sonar
- License: PolyForm Shield

---

## Awesome GitHub Copilot

**Status:** Active

This repository is a curated sharing layer, not a dumping ground.

Everything starts locally. I build prompts, agents, and skills for my own workflows first. If something survives real use, iteration, and feedback, it gets shared informally. Only after that does it get ported into this repository. Curation is manual by design. If something stops being useful, it does not belong here.

The repo functions as both an experimentation sandbox and an incubation layer before upstreaming or formalization.

**Technical Specs**

- Format: Markdown + configuration artifacts
- Scope: Copilot prompts, agents, skills
- Workflow: Local-first → feedback → public port
- Maintenance: Manual curation
- CI: Linting, formatting, conventional commits
- Platform: GitHub Copilot, ChatGPT, MCP-compatible patterns

---

## eslint-config-echo

**Status:** Active

Echo exists to consolidate linting rules so I can stop repeating myself.

It is a shared ESLint configuration designed to standardize behavior across repositories while supporting both legacy ESLint v8 and modern v9 flat config workflows. It prefers Sonar-aligned rules, allows Prettier, uses Jest for testing, and provides fallbacks where necessary.

It is intentionally boring. It reduces drift and friction. That is the feature.

**Technical Specs**

- Language: Node.js
- Type: ESLint configuration plugin
- Scope: Single repository at a time
- ESLint support: v8 and v9
- Test runner: Jest
- Formatter support: Prettier
- Static analysis: Sonar (preferred)
- CI/Security: GitHub Actions, enterprise baseline
- Publication status: Not published

---

## Underfoot: Underground Travel Planner

**Status:** Active · In Progress

Underfoot began as a hackathon project built with n8n and Bright Data. That approach worked under challenge constraints and failed immediately under real cost considerations. That failure forced a rethink.

The project was rewritten to push AI orchestration to its limits instead. The UI, backend, and data model were rebuilt using Python, React, and Supabase. Inputs are a mix of APIs and scraping. Output is strictly a chatbot that returns structured, React-like answer lists.

The project is unfinished. There are unresolved conflicts. The blocker is time, not direction.

**Technical Specs**

- Backend: Python
- Frontend: React
- Database: Supabase
- Data sources: APIs + scraping (mixed)
- Orchestration: Custom AI orchestration
- Output: Chatbot only
- Response format: React-like lists
- Status detail: In progress, unresolved conflicts

---

## Delegate Action

**Status:** Active · Experimental (POC)

Delegate is a GitHub Action that turns prompts into pull requests, not auto-merges.

Users provide a prompt via an existing file in the repository so GitHub can scan it first. The prompt is sanitized for known injection markers, and the flow is rejected if any are found. The action mimics a coding agent to analyze changes, identify documentation gaps, and open a new draft pull request with a new commit. The actor is signed as the reviewer to preserve human oversight.

It uses a personal PAT because service accounts are not currently viable. The largest blocker is that the GitHub CLI does not function correctly with the coding agent.

**Technical Specs**

- Type: GitHub Action
- Primary format: YAML
- Runtime: Node.js (tested 20–24)
- Trigger: Workflow / PR-based
- Input: Existing repository file
- Security: Prompt sanitization and injection detection
- Auth: Personal PAT
- Output: New commit + draft PR
- Status detail: Proof of concept

---

## Dev.to Mirror

**Status:** Active (planned move to CheckMarKDevTools)

DevToMirror is a set-and-forget utility designed to make technical writing discoverable by both humans and AI without operational overhead.

It runs on a GitHub Actions schedule shortly after weekly post deadlines and targets DEV only. Each run pulls new content and outputs static HTML to a GitHub Pages branch. A manual workflow dispatch allows full refreshes when needed. Output includes robots.txt, a sitemap, structured markup, and social cards.

**Technical Specs**

- Language: Python
- Trigger: GitHub Actions (scheduled + manual)
- Target: DEV only
- Output: Static HTML
- Hosting: GitHub Pages
- SEO/Discovery: robots.txt, sitemap, structured data, social cards

---

## My Hermantic Agent (Hermes)

**Status:** Active · WIP

Hermes is a fully local, self-hosted agentic system with no absolute prohibitions. Guardrails are defined entirely by the system prompt and change based on what is being explored.

Right now, the focus is memory. It is not optimized for usefulness, polish, or production. That is intentional. This is a zero-stakes environment designed for learning without pressure.

**Technical Specs**

- Type: Self-hosted agentic system
- Scope: Fully local
- Language: Python 3.12+
- LLMs: Local models via Ollama (Hermes-class)
- Memory: Short-term context + long-term semantic memory
- Storage: PostgreSQL, TimescaleDB, pgvector
- Embeddings: OpenAI
- Guardrails: System-prompt driven
- Deployment: None
- License: PolyForm Shield

---

## CheckMark Copilot Chat

**Status:** Archived

This was an early experiment in building a Copilot chat experience that was not tied to VS Code, targeting IntelliJ-heavy teams.

The core assumption proved false: GitHub Copilot chat context could not be persistently modified across turns in the way required. A workaround was identified and rejected as unsuitable for production. The project was sunset intentionally, but the underlying ideas later reappeared in Awesome GitHub Copilot as installable prompts, agents, and instructions.

**Technical Specs**

- Language: Node.js (best recollection)
- Type: Copilot extension experiment
- IDE targets: VS Code and IntelliJ via Copilot
- Core limitation: No persistent context modification
- Status detail: Archived by design
