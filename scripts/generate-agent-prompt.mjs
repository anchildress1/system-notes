#!/usr/bin/env node
// The agent indexes the notes, not the projects. Every card in Algolia is a
// decision, note, principle or award; the selected projects those came out of
// live in local data the agent has no way to read. So that project list is
// compiled into the user instructions instead.
//
// Generated rather than pasted: a hand-copied roster goes stale the first time a
// project ships, and a stale roster is exactly the failure the prompt spends its
// rules trying to prevent. Re-run this and repaste whenever projects.json or
// exhibits.json moves; the second sets both which projects appear and their order.
//
//   node scripts/generate-agent-prompt.mjs            # print it
//   node scripts/generate-agent-prompt.mjs --out FILE # write it

import { readFile, writeFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import path from 'node:path';
import selectedProjects from '../src/data/exhibits.json' with { type: 'json' };

// profile.ts reaches config through the `@/` alias, which only the bundlers know.
// Plain Node runs this script, so the alias is resolved here and `.ts` is loaded
// as a TypeScript module explicitly — without the format, Node guesses from a
// typeless package.json and warns on every run.
const SRC_URL = new URL('../src/', import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/')) {
      return next(new URL(`${specifier.slice(2)}.ts`, SRC_URL).href, context);
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    return url.endsWith('.ts')
      ? next(url, { ...context, format: 'module-typescript' })
      : next(url, context);
  },
});
const { profile } = await import('../src/data/profile.ts');

const DEFAULT_RUNTIME = {
  readProjects: readFile,
  stderr: process.stderr,
  stdout: process.stdout,
  writePrompt: writeFile,
};

export function resolveSiteUrl(value) {
  return value?.replace(/\/$/, '') || 'https://anchildress1.dev';
}

export function selectPortfolioProjects(projects) {
  const projectsById = new Map(projects.map((project) => [project.objectID, project]));
  return selectedProjects.map(({ id }) => {
    const project = projectsById.get(id);
    if (!project) throw new TypeError(`projects.json is missing selected project ${id}.`);
    return project;
  });
}

/** One system, as much as the agent needs and nothing it should quote verbatim. */
export function describeProject(project, site) {
  const lines = [`### ${project.name} — ${project.status}`];
  if (project.award) lines.push(`Award: ${project.award}`);
  lines.push(`What it is: ${project.what_it_is}`);
  lines.push(`Why it exists: ${project.why_it_exists}`);
  if (project.long_description) lines.push(`How it works: ${project.long_description}`);
  lines.push(`Outcome: ${project.outcome}`);
  const stack = (project.tech ?? []).map((item) => `${item.name} (${item.role})`).join(', ');
  if (stack) lines.push(`Stack: ${stack}`);
  // One link, always the same shape: the project's filed notes. The catalogue is
  // curated rather than exhaustive, while the index remains the complete evidence
  // surface for every system in the roster.
  lines.push(`Link: ${site}/notes?project=${encodeURIComponent(project.name)}#notes-index`);
  const writeups = joinWriteups(
    project.blog_posts,
    (post) => `[${escapeLinkText(post.title)}](${post.url})`
  );
  if (writeups) lines.push(`Write-ups: ${writeups}`);
  return lines.join('\n');
}

const joinWriteups = (posts, format) => (posts ?? []).map(format).join(' | ');

// A literal ']' would otherwise close the markdown link early, and a literal
// backslash has to be escaped too or it pairs with the next character's escape
// and cancels it back out.
const escapeLinkText = (text) => text.replace(/[\\[\]]/g, '\\$&');

/** Selected list omits her, but a fact can still be sourced to her write-up. */
export function describeOtherProject(project) {
  const writeups = joinWriteups(
    project.blog_posts,
    (post) => `[${escapeLinkText(post.title)}](${post.url})`
  );
  return writeups ? `- ${project.name}: ${writeups}` : `- ${project.name}`;
}

/** The person, as facts with a url where one exists. Nothing here is prose to quote. */
export function describeProfile(person) {
  const certifications = person.certifications.map(
    (cert) => `- ${cert.name}, ${cert.issuer}, ${cert.issued}: ${cert.credentialUrl}`
  );
  const contact = [
    `- Email: mailto:${person.email}`,
    ...person.links.map((link) => `- ${link.label}: ${link.href}`),
  ];
  const principles = person.principles.map((item) => `- ${item.title} ${item.body}`);
  return [
    `Name: ${person.name}`,
    `Role: ${person.role}`,
    `In her words: ${person.introduction.join(' ')}`,
    'Principles:',
    ...principles,
    `Shipping production systems since: ${person.trackRecord.since}`,
    `Builds, since ${person.trackRecord.coreSince}: ${person.trackRecord.summary}`,
    `Core practice, since ${person.trackRecord.coreSince}: ${person.trackRecord.core.join(', ')}`,
    `Applied in the selected projects: ${person.trackRecord.applied.join(', ')}`,
    `Location: ${person.location}`,
    'Certifications:',
    ...certifications,
    'Contact:',
    ...contact,
  ].join('\n');
}

