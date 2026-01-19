export interface Project {
  id: string;
  title: string;
  status: string;
  description: string;
  longDescription: string;
  outcome: string;
  tech: { name: string; role: string }[];
  repoUrl: string;
  imageUrl?: string;
  owner: 'anchildress1' | 'CheckMarKDevTools';
}
export const allProjects: Project[] = [
  {
    id: 'system-notes',
    title: 'System Notes',
    status: 'Active · Deployed',
    description: 'A map of systems: intent, constraints, and outcomes over time.',
    longDescription:
      'This is not a traditional portfolio project. It is a deliberately time-boxed experiment in building a developer site almost entirely through AI generation. I intentionally avoided deep, manual investment in Next.js to constrain my role to system design, intent setting, and boundary definition, while ChatGPT handled the majority of ideation and written output. The project exists to capture how architectural decisions emerge, shift, and stabilize when authorship is shared between a human and an AI system.',
    outcome:
      'The result is a strictly read-only, AI-assembled backbone that replaces a conventional developer website. It demonstrates that clear structure, constraints, and declared intent outperform handcrafted polish when the goal is traceability, coherence, and long-term evolution rather than visual perfection.',
    tech: [
      { name: 'Gemini 3 Pro', role: 'The Architect' },
      { name: 'Antigravity', role: 'Orchestration Layer' },
      { name: 'Google Cloud Run', role: 'Runtime' },
      { name: 'ChatGPT', role: 'The Manager' },
      { name: 'GPT 5.2', role: 'Conversational Interface' },
    ],
    repoUrl: 'https://github.com/anchildress1/system-notes',
    owner: 'anchildress1',
    imageUrl: '/projects/system-notes.jpg',
  },
  {
    id: 'rai-lint',
    title: 'RAI Lint',
    status: 'Active',
    description: 'Attribution enforcement: if AI helped, that attribution must exist.',
    longDescription:
      'Security through transparency. This tool integrates directly into commit workflows to enforce AI attribution. It is not policy theater; it is a hard technical boundary. Nothing more, nothing less. If you use tools, you cite them.',
    outcome:
      'Rolling out to live teams. It turns invisible assistance into explicit, trackable data without disrupting the flow state.',
    tech: [
      { name: 'TypeScript', role: 'Rule Logic' },
      { name: 'Python', role: 'Git Hooks' },
      { name: 'commitlint', role: 'Enforcement Engine' },
      { name: 'PolyForm Shield', role: 'License' },
    ],
    repoUrl: 'https://github.com/CheckMarKDevTools/rai-lint',
    owner: 'CheckMarKDevTools',
    imageUrl: '/projects/rai-lint.jpg',
  },
  {
    id: 'underfoot-underground-travel-planner',
    title: 'Underfoot',
    status: 'Active · In Progress',
    description: 'A failed hackathon project rewritten to push AI orchestration to its limits.',
    longDescription:
      'Started as a standard travel app that failed under real-world cost constraints. I tore it down and rebuilt it as a pure AI orchestration challenge. The goal shifted from "ranking destinations" to "narrative discovery" using a custom orchestrator to bypass traditional API limits.',
    outcome:
      'Unfinished, but instructive. The failure forced a pivot from "consuming APIs" to "synthesizing data," effectively turning a cost problem into an architecture project.',
    tech: [
      { name: 'Python', role: 'The Orchestrator' },
      { name: 'Supabase', role: 'The Brain' },
      { name: 'React', role: 'The Face' },
      { name: 'Scraping', role: 'Data Ingestion' },
    ],
    repoUrl: 'https://github.com/CheckMarKDevTools/underfoot-underground-travel-planner',
    owner: 'CheckMarKDevTools',
    imageUrl: '/projects/underfoot-underground-travel-planner.jpg',
  },
  {
    id: 'awesome-github-copilot',
    title: 'Awesome GitHub Copilot',
    status: 'Active',
    description: 'A curated cultivation layer for prompts, agents, and skills.',
    longDescription:
      'This is where my workflows go to survive. It is not a link dump; it is a graduation stage. I build tools for myself locally, and only the ones that survive daily abuse get polished and promoted here. It serves as the bridge between "it works on my machine" and "community standard."',
    outcome:
      'My most successful open-source contribution. It proves that curation and utility beat volume every time.',
    tech: [
      { name: 'Markdown', role: 'The Format' },
      { name: 'GitHub Copilot', role: 'The Platform' },
      { name: 'MCP', role: 'Agent Protocols' },
      { name: 'Manual Curation', role: 'Quality Control' },
    ],
    repoUrl: 'https://github.com/anchildress1/awesome-github-copilot',
    owner: 'anchildress1',
    imageUrl: '/projects/awesome-github-copilot.jpg',
  },
  {
    id: 'eslint-config-echo',
    title: 'Echo',
    status: 'Active',
    description: 'I got tired of repeating myself, so I codified my opinions.',
    longDescription:
      'A boring, reliable, shared configuration. It supports both legacy and modern flat configs because migration is messy and I needed a bridge. It enforces Sonar consistency so I can focus on logic, not spaces.',
    outcome:
      'Reduces drift. Removes "nitpick" comments from code reviews. It is a feature because it is invisible.',
    tech: [
      { name: 'Node.js', role: 'Ecosystem' },
      { name: 'ESLint', role: 'The Enforcer' },
      { name: 'Jest', role: 'Verification' },
      { name: 'Sonar', role: 'Static Analysis' },
    ],
    repoUrl: 'https://github.com/CheckMarKDevTools/eslint-config-echo',
    owner: 'CheckMarKDevTools',
    imageUrl: '/projects/eslint-config-echo.jpg',
  },
  {
    id: 'delegate-action',
    title: 'Delegate Action',
    status: 'Active (POC)',
    description: 'Turning prompts into Pull Requests (with humans in the loop).',
    longDescription:
      'Service accounts are hard; delegation is easier. This Action acts as a coding agent that takes a prompt, generates a draft PR, and signs me as the reviewer. It solves the "blank page" problem by forcing the AI to show its work before merging.',
    outcome:
      "A working Proof of Concept that bypasses the need for complex bot permissions by leveraging the user's own review flow.",
    tech: [
      { name: 'GitHub Actions', role: 'The Runtime' },
      { name: 'Node.js', role: 'Logic Layer' },
      { name: 'Security', role: 'Injection Detection' },
      { name: 'PAT', role: 'Auth Bypass' },
    ],
    repoUrl: 'https://github.com/CheckMarKDevTools/delegate-action',
    owner: 'CheckMarKDevTools',
    imageUrl: '/projects/delegate-action.jpg',
  },
  {
    id: 'devto-mirror',
    title: 'Dev.to Mirror',
    status: 'Active',
    description: 'Set-and-forget discovery optimization for technical writing.',
    longDescription:
      'I write on DEV, but I need discovery everywhere. This running cron job pulls my content, formats it for SEO/AI crawlers, and deploys it to a static site. No analytics, no maintenance, just pure signal amplification.',
    outcome:
      'Zero-touch operation that increased inbound traffic and AI visibility without adding a single minute of maintenance time.',
    tech: [
      { name: 'Python', role: 'The Script' },
      { name: 'GitHub Actions', role: 'The Cron' },
      { name: 'GitHub Pages', role: 'The Host' },
      { name: 'SEO', role: 'The Goal' },
    ],
    repoUrl: 'https://github.com/CheckMarKDevTools/devto-mirror',
    owner: 'CheckMarKDevTools',
    imageUrl: '/projects/devto-mirror.jpg',
  },
  {
    id: 'my-hermantic-agent',
    title: 'Hermes Agent',
    status: 'Active (WIP)',
    description: 'A zero-stakes laboratory for breaking AI memory models.',
    longDescription:
      'I needed a place to break things safely. Hermes is a fully local, forbidden-free zone where I test long-term memory architectures and tool-use patterns. It is not polished. It is not safe. It is where I learn how the brain works by building a messy one.',
    outcome:
      'A chaotic, functional research sandbox that informs the architecture of my production tools.',
    tech: [
      { name: 'Python', role: 'The Mind' },
      { name: 'Ollama', role: 'The Engine' },
      { name: 'PostgreSQL', role: 'Long-term Memory' },
      { name: 'Local', role: 'The Environment' },
    ],
    repoUrl: 'https://github.com/anchildress1/my-hermantic-agent',
    owner: 'anchildress1',
    imageUrl: '/projects/my-hermantic-agent.jpg',
  },
  {
    id: 'checkmark-copilot-chat',
    title: 'Copilot Chat Extension',
    status: 'Archived',
    description: 'Hypothesis: Chat context is portable. Result: False.',
    longDescription:
      'I tried to build a portable Copilot chat context for IntelliJ teams. I failed. The API did not support the persistence I needed. I archived it immediately. Knowing when to kill a project is just as important as knowing when to ship one.',
    outcome:
      'Archived. The failure saved me months of wasted effort and redirected focus to the Awesome Copilot project.',
    tech: [
      { name: 'Copilot Chat', role: 'The Constraint' },
      { name: 'JavaScript', role: 'The Glue' },
      { name: 'Failure', role: 'The Lesson' },
    ],
    repoUrl: 'https://github.com/CheckMarKDevTools/checkmark-copilot-chat',
    owner: 'CheckMarKDevTools',
    imageUrl: '/projects/checkmark-copilot-chat.jpg',
  },
];
