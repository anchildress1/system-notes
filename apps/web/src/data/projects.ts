export interface Project {
    id: string;
    title: string;
    description: string;
    longDescription?: string;
    tech: string[];
    repoUrl: string;
    imageUrl?: string;
    isOrg?: boolean;
}

export const personalProjects: Project[] = [
    {
        id: 'system-notes',
        title: 'System Notes',
        description: 'My living, system-mapped developer portfolio. Recursion is fun, right? :unicorn:',
        longDescription: 'WIP: A living, system-mapped developer portfolio with versioned projects. Built to replace the static "Hire Me" site with something that actually breaks occasionally. It uses Next.js, Framer Motion, and a healthy dose of over-engineering.',
        tech: ['Next.js', 'Framer Motion', 'TypeScript', 'Chaos'],
        repoUrl: 'https://github.com/anchildress1/system-notes',
    },
    {
        id: 'awesome-github-copilot',
        title: 'Awesome GitHub Copilot',
        description: 'Hoarding prompts like a digital dragon. :unicorn:',
        longDescription: 'My ongoing WIP 🏗️ AI prompts, custom agents, skills & instructions - curated by me (and Copilot + ChatGPT). If you need to know how to make Copilot bake a cake, this is probably where it lives.',
        tech: ['Markdown', 'AI', 'Prompts'],
        repoUrl: 'https://github.com/anchildress1/awesome-github-copilot',
    },
    {
        id: 'devto-mirror',
        title: 'Dev.to Mirror',
        description: 'Because relying on one platform is a rookie mistake. :unicorn:',
        longDescription: 'Static GitHub Pages mirror for any Dev.to blog for faster AI + search crawler indexing (canonical stays on Dev.to). Redundancy is the best policy.',
        tech: ['GitHub Actions', 'Jekyll', 'Automation'],
        repoUrl: 'https://github.com/anchildress1/devto-mirror',
        imageUrl: 'https://github.com/anchildress1/devto-mirror/raw/main/assets/readme-header.png',
    },
    {
        id: 'my-hermantic-agent',
        title: 'My Hermantic Agent',
        description: 'A playground for Hermes-4-14B. Zero guardrails. What could go wrong? :unicorn:',
        longDescription: '🏗️ WIP: A small but dangerous playground for Hermes-4-14B: hybrid reasoning, tool use, dual memory, and zero guardrails. Because "safe AI" is boring AI.',
        tech: ['Python', 'LLMs', 'Hermes', 'Danger'],
        repoUrl: 'https://github.com/anchildress1/my-hermantic-agent',
        imageUrl: 'https://github.com/anchildress1/my-hermantic-agent/raw/main/assets/my-hermantic-agent.jpg',
    },
];

export const orgProjects: Project[] = [
    {
        id: 'rai-lint',
        title: 'RAI-Lint',
        description: 'Responsible AI linter. Because your AI needs a babysitter. :unicorn:',
        longDescription: 'Dual-language linter for Responsible AI commit footers — shared logic for Node (@commitlint) and Python (gitlint). Keeping the robots honest, one commit at a time.',
        tech: ['TypeScript', 'Python', 'Linter'],
        repoUrl: 'https://github.com/CheckMarKDevTools/rai-lint',
        imageUrl: 'https://github.com/CheckMarKDevTools/rai-lint/raw/main/docs/assets/rai-lint-banner.png',
        isOrg: true,
    },
    {
        id: 'eslint-config-echo',
        title: 'ESLint Config Echo',
        description: 'Standardizing opinions so you don\'t have to. :unicorn:',
        longDescription: '🏗️ WIP: Enterprise ESLint plugin repo that ships dual v8/v9 configs and rule presets. We argue about trailing commas so you can focus on shipping bugs.',
        tech: ['ESLint', 'JavaScript', 'Standards'],
        repoUrl: 'https://github.com/CheckMarKDevTools/eslint-config-echo',
        isOrg: true,
    },
    {
        id: 'delegate-action',
        title: 'Delegate Action',
        description: 'Coding-agent workflow, but cooperative. Calls for backup. :unicorn:',
        longDescription: '🏗️ WIP: A GitHub Action that turns prompts into stacked PRs using Copilot, assigns humans to review, and refuses to auto-merge. It\'s like pair programming, but the partner doesn\'t steal your snacks.',
        tech: ['GitHub Actions', 'Copilot', 'Workflow'],
        repoUrl: 'https://github.com/CheckMarKDevTools/delegate-action',
        isOrg: true,
    },
    {
        id: 'underfoot',
        title: 'Underfoot Planner',
        description: 'The ChatPot for Hidden Places. Vibe coding at its finest. :unicorn:',
        longDescription: 'Underfoot: The ChatPot for Hidden Places — A true test in "vibe coding" for Dev.to\'s n8n + BrightData hackathon. Because looking at tourist traps is boring.',
        tech: ['n8n', 'AI', 'Travel'],
        repoUrl: 'https://github.com/CheckMarKDevTools/underfoot-underground-travel-planner',
        imageUrl: 'https://github.com/ChecKMarKDevTools/underfoot-underground-travel-planner/raw/main/frontend/public/favicon.png', // Using favicon as fallback/icon
        isOrg: true,
    },
];
