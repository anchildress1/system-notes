export interface Project {
  id: string;
  title: string;
  status: string;
  description: string;
  purpose: string;
  longDescription: string;
  outcome: string;
  tech: { name: string; role: string }[];
  repoUrl: string;
  imageUrl?: string;
  owner: 'anchildress1' | 'CheckMarKDevTools';
  blogs?: { title: string; url: string }[];
}

export const allProjects: Project[] = [
  {
    id: 'system-notes',
    title: 'System Notes',
    status: 'Active · Deployed',
    description: 'AI-generated challenge site used to test orchestration and authorship boundaries.',
    purpose: 'Built to satisfy a required challenge deliverable and used as a controlled AI experiment with Antigravity.',
    longDescription:
      'System Notes exists because the challenge required a site, and I treated that requirement as another AI experiment. Instead of hand-authoring a polished portfolio, I delegated structure and content generation to Antigravity and ChatGPT while constraining scope, intent, and boundaries. The value is not the site itself, but the traceability of decisions made when AI assembles a system under human supervision.',
    outcome:
      'A strictly read-only, AI-assembled site that documents decision boundaries rather than presenting a curated portfolio narrative.',
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
    blogs: [
      {
        title: 'Can We Set the Record Straight? AI Content and a Bit of Sanity',
        url: 'https://dev.to/anchildress1/can-we-set-the-record-straight-ai-content-and-a-bit-of-sanity-1inj',
      },
      {
        title: 'Waiting With Intent: Designing AI Systems for the Long Game',
        url: 'https://dev.to/anchildress1/waiting-with-intent-designing-ai-systems-for-the-long-game-1abg',
      },
      {
        title: 'Fact Checking the Fear Behind the Dark Side of AI',
        url: 'https://dev.to/anchildress1/fact-checking-the-fear-behind-the-dark-side-of-ai-the-real-story-366p',
      },
    ],
  },

  {
    id: 'delegate-action',
    title: 'Delegate Action',
    status: 'Active · POC',
    description: 'Temporary AI coding agent implemented as a GitHub Action.',
    purpose: 'Placeholder solution until Copilot coding agent supports valid user PAT tokens via CLI in GitHub Actions.',
    longDescription:
      'Delegate Action exists because the functionality I wanted does not yet exist in Copilot. I needed AI-generated pull requests immediately, under my own credentials, without waiting on upstream support. This Action fills that gap by generating draft PRs using my PAT, with explicit human review and ownership.',
    outcome:
      'A working stopgap that enables AI-generated PRs today while waiting for native platform support.',
    tech: [
      { name: 'GitHub Actions', role: 'The Runtime' },
      { name: 'Node.js', role: 'Logic Layer' },
      { name: 'Security', role: 'Injection Detection' },
      { name: 'PAT', role: 'Auth Shortcut' },
    ],
    repoUrl: 'https://github.com/CheckMarKDevTools/delegate-action',
    owner: 'CheckMarKDevTools',
    imageUrl: '/projects/delegate-action.jpg',
  },

  {
    id: 'my-hermantic-agent',
    title: 'Hermes Agent',
    status: 'Active · In Progress',
    description: 'Personal AI agent playground with early memory experiments.',
    purpose: 'A zero-stakes environment to experiment with memory and agent behavior for a personal local AI system.',
    longDescription:
      'Hermes is a personal playground where I am starting with memory as a first-class concern while the stakes are low. I use it to explore how an agent behaves when memory exists, evolves, and occasionally misbehaves, without production pressure or polish influencing decisions.',
    outcome:
      'A functional local sandbox that informs future agent and memory design decisions.',
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
    id: 'rai-lint',
    title: 'RAI Lint',
    status: 'Active · Published',
    description: 'Hard enforcement for AI attribution in commit workflows.',
    purpose: 'To make AI usage explicit and enforceable instead of implied and ignored.',
    longDescription:
      'RAI Lint integrates directly into commit workflows to require explicit attribution when AI tools are used. It is intentionally strict and mechanical. The goal is traceability, not policy theater.',
    outcome:
      'Live adoption that turns invisible AI assistance into explicit, auditable data.',
    tech: [
      { name: 'TypeScript', role: 'Rule Logic' },
      { name: 'Python', role: 'Rule Logic' },
      { name: 'commitlint', role: 'Node Enforcement' },
      { name: 'gitlint', role: 'Python Enforcement' },
      { name: 'PolyForm Shield', role: 'License' },
    ],
    repoUrl: 'https://github.com/CheckMarKDevTools/rai-lint',
    owner: 'CheckMarKDevTools',
    imageUrl: '/projects/rai-lint.jpg',
    blogs: [
      {
        title: 'Is GitHub Copilot Safe? The Fun and Hard Truth About Responsible AI',
        url: 'https://dev.to/anchildress1/is-github-copilot-safe-the-fun-and-hard-truth-about-responsible-ai-3b95',
      },
      {
        title: 'Did AI Erase Attribution? Your Git History is Missing a Co-Author',
        url: 'https://dev.to/anchildress1/did-ai-erase-attribution-your-git-history-is-missing-a-co-author-1m2l',
      },
      {
        title: 'Signing Your Name on AI-Assisted Commits with RAI Footers',
        url: 'https://dev.to/anchildress1/signing-your-name-on-ai-assisted-commits-with-rai-footers-2b0o',
      },
    ],
  },

  {
    id: 'underfoot-underground-travel-planner',
    title: 'Underfoot',
    status: 'Active · In Progress',
    description: 'Narrative travel discovery explored through AI orchestration experiments.',
    purpose: 'To explore AI orchestration and narrative synthesis using a real-world travel discovery problem.',
    longDescription:
      'Underfoot began as a travel discovery hackathon and was repurposed as an AI orchestration experiment once real-world constraints shaped its direction. Rather than redesigning the system from scratch, I used the existing application as a surface for testing orchestration patterns and parallel workflows. The project focuses on how AI can generate discovery paths and context from incomplete systems.',
    outcome:
      'An unfinished but instructive experiment that reframed cost failure as an orchestration problem. At least, until I get back to it...',
    tech: [
      { name: 'Python', role: 'The Orchestrator' },
      { name: 'Supabase', role: 'The Brain' },
      { name: 'React', role: 'The Face' },
      { name: 'Data Ingestion', role: 'Sourcing' },
    ],
    repoUrl: 'https://github.com/CheckMarKDevTools/underfoot-underground-travel-planner',
    owner: 'CheckMarKDevTools',
    imageUrl: '/projects/underfoot-underground-travel-planner.jpg',
    blogs: [
      {
        title: "Underfoot: The Chatpot for Hidden Places and Why I Don't Do Hackathons",
        url: 'https://dev.to/anchildress1/underfoot-the-chatpot-for-hidden-places-and-why-i-dont-do-hackathons-2684',
      },
      {
        title: 'The Hackathon I Swore Off and the Exhaustion That Mostly Compiled',
        url: 'https://dev.to/anchildress1/the-hackathon-i-swore-off-and-the-exhaustion-that-mostly-compiled-c4l',
      },
    ],
  },

  {
    id: 'awesome-github-copilot',
    title: 'Awesome GitHub Copilot',
    status: 'Active',
    description: 'Curated GitHub Copilot workflows, agents, and patterns.',
    purpose: 'A place for GitHub Copilot tools and patterns that earned their keep instead of just sounding clever.',
    longDescription:
      'This repo is not a list and not neutral. I build a lot of Copilot-assisted tooling locally, and most of it dies there. Only workflows that survive daily use, frustration, and edge cases make it into this repository. It reflects how I actually work with Copilot, not how documentation suggests I should.',
    outcome:
      'A widely adopted resource that favors practical utility over volume.',
    tech: [
      { name: 'Markdown', role: 'The Format' },
      { name: 'GitHub Copilot', role: 'The Platform' },
      { name: 'MCP', role: 'Agent Protocols' },
      { name: 'Manual Curation', role: 'Quality Control' },
    ],
    repoUrl: 'https://github.com/anchildress1/awesome-github-copilot',
    owner: 'anchildress1',
    imageUrl: '/projects/awesome-github-copilot.jpg',
    blogs: [
      {
        title: 'Troubleshooting Production with GitHub Copilot',
        url: 'https://dev.to/anchildress1/troubleshooting-production-with-github-copilot-the-guide-for-real-humans-and-bots-with-good-taste-253o',
      },
      {
        title: "Oh I Have Big News—I'm GitHub Copilot Certified!",
        url: 'https://dev.to/anchildress1/oh-i-have-big-news-guess-what-i-got-yesterday-1jca',
      },
      {
        title: 'Everything I Know About GitHub Copilot Instructions',
        url: 'https://dev.to/anchildress1/everything-i-know-about-github-copilot-instructions-from-zero-to-onboarded-for-real-4nb0',
      },
      {
        title: 'GitHub Copilot Chat Modes Explained with Personality',
        url: 'https://dev.to/anchildress1/github-copilot-chat-modes-explained-with-personality-2f4c',
      },
      {
        title: 'Leash not Autopilot: Building Predictable AI Behavior with Copilot Instructions',
        url: 'https://dev.to/anchildress1/leash-not-autopilot-building-predictable-ai-behavior-with-copilot-instructions-14ip',
      },
    ],
  },

  {
    id: 'devto-mirror',
    title: 'Dev.to Mirror',
    status: 'Active',
    description: 'Automated AI-optimized mirror of technical writing.',
    purpose: 'To make long-form technical writing legible to AI systems.',
    longDescription:
      'Dev.to Mirror pulls my DEV posts, restructures them for AI ingestion, and deploys them automatically. This is not SEO or analytics-driven optimization. It exists to ensure AI systems can correctly index and reference my work.',
    outcome:
      'Increased AI discoverability with zero ongoing maintenance.',
    tech: [
      { name: 'Python', role: 'The Script' },
      { name: 'GitHub Actions', role: 'The Cron' },
      { name: 'GitHub Pages', role: 'The Host' },
      { name: 'AI Discoverability', role: 'The Goal' },
    ],
    repoUrl: 'https://github.com/CheckMarKDevTools/devto-mirror',
    owner: 'CheckMarKDevTools',
    imageUrl: '/projects/devto-mirror.jpg',
    blogs: [
      {
        title: 'Weekend Hack: Making My Blog AI Searchable (No Flames Required)',
        url: 'https://dev.to/anchildress1/weekend-hack-making-my-blog-ai-searchable-no-flames-required-16h5',
      },
    ],
  },

  {
    id: 'eslint-config-echo',
    title: 'Echo',
    status: 'Active · Testing',
    description: 'Reusable linting boundaries designed for AI-assisted codebases.',
    purpose: 'To provide AI strict, reusable formatting and linting constraints across projects.',
    longDescription:
      'Echo exists primarily for AI, not humans. By collapsing formatting and linting rules into a single shared configuration, I can reuse the same boundaries across projects and AI agents without restating preferences.',
    outcome:
      'Reduced drift and predictable AI-assisted code output.',
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
    id: 'checkmark-copilot-chat',
    title: 'Copilot Chat Extension',
    status: 'Archived',
    description: 'Failed experiment in portable Copilot chat context.',
    purpose: 'To test whether Copilot chat context could persist across environments.',
    longDescription:
      'I attempted to build portable Copilot chat context for IntelliJ teams and discovered the API could not support the persistence required. The project was archived immediately to avoid wasted effort.',
    outcome:
      'A falsified hypothesis that redirected focus to more viable Copilot tooling.',
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