export function selectOtherProjects(projects, selected) {
  const selectedIds = new Set(selected.map((project) => project.objectID));
  return projects.filter((project) => !selectedIds.has(project.objectID));
}

// "Deployed" reads as already shipped. Pre-release hasn't cut its first release yet,
// which is the opposite lifecycle end from Retired/Scrapped/Archived — grouping them
// together is fine for the agent prompt's binary shipped/not-shipped split, as long as
// the heading never claims the not-yet-shipped ones were retired.
const LIVE_STATUSES = new Set(['Deployed', 'Active', 'Released', 'Published']);
const NOT_LIVE_STATUSES = new Set(['Pre-release', 'Retired', 'Archived', 'Scrapped']);
const KNOWN_STATUSES = new Set([...LIVE_STATUSES, ...NOT_LIVE_STATUSES]);

export function isDeployedStatus(status) {
  return LIVE_STATUSES.has(status);
}

function buildOtherProjectsSection(otherProjects) {
  if (otherProjects.length === 0) return '';

  const { deployed, notLive } = otherProjects.reduce(
    (buckets, project) => {
      (isDeployedStatus(project.status) ? buckets.deployed : buckets.notLive).push(project);
      return buckets;
    },
    { deployed: [], notLive: [] }
  );
  const describeList = (list) => list.map((project) => describeOtherProject(project)).join('\n');

  const sections = [
    deployed.length && `### Deployed\n\n${describeList(deployed)}`,
    notLive.length && `### Not live\n\n${describeList(notLive)}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  return `
## Other projects

Unselected. Cite under Citations.

${sections}
`;
}

export function buildAgentPrompt(
  projects,
  site = resolveSiteUrl(),
  otherProjects = [],
  person = profile
) {
  const roster = projects.map((project) => describeProject(project, site)).join('\n\n');
  const otherProjectsSection = buildOtherProjectsSection(otherProjects);

  return `Answer in the first person as Ashley Childress, a senior software engineer.
The input is a problem the reader has, or a question about you.

## Voice

- Write in first person, direct and plain, with no opening pleasantry, flattery,
  or offer to help further.
- Name the actual tool, model, file, boundary, and failure. Never hide a concrete
  fact behind an abstraction.
- Mix longer compound sentences with an occasional short punch. Do not flatten
  every thought into clipped, same-length sentences.
- Dry self-awareness is welcome when the evidence earns it. Never manufacture a
  joke, dialect, confession, or personality tic.
- Use "Honestly?", "Truth?", "In practice," and "The lesson." only when one is
  the natural bridge. Never use "Under the hood" or "It's worth noting."
- Use an open em dash only: text — text, never text—text.
- When quoting a retrieved article or note, keep its exact phrasing and dialect.
  The Profile and Selected projects blocks below are reference notes — state
  their facts in your own sentence, never copy their wording.
- Cut startup language, generic metaphors, repeated three-beat parallels, and
  repeated "Not X. Y." contrasts. Specific evidence does the work.

## Sources

Four. State nothing about her or her work from anywhere else.
Search both indices before answering, whatever the input.

| Source | Holds |
| - | - |
| \`system-notes\` index | decisions, principles, work style, awards |
| \`markdown-index\` index | her articles, one record per section; one \`url\` = one article |
| Profile, below | role, years, stack, location, certifications, contact |
| Selected projects, below | complete at ${projects.length}, each with its notes \`Link\` and \`Write-ups\` |

## Output

Problem input → Problem shape. Question about you → Person shape. Both → Problem shape.
Answer only what was asked.

### Problem shape

1. Verdict: 1 sentence, ≤18 words — shipped this, shipped the pattern, or unbuilt.
2. Approach: 3–5 steps. Each is your decision and the failure it prevents, never
   an instruction to the reader. No two open with the same two words. Any gap is
   one clause inside the step it affects.
3. Refusal: 1 thing you would not do, and why.
4. Summary: 2–3 sentences ending on an action or evidence, never a caveat.

### Person shape

1. Answer: 1 sentence that is the answer, carrying any url it names.
2. Evidence: 0–4 sentences, one per claim that needs proof; none for contact or
   location. Any gap is one clause here, never last.
3. Handoff: 1 sentence linking Email and LinkedIn — only for availability,
   compensation, scheduling, references, or an employer, when step 1 did not
   already link them.

## Citations & rules

- Allowed urls, verbatim only: a retrieved record's \`url\`, a selected
  project's \`Link\`, a \`Write-ups\` url, a Profile url.
- A project and its \`Write-ups\` are one work, never two sources. Cite it once
  — via \`Link\` (its filed notes) or its write-up \`[title](url)\`, whichever
  fits the claim.
- \`Other projects\` have no \`Link\`; cite by name and write-up only, never as
  a portfolio example.
- Never name a prompt section or tool (\`Profile\`, \`index\`, \`record\`,
  \`project list\`, search).
- Never invent a system, metric, number, employer, date, or customer.
- Relevance = shared failure or risk, not shared words or tools.
- Nothing matches → say it is unbuilt, then answer from first principles.
- Years of experience = today minus the year on the matching Profile line,
  never rounded up.
- Role fit = what matches and what does not; never agree to the role.
- Compensation, notice, references, employers = not in any source; hand off in
  one sentence, never estimate.

## Profile

${describeProfile(person)}

## Selected projects

${roster}
${otherProjectsSection}`;
}

// Mirrors src/lib/urlSafety.ts's isSafeExternalUrl. Duplicated rather than imported:
// this script runs as plain Node outside the Next.js/TypeScript toolchain.
function isSafeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.username === '' && url.password === '';
  } catch {
    return false;
  }
}

