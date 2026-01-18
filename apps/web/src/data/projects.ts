export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  tech: string[];
  repoUrl: string;
  imageUrl?: string;
  owner: 'anchildress1' | 'CheckMarKDevTools';
}

export const allProjects: Project[] = [
  {
    id: 'system-notes',
    title: 'System Notes',
    description: 'My living, system-mapped developer portfolio. Recursion is fun, right?',
    longDescription:
      'System Notes is a hackathon I’d been designing quietly in my head for almost a year—deliberate thinking, building the system internally, zero doing. Then the opportunity presented itself nearly perfectly, the planets aligned, and I jumped. I instantly knew it needed a real home and bit the bullet on a new domain name at ChatGPT’s insistence. This is a slight show off, but mostly a guidebook for how I consistently map systems.',
    tech: ['systems-thinking', 'documentation', 'technical-writing', 'portfolio'],
    repoUrl: 'https://github.com/anchildress1/system-notes',
    owner: 'anchildress1',
    imageUrl: '/projects/system-notes.png',
  },
  {
    id: 'underfoot-underground-travel-planner',
    title: 'Underfoot: Underground Travel',
    description:
      'A travel planner experiment built to surface unconventional and off-grid locations.',
    longDescription:
      'Underfoot started as a hackathon project, but I always knew I wanted to keep it. I knew what needed to be done, and I knew I needed to push AI harder—there were more limits to find. It’s currently waiting on me to come back and do the cleanup it deserves, but it’s far from done. The edges are where the interesting work still lives.',
    tech: ['ai-agents', 'typescript', 'data-aggregation', 'exploration'],
    repoUrl: 'https://github.com/CheckMarKDevTools/underfoot-underground-travel-planner',
    owner: 'CheckMarKDevTools',
    imageUrl: '/projects/underfoot-underground-travel-planner.png',
  },
  {
    id: 'my-hermantic-agent',
    title: 'My Hermantic Agent (Hermes)',
    description: 'A self-hosted agentic system built entirely on my terms.',
    longDescription:
      'Hermes is designed to be a custom, self-hosted agentic system that handles things the way I want them handled. It’s intentionally one gigantic experimental learning environment with zero stakes. That’s the fun part. The lack of pressure to actually do it—well… that’s also the biggest problem.',
    tech: ['python', 'agentic-systems', 'experimentation', 'self-hosted-ai'],
    repoUrl: 'https://github.com/anchildress1/my-hermantic-agent',
    owner: 'anchildress1',
    imageUrl: '/projects/my-hermantic-agent.png',
  },
  {
    id: 'awesome-github-copilot',
    title: 'Awesome GitHub Copilot',
    description: 'Hoarding prompts like a digital dragon.',
    longDescription:
      'This repo has been designed, redesigned, gathered feedback, tweaked, then immediately stress-tested by new models—repeat until actually useful. When something finally proves itself in real workflows, it gets ported here so others can skip the same iteration loop. Most of what’s here earned its place through repetition, not novelty.',
    tech: ['github-copilot', 'ai-agents', 'developer-experience', 'prompt-engineering'],
    repoUrl: 'https://github.com/anchildress1/awesome-github-copilot',
    owner: 'anchildress1',
    imageUrl: '/projects/awesome-github-copilot.png',
  },
  {
    id: 'rai-lint',
    title: 'RAI Lint',
    description: 'Linting tools that enforce explicit AI attribution in commit workflows.',
    longDescription:
      'RAI Lint is me refusing to be quiet about the usefulness of AI in a climate where everyone seems determined to be a hater. If AI helped, document it. This tooling enforces that decision directly at commit creation, making AI attribution explicit at the moment work is recorded. It’s already being rolled out to my team at work—whether they want it or not.',
    tech: ['developer-governance', 'ai-attribution', 'linting', 'workflow-enforcement'],
    repoUrl: 'https://github.com/CheckMarKDevTools/rai-lint',
    owner: 'CheckMarKDevTools',
    imageUrl: '/projects/rai-lint.png',
  },
  {
    id: 'checkmark-delegate',
    title: 'CheckMarK Delegate',
    description:
      'A proof-of-concept exploring delegation and responsibility where the platform isn’t ready yet.',
    longDescription:
      'Delegate came after another failed attempt to force GitHub into doing something they’re clearly not ready for yet. Based on historical trends, they’ll probably fix it right around the time I get this POC officially running. That’s only mildly annoying. The more annoying part is waiting quietly while nothing happens—so this is happening instead, however short-lived it ends up being.',
    tech: ['systems-design', 'delegation', 'proof-of-concept', 'experimentation'],
    repoUrl: 'https://github.com/CheckMarKDevTools/checkmark-delegate',
    owner: 'CheckMarKDevTools',
    imageUrl: '/projects/delegate-action.png',
  },
  {
    id: 'checkmark-echo',
    title: 'CheckMarK Echo',
    description: 'A small ESLint plugin to consolidate shared configuration.',
    longDescription:
      'Echo is a small ESLint plugin I built so I can stop repeating myself at work. It consolidates shared configuration into one place, is enterprise-ready by design, and the job itself only cost me a few-ish Copilot requests to get done. Win-win.',
    tech: ['eslint', 'developer-tooling', 'configuration', 'enterprise-ready'],
    repoUrl: 'https://github.com/CheckMarKDevTools/checkmark-echo',
    owner: 'CheckMarKDevTools',
    imageUrl: '/projects/eslint-config-echo.png',
  },
  {
    id: 'devto-mirror',
    title: 'Dev.to Mirror',
    description: 'A lightweight tool to mirror Dev.to content into static, crawlable pages.',
    longDescription:
      'My blogging started with one purpose—to give myself a reusable “the answer you seek is there” reference for Copilot questions at work. If I’m writing it for ten people, it might as well work for more. The mirror exists because SEO alone isn’t enough anymore—I need AI systems to find it too. So I optimized for crawly things and voilà. Fork away if you want the same setup. For most cases it’s a couple configs, a schedule, and then you forget about it.',
    tech: ['python', 'automation', 'content-systems', 'discoverability'],
    repoUrl: 'https://github.com/anchildress1/devto-mirror',
    owner: 'anchildress1',
    imageUrl: '/projects/devto-mirror.png',
  },
  {
    id: 'checkmark-copilot-chat',
    title: 'CheckMarK Copilot Chat',
    description: 'An early experiment in making Copilot customization portable and shareable.',
    longDescription:
      'This was one of my first attempts to make custom Copilot instructions easy to share without forcing people to copy-paste fragile blobs of text. It predates MCP and Awesome Copilot. GitHub ultimately made this approach impossible, but Verdent and I had a fun time trying—mostly fun.',
    tech: ['developer-tools', 'copilot-experiments', 'nodejs', 'ai-infrastructure'],
    repoUrl: 'https://github.com/CheckMarKDevTools/checkmark-copilot-chat',
    owner: 'CheckMarKDevTools',
    imageUrl: '/projects/checkmark-copilot-chat.png',
  },
];
