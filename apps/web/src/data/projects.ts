export interface Project {
  id: string;
  title: string;
  status: string;
  description: string;
  longDescription: string;
  outcome: string;
  tech: string[];
  repoUrl: string;
  imageUrl?: string;
  owner: 'anchildress1' | 'CheckMarKDevTools';
}

export const allProjects: Project[] = [
  {
    id: 'system-notes',
    title: 'System Notes',
    status: 'Active',
    description: 'A living, queryable system map of projects, decisions, and evolution over time.',
    longDescription:
      'System Notes replaces a traditional developer website with a structured, machine-readable system. Projects are treated as evolving systems with relationships, intent, and history, designed to be navigated by both humans and AI. Includes an interactive chatbot that allows users to query and explore the system as designed. This interface is currently a proof of concept, with additional enhancements planned as part of the Algolia challenge.',
    outcome:
      'Early-stage system that is already stable enough to serve as a live portfolio backbone. Validation to date is qualitative, with planned expansion of the interactive layer.',
    tech: [
      'Markdown-first documentation',
      'GitHub repository–driven system modeling',
      'AI-assisted navigation and context layering',
      'Chat-based interface (POC)',
    ],
    repoUrl: 'https://github.com/anchildress1/system-notes',
    owner: 'anchildress1',
    imageUrl: '/projects/system-notes.png',
  },
  {
    id: 'underfoot-underground-travel-planner',
    title: 'Underfoot: Underground Travel Planner',
    status: 'Active',
    description: 'An experimental travel planner for discovering hidden, off-grid destinations.',
    longDescription:
      'A full-stack application that surfaces unconventional travel destinations using narrative context rather than ranking algorithms, prioritizing discovery over optimization.',
    outcome:
      'Shipped as the first hackathon project in nearly 20 years. Did not place, but produced a complete concept and informed a documented postmortem and follow-up writing.',
    tech: [
      'JavaScript / TypeScript',
      'Full-stack web application',
      'AI-assisted discovery and scoring logic',
      'Privacy-first data handling',
    ],
    repoUrl: 'https://github.com/CheckMarKDevTools/underfoot-underground-travel-planner',
    owner: 'CheckMarKDevTools',
    imageUrl: '/projects/underfoot-underground-travel-planner.png',
  },
  {
    id: 'checkmark-echo',
    title: 'eslint-config-echo',
    status: 'Active',
    description: 'Enterprise ESLint configuration with dual v8 and v9 support.',
    longDescription:
      'A shared ESLint configuration package designed to standardize linting across repositories while supporting both legacy ESLint v8 and modern v9 flat config workflows.',
    outcome:
      'Adopted in a real production codebase to reduce configuration drift and standardize linting behavior.',
    tech: ['JavaScript', 'ESLint', 'Prettier', 'Sonar-aligned rule sets', 'Node.js ecosystem'],
    repoUrl: 'https://github.com/CheckMarKDevTools/checkmark-echo',
    owner: 'CheckMarKDevTools',
    imageUrl: '/projects/eslint-config-echo.png',
  },
  {
    id: 'checkmark-delegate',
    title: 'Delegate Action',
    status: 'Active (Experimental)',
    description: 'A GitHub Action that turns prompts into pull requests, not auto-merges.',
    longDescription:
      'A theoretical human-in-the-loop automation pattern designed to compensate for the absence of a reliable coding agent in GitHub Actions. Generates changes, opens a pull request, and enforces review boundaries.',
    outcome:
      'Design-stage solution informed by prior experience with similar automation flows. Not yet production-tested, but early outlook is positive.',
    tech: [
      'GitHub Actions',
      'JavaScript / Node.js',
      'GitHub Copilot',
      'CI security and quality gates',
      'Responsible AI attribution enforcement',
    ],
    repoUrl: 'https://github.com/CheckMarKDevTools/checkmark-delegate',
    owner: 'CheckMarKDevTools',
    imageUrl: '/projects/delegate-action.png',
  },
  {
    id: 'devto-mirror',
    title: 'Dev.to Mirror',
    status: 'Active (planned move to CheckMarkDevTools)',
    description: 'A set-and-forget static mirror for Dev.to blogs.',
    longDescription:
      'Automatically generates a static, crawlable mirror of Dev.to content optimized for search and AI discovery while preserving canonical links to original posts.',
    outcome:
      'Successfully increased inbound discovery across search engines, syndication networks, and AI tools without requiring analytics infrastructure or operational overhead.',
    tech: [
      'JavaScript',
      'Static site generation',
      'HTML-first output',
      'GitHub Pages–compatible structure',
      'Search and AI discoverability optimization',
    ],
    repoUrl: 'https://github.com/anchildress1/devto-mirror',
    owner: 'anchildress1',
    imageUrl: '/projects/devto-mirror.png',
  },
  {
    id: 'rai-lint',
    title: 'RAI Lint',
    status: 'Active',
    description: 'Dual-language commit validation enforcing Responsible AI attribution.',
    longDescription:
      'A validation framework that enforces explicit AI attribution in commits using structured footers, with native plugins for both JavaScript (commitlint) and Python (gitlint).',
    outcome:
      'Works reliably in daily workflows and is gradually being adopted by the team using non-blocking warnings to encourage compliance without disruption.',
    tech: [
      'JavaScript',
      'TypeScript',
      'Python',
      'Node.js',
      'commitlint',
      'gitlint',
      'ESLint',
      'GitHub Actions',
      'SonarCloud',
      'Codecov',
      'Polyform Shield License',
    ],
    repoUrl: 'https://github.com/CheckMarKDevTools/rai-lint',
    owner: 'CheckMarKDevTools',
    imageUrl: '/projects/rai-lint.png',
  },
  {
    id: 'awesome-github-copilot',
    title: 'Awesome GitHub Copilot',
    status: 'Active',
    description: 'A curated collection of Copilot instructions, prompts, and agents.',
    longDescription:
      'A structured library of reusable Copilot instructions, prompts, and agent configurations labeled by lifecycle stage, serving as both an experimentation sandbox and an incubation space before upstreaming.',
    outcome:
      'By far the most shared and starred project in the portfolio, exceeding expectations and demonstrating strong community interest.',
    tech: [
      'Node.js (24.x)',
      'Markdown-based prompt and instruction system',
      'GitHub Copilot',
      'ChatGPT',
      'MCP-compatible agent patterns',
    ],
    repoUrl: 'https://github.com/anchildress1/awesome-github-copilot',
    owner: 'anchildress1',
    imageUrl: '/projects/awesome-github-copilot.png',
  },
  {
    id: 'my-hermantic-agent',
    title: 'My Hermantic Agent (Hermes)',
    status: 'Active (WIP)',
    description: 'A self-hosted, tool-using AI agent with long-term memory.',
    longDescription:
      'A CLI-driven autonomous agent built around a reasoning-capable local LLM, combining short-term conversational context with long-term semantic memory, tool usage, and persistent state.',
    outcome:
      'Early-stage research project exploring agent autonomy, memory design, and local-first AI systems.',
    tech: [
      'Python 3.12+',
      'Ollama',
      'NousResearch Hermes-4-14B',
      'Hugging Face models',
      'OpenAI embeddings',
      'PostgreSQL',
      'TimescaleDB',
      'pgvector',
      'GitHub Copilot',
      'ChatGPT',
      'Polyform Shield License',
    ],
    repoUrl: 'https://github.com/anchildress1/my-hermantic-agent',
    owner: 'anchildress1',
    imageUrl: '/projects/my-hermantic-agent.png',
  },
  {
    id: 'checkmark-copilot-chat',
    title: 'CheckMarK Copilot Chat',
    status: 'Archived',
    description: 'An early experiment in portable Copilot chat workflows.',
    longDescription:
      'Explored reusable Copilot chat configuration patterns. Archived after a core assumption proved false: chat context is not meaningfully editable in the way required. A workaround was identified but deemed unsuitable for a production product.',
    outcome: 'Hypothesis disproven, boundary documented, project archived intentionally.',
    tech: ['GitHub Copilot Chat', 'JavaScript', 'Early MCP-adjacent experimentation'],
    repoUrl: 'https://github.com/CheckMarKDevTools/checkmark-copilot-chat',
    owner: 'CheckMarKDevTools',
    imageUrl: '/projects/checkmark-copilot-chat.png',
  },
];