function requiredProjectText(project, key, index) {
  const value = project[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`projects.json entry ${index} has an invalid ${key}.`);
  }
}

function validatePromptProjects(value) {
  if (!Array.isArray(value)) throw new TypeError('projects.json must contain an array.');

  value.forEach((project, index) => {
    if (!project || typeof project !== 'object' || Array.isArray(project)) {
      throw new TypeError(`projects.json entry ${index} must be an object.`);
    }

    for (const key of [
      'objectID',
      'name',
      'status',
      'what_it_is',
      'why_it_exists',
      'long_description',
      'outcome',
    ]) {
      requiredProjectText(project, key, index);
    }

    if (!KNOWN_STATUSES.has(project.status)) {
      throw new TypeError(
        `projects.json entry ${index} has an unrecognized status "${project.status}".`
      );
    }

    if (!Array.isArray(project.tech)) {
      throw new TypeError(`projects.json entry ${index} has invalid tech.`);
    }
    project.tech.forEach((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw new TypeError(`projects.json entry ${index} has an invalid tech item.`);
      }
      requiredProjectText(item, 'name', index);
      requiredProjectText(item, 'role', index);
    });

    if (project.blog_posts !== undefined) {
      if (!Array.isArray(project.blog_posts)) {
        throw new TypeError(`projects.json entry ${index} has invalid blog_posts.`);
      }
      project.blog_posts.forEach((post) => {
        if (!post || typeof post !== 'object' || Array.isArray(post)) {
          throw new TypeError(`projects.json entry ${index} has an invalid blog post.`);
        }
        requiredProjectText(post, 'title', index);
        requiredProjectText(post, 'url', index);
        if (!isSafeUrl(post.url)) {
          throw new TypeError(`projects.json entry ${index} has an unsafe blog post url.`);
        }
      });
    }
    if (project.order_rank !== undefined && !Number.isFinite(project.order_rank)) {
      throw new TypeError(`projects.json entry ${index} has an invalid order_rank.`);
    }
  });

  return value;
}

export async function readAgentPrompt(
  cwd = process.cwd(),
  site = resolveSiteUrl(),
  readProjects = readFile
) {
  const projects = validatePromptProjects(
    JSON.parse(await readProjects(path.join(cwd, 'src', 'data', 'projects.json'), 'utf8'))
  );
  const selected = selectPortfolioProjects(projects);
  const others = selectOtherProjects(projects, selected);
  return {
    prompt: buildAgentPrompt(selected, site, others),
    projectCount: selected.length,
    registryCount: projects.length,
  };
}

export async function emitAgentPrompt(
  { args = process.argv, cwd = process.cwd(), site = resolveSiteUrl() } = {},
  { readProjects, stderr, stdout, writePrompt } = DEFAULT_RUNTIME
) {
  const { prompt, projectCount, registryCount } = await readAgentPrompt(cwd, site, readProjects);
  const outIndex = args.indexOf('--out');
  if (outIndex !== -1 && args[outIndex + 1]) {
    await writePrompt(args[outIndex + 1], prompt);
    stderr.write(
      `Wrote ${prompt.length} characters for ${projectCount} of ${registryCount} systems\n`
    );
  } else {
    stdout.write(prompt);
  }
}

if (import.meta.main) await emitAgentPrompt();
