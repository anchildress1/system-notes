import { BLOG_URL } from '@/config';

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
    lead: 'I design systems by hunting the failure first.',
    body:
      'If a thing can break, I assume it will, and I would rather find it before production ' +
      'does. Nothing irritates me more than shipping a “done” deployment and needing a ' +
      'hotfix an hour later. If I deployed it, the failure should already have been found, ' +
      'understood, and closed.',
  },
];

/* One professional certification and the issuer's own page for checking it.

   `credentialUrl` is not optional: a certification with nowhere to check it is the
   exact claim the about page's receipts section exists to stop making. */
interface Certification {
  readonly name: string;
  readonly issuer: string;
  /** Month and year it was earned, as displayed. */
  readonly issued: string;
  /** Must be reachable by a LOGGED-OUT reader. Credly's `/earner/earned/badge/`
   *  form is the owner's private view and redirects a visitor to a sign-in wall;
   *  the public form is `/badges/<id>/public_url`. */
  readonly credentialUrl: string;
}

// Typed here rather than inferred through `as const`, so the shape is stated
// once and a new entry cannot quietly drop a field.
const certifications: readonly Certification[] = [
  {
    name: 'Generative AI Leader',
    issuer: 'Google Cloud',
    issued: 'October 2025',
    credentialUrl: 'https://www.credly.com/badges/a1465b7f-94c8-4289-8563-fb25a62c46a7/public_url',
  },
  {
    // "Certified" is part of the name here and not on the Google Cloud entry above,
    // because without it this reads as the product rather than the credential.
    //
    // GitHub's own certification, sat through Microsoft Learn — which is why the
    // receipt is on a microsoft.com domain and reads "Issued by Microsoft".
    name: 'GitHub Copilot Certified',
    issuer: 'GitHub',
    issued: 'August 2025',
    credentialUrl:
      'https://learn.microsoft.com/en-us/users/anchildress1/credentials/1121633cbf5c85c',
  },
];

/* `core` is the professional practice; `applied` is what the exhibits happen to
   be built in. Merged into one row, a backend engineer reads as a generalist. */
interface TrackRecord {
  readonly since: number;
  /** Runs inside a sentence, so it carries its own casing and no trailing stop. */
  readonly summary: string;
  readonly core: readonly string[];
  readonly applied: readonly string[];
}

const trackRecord: TrackRecord = {
  since: 2014,
  summary: 'distributed backend systems in Java and Node.js on GCP',
  core: ['Java', 'Node.js', 'Google Cloud Platform', 'Distributed systems'],
  applied: ['TypeScript', 'Python', 'Next.js', 'SvelteKit', 'Gemini · Claude · Gemma', 'Cloud Run'],
};

export const profile = {
  name: 'Ashley Childress',
  role: 'Senior Software Engineer',
  location: 'Georgia · Appalachian roots · Remote',
  email: 'anchildress1@gmail.com',
  trackRecord,
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
  /* The site footer's row, and nothing else reads it. */
  links: [
    { label: 'GitHub', href: 'https://github.com/anchildress1' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/anchildress1' },
    { label: 'DEV', href: BLOG_URL },
    { label: 'X', href: 'https://x.com/anchildress1' },
  ],
  // `lead` is the sentence that carried emphasis in the original copy; it is a
  // separate field rather than inline markup so the data stays free of markup
  // and the page decides how emphasis is rendered.
  themeSong: {
    track: 'I Build Things',
    artist: 'Twisted Game Songs',
    paragraphs: themeSongParagraphs,
  },
  // Newest first, which is the order a reader checks currency in.
  certifications,
} as const;
