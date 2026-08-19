/** One paragraph of the theme-song note. `lead` carried emphasis in the copy. */
export interface ThemeSongParagraph {
  readonly lead?: string;
  readonly body?: string;
}

// Typed before it reaches `profile`, because `as const` would narrow each entry
// to its own literal shape and the renderer could not read both fields off the
// resulting union.
const themeSongParagraphs: readonly ThemeSongParagraph[] = [
  { body: 'I’ve called “I Build Things” my theme song since the first time I heard it.' },
  {
    body:
      'Part of that is Appalachian ingenuity. I was taught to fix what breaks, reuse what ' +
      'still works, and take things apart just to understand how they function. I’ve been ' +
      'dismantling systems and occasionally putting them back together since before I had ' +
      'the vocabulary to call them systems.',
  },
  {
    body:
      'Another part is simpler. The song is just fun. It’s catchy, energetic, and it makes ' +
      'me want to build things. I don’t treat a theme song as a metaphor exercise alone. I ' +
      'picked this one because it’s motivating, memorable, and genuinely enjoyable.',
  },
  { lead: 'The rest is how I build software.' },
  {
    lead: 'I design systems by actively hunting failure points.',
    body:
      'If something can break, I assume it will and I try to find it before production does. ' +
      'There’s nothing I dislike more than shipping a “done” deployment and immediately ' +
      'needing a hotfix. If I deployed it, the failure should already have been found, ' +
      'understood, and addressed.',
  },
  {
    body:
      'This song captures that balance. The joy of building something yourself, combined ' +
      'with the belief that breaking things early, loudly, and intentionally is how you end ' +
      'up with systems that actually ship clean and stay that way.',
  },
];

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
  // `lead` is the sentence that carried emphasis in the original copy; it is a
  // separate field rather than inline markup so the data stays free of markup
  // and the page decides how emphasis is rendered.
  themeSong: {
    track: 'I Build Things',
    artist: 'Twisted Game Songs',
    paragraphs: themeSongParagraphs,
  },
} as const;
