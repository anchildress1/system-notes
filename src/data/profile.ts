export const profile = {
  name: 'Ashley Childress',
  role: 'Senior Software Engineer',
  location: 'Georgia · Appalachian roots · Remote',
  portrait: {
    src: '/ashley-gen-2.webp',
    alt: 'Stylized portrait of Ashley Childress, a red-haired woman wearing glasses',
  },
  introduction: [
    'I design software systems, AI workflows, and the guardrails that keep both honest. My work starts where a cheerful demo usually stops: failure paths, ownership boundaries, and proof that survives contact with production.',
    'I grew up in a coal-mining town in southwest Virginia and built my career in Georgia. That background left me suspicious of waste, fond of repair, and deeply interested in systems that explain themselves.',
  ],
  principles: [
    {
      title: 'Name the boundary.',
      body: 'A system becomes governable when ownership, input, and refusal conditions are explicit.',
    },
    {
      title: 'Make failure visible.',
      body: 'Quiet fallback is how a defect earns seniority. Errors should arrive early and with evidence.',
    },
    {
      title: 'Automate the proof.',
      body: 'Tests, scanners, and release gates handle repeatable verification. Judgment stays human.',
    },
  ],
  links: [
    { label: 'GitHub', href: 'https://github.com/anchildress1' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/anchildress1' },
    { label: 'DEV Community', href: 'https://dev.to/anchildress1' },
  ],
} as const;
