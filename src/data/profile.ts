/** One paragraph of the theme-song note. `lead` carried emphasis in the copy. */
interface ThemeSongParagraph {
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
      'Most of that is Appalachian ingenuity. I was taught to fix what breaks, reuse what ' +
      'still works, and take a thing apart just to see how it works. I’ve been dismantling ' +
      'systems, and occasionally putting them back together, since before I had the word ' +
      'for them.',
  },
  { lead: 'The rest is how I build software.' },
  {
    lead: 'I design systems by hunting the failure first.',
    body:
      'If a thing can break, I assume it will, and I would rather find it before production ' +
      'does. Nothing irritates me more than shipping a “done” deployment and needing a ' +
      'hotfix an hour later. If I deployed it, the failure should already have been found, ' +
      'understood, and closed.',
  },
  {
    body:
      'The song lands on both halves of that: the pleasure of building the thing yourself, ' +
      'and the conviction that breaking it early, loudly, and on purpose is what makes it ' +
      'ship clean and stay that way.',
  },
];

export const profile = {
  name: 'Ashley Childress',
  role: 'Senior Software Engineer',
  location: 'Georgia · Appalachian roots · Remote',
  portrait: {
    // One portrait per theme. Same subject, same alt — only the artwork's own
    // ground changes, so describing them differently would be describing the
    // theme rather than the person.
    dark: '/profile-dark.webp',
    light: '/profile-light.webp',
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
    { label: 'X', href: 'https://x.com/anchildress1' },
    { label: 'DEV Community', href: 'https://dev.to/anchildress1' },
  ],
  // `lead` is the sentence that carried emphasis in the original copy; it is a
  // separate field rather than inline markup so the data stays free of markup
  // and the page decides how emphasis is rendered.
  themeSong: {
    track: 'I Build Things',
    artist: 'Twisted Game Songs',
    // The track carries explicit lyrics. ThemeSong.tsx already says so in the
    // control's accessible name; this is what puts it on the page for everyone
    // else, and it is data rather than markup so a different track cannot
    // inherit the last one's rating.
    explicit: true,
    paragraphs: themeSongParagraphs,
  },
} as const;
