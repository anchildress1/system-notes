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
  blogs?: { title: string; url: string }[];
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
    blogs: [
      {
        title: 'Three AIs and a Funeral: My Take on GPT-5',
        url: 'https://dev.to/anchildress1/three-ais-and-a-funeral-my-take-on-gpt-5-3f3e',
      },
      {
        title: 'Medium and the Blanket AI Ban',
        url: 'https://dev.to/anchildress1/medium-and-the-blanket-ai-ban-2cni',
      },
      {
        title: 'Can We Set the Record Straight? AI Content and a Bit of Sanity',
        url: 'https://dev.to/anchildress1/can-we-set-the-record-straight-ai-content-and-a-bit-of-sanity-1inj',
      },
      {
        title: 'Codeck Presents Verdent AI: They Wanted Opinions, I Have Plenty',
        url: 'https://dev.to/anchildress1/codeck-presents-verdent-ai-they-wanted-opinions-i-have-plenty-5ccl',
      },
      {
        title: 'Waiting With Intent: Designing AI Systems for the Long Game',
        url: 'https://dev.to/anchildress1/waiting-with-intent-designing-ai-systems-for-the-long-game-1abg',
      },
      {
        title: 'Fact Checking the Fear Behind the Dark Side of AI',
        url: 'https://dev.to/anchildress1/fact-checking-the-fear-behind-the-dark-side-of-ai-the-real-story-366p',
      },
      {
        title: 'When the Spark is Done: The ADHD Energy Cycle No One Talks About',
        url: 'https://dev.to/anchildress1/when-the-spark-is-done-the-adhd-energy-cycle-no-one-talks-about-43fo',
      },
    ],
  },

  {
    id: 'delegate-action',
    title: 'Delegate Action',
    status: 'Active · POC',
    description: 'Turning prompts into Pull Requests (with humans in the loop).',
    longDescription:
      'Service accounts are hard; delegation is easier. This Action acts as a coding agent that takes a prompt, generates a draft PR, and signs me as the reviewer. It solves the "blank page" problem by forcing the AI to show its work before merging.',
    outcome:
      "A working Proof of Concept that bypasses the need for complex bot permissions by leveraging the user's own review flow.",
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
    id: 'rai-lint',
    title: 'RAI Lint',
    status: 'Active · Published',
    description: 'Attribution enforcement: if AI helped, that attribution must exist.',
    longDescription:
      'Security through transparency. This tool integrates directly into commit workflows to enforce AI attribution. It is not policy theater; it is a hard technical boundary. Nothing more, nothing less. If you use tools, you cite them.',
    outcome:
      'Rolling out to live teams. It turns invisible assistance into explicit, trackable data without disrupting the flow state.',
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
    description: 'A failed hackathon project rewritten to push AI orchestration to its limits.',
    longDescription:
      'Started as a standard travel app that failed under real-world cost constraints. I tore it down and rebuilt it as a pure AI orchestration challenge. The goal shifted from "ranking destinations" to "narrative discovery" using a custom orchestrator to bypass traditional API limits.',
    outcome:
      'Unfinished, but instructive. The failure forced a pivot from "consuming APIs" to "synthesizing data," effectively turning a cost problem into an architecture project.',
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
    blogs: [
      {
        title: 'Letting AI Drive a Month of Building with GitHub Copilot',
        url: 'https://dev.to/anchildress1/letting-ai-drive-a-month-of-building-with-github-copilot-4a94',
      },
      {
        title: 'From Hell Loops to Happy Commits',
        url: 'https://dev.to/anchildress1/from-hell-loops-to-happy-commits-38c4',
      },
      {
        title: "What I've Learned About GitHub Copilot Agent Mode",
        url: 'https://dev.to/anchildress1/what-ive-learned-about-github-copilot-agent-mode-4co2',
      },
      {
        title: 'Troubleshooting Production with GitHub Copilot',
        url: 'https://dev.to/anchildress1/troubleshooting-production-with-github-copilot-the-guide-for-real-humans-and-bots-with-good-taste-253o',
      },
      {
        title: "All I've Learned About GitHub Copilot Instructions So Far",
        url: 'https://dev.to/anchildress1/all-ive-learned-about-github-copilot-instructions-so-far-5bm7',
      },
      {
        title: 'Build It Better: Real World AI Coding with GitHub Copilot',
        url: 'https://dev.to/anchildress1/build-it-better-real-world-ai-coding-with-github-copilot-1d47',
      },
      {
        title: 'GitHub Copilot Agent Mode: The Mistake You Never Want to Make',
        url: 'https://dev.to/anchildress1/github-copilot-agent-mode-the-mistake-you-never-want-to-make-1mmh',
      },
      {
        title: 'GitHub Copilot: Everything You Wanted to Know About Reusable and Experimental Prompts Part 1',
        url: 'https://dev.to/anchildress1/github-copilot-everything-you-wanted-to-know-about-reusable-and-experimental-prompts-part-1-iff',
      },
      {
        title: 'GitHub Copilot Reusable Prompts Part 2: Walkthrough Real Examples',
        url: 'https://dev.to/anchildress1/github-copilot-reusable-prompts-part-2-walkthrough-real-examples-17mh',
      },
      {
        title: 'Oh I Have Big News! Guess What I Got Yesterday',
        url: 'https://dev.to/anchildress1/oh-i-have-big-news-guess-what-i-got-yesterday-1jca',
      },
      {
        title: 'GitHub Copilot Reusable Prompts Part 3: More Experiments More Mayhem',
        url: 'https://dev.to/anchildress1/github-copilot-reusable-prompts-part-3-more-experiments-more-mayhem-552b',
      },
      {
        title: 'Everything I Know About GitHub Copilot Instructions: From Zero to Onboarded for Real',
        url: 'https://dev.to/anchildress1/everything-i-know-about-github-copilot-instructions-from-zero-to-onboarded-for-real-4nb0',
      },
      {
        title: 'What In The World is GitHub Coding Agent?',
        url: 'https://dev.to/anchildress1/what-in-the-world-is-github-coding-agent-2m8p',
      },
      {
        title: 'GitHub Coding Agent: The Magical Autonomous AI The Prequel',
        url: 'https://dev.to/anchildress1/github-coding-agent-the-magical-autonomous-ai-the-prequel-4h11',
      },
      {
        title: 'Magical Coding Agent: The Ship Ready Spellbook',
        url: 'https://dev.to/anchildress1/magical-coding-agent-the-ship-ready-spellbook-2mbf',
      },
      {
        title: 'Demystifying Coding Agent Prompts That Always Work',
        url: 'https://dev.to/anchildress1/demystifying-coding-agent-prompts-that-always-work-2on7',
      },
      {
        title: 'GitHub Copilot Chat Modes Explained with Personality',
        url: 'https://dev.to/anchildress1/github-copilot-chat-modes-explained-with-personality-2f4c',
      },
      {
        title: 'GitHub Copilot Chat Modes: From Chaos to Command',
        url: 'https://dev.to/anchildress1/github-copilot-chat-modes-from-chaos-to-command-54k0',
      },
      {
        title: 'Copilot Premium Requests More Than Asked: Exactly What You Need',
        url: 'https://dev.to/anchildress1/copilot-premium-requests-more-than-asked-exactly-what-you-need-8ph',
      },
      {
        title: 'Top 10 GitHub Copilot Updates You Actually Need to Know About',
        url: 'https://dev.to/anchildress1/top-10-github-copilot-updates-you-actually-need-to-know-about-297d',
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
    description: 'Set-and-forget discovery optimization for technical writing.',
    longDescription:
      'I write on DEV, but I need discovery everywhere. This running cron job pulls my content, formats it for SEO/AI crawlers, and deploys it to a static site. No analytics, no maintenance, just pure signal amplification.',
    outcome:
      'Zero-touch operation that increased inbound visibility without adding a single minute of maintenance time.',
    tech: [
      { name: 'Python', role: 'The Script' },
      { name: 'GitHub Actions', role: 'The Cron' },
      { name: 'GitHub Pages', role: 'The Host' },
      { name: 'SEO', role: 'The Goal' },
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
