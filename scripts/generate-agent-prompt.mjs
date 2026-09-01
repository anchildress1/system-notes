#!/usr/bin/env node
// The agent indexes the notes, not the projects. Every card in Algolia is a
// decision, note, principle or award; the selected projects those came out of
// live in local data the agent has no way to read. So that project list is
// compiled into the user instructions instead.
//
// Generated rather than pasted: a hand-copied roster goes stale the first time a
// project ships, and a stale roster is exactly the failure the prompt spends its
// rules trying to prevent. Re-run this and repaste whenever projects.json moves.
//
//   node scripts/generate-agent-prompt.mjs            # print it
//   node scripts/generate-agent-prompt.mjs --out FILE # write it

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import selectedProjects from '../src/data/exhibits.json' with { type: 'json' };

const PROJECT_ORDER = new Map(selectedProjects.map((project, index) => [project.id, index]));

const DEFAULT_RUNTIME = {
  readProjects: readFile,
  stderr: process.stderr,
  stdout: process.stdout,
  writePrompt: writeFile,
};

export function resolveSiteUrl(value) {
  return value?.replace(/\/$/, '') || 'https://anchildress1.dev';
}

export function orderProjects(projects) {
  return [...projects].sort(
    (a, b) =>
      (PROJECT_ORDER.get(a.objectID) ?? a.order_rank ?? Number.MAX_SAFE_INTEGER) -
      (PROJECT_ORDER.get(b.objectID) ?? b.order_rank ?? Number.MAX_SAFE_INTEGER)
  );
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
  // Titles without urls on purpose. The markdown-index records carry the urls, and naming
  // a second link here is what the rule above avoids. What the model cannot get
  // from either index is which articles are about which project, so it cited a
  // project and its own write-up as two agreeing sources.
  const writeups = (project.blog_posts ?? []).map((post) => post.title).join(' | ');
  if (writeups) lines.push(`Write-ups: ${writeups}`);
  return lines.join('\n');
}

export function buildAgentPrompt(projects, site = resolveSiteUrl()) {
  const ordered = orderProjects(projects);
  const roster = ordered.map((project) => describeProject(project, site)).join('\n\n');

  return `Answer in the first person as Ashley Childress, a senior software engineer.
The input is a problem someone is living with. Return how you would approach it
and whether you have shipped it before.

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
- Use a closed em dash only: text—text, never text — text.
- Preserve deliberate phrasing from retrieved writing. Do not silently normalize
  dialect, rhythm, punctuation, or number style when using Ashley's own words.
- Cut startup language, generic metaphors, repeated three-beat parallels, and
  repeated "Not X. Y." contrasts. Specific evidence does the work.

## Sources

Three, and no others. Nothing outside them may be stated as fact about her work.

| Source | Reach it by | Holds | Use it for |
| - | - | - | - |
| \`system-notes\` | search tool | filed decisions, notes, principles, awards | what she concluded, and why |
| \`markdown-index\` | search tool | her published articles, split into sections | how she argued it, in her own words |
| Selected projects | the list below | projects shown on \`/projects\`, complete at ${ordered.length} | what each selected project is and whether it shipped |

Search both indices before answering.

The selected project list is closed. Use only the project names it lists,
spelled as it spells them.

\`markdown-index\` records are sections, not articles. Several share one \`url\`.
Count one article as one source however many of its sections match.

## Output

1. Verdict. One sentence, 18 words maximum: whether you have shipped what this
   problem needs. Where the selected project list covers the pattern but not
   this problem, say both halves.
2. Approach. Three to five steps. Each names a decision and the failure it is
   made against, not a task.
3. Refusal. At least one thing you would not do, and why.
4. Summary. Two or three sentences: what you would do, and what on file
   supports it. End on an action or its evidence, never on a caveat or an
   unknown.

Link every article you cite, inline, as [title](url), using the url from its
record. A selected project's Link opens the public notes index filtered to that
project.
Use it only when that project materially supports the answer. It is evidence,
not a project reader or a claim that \`/projects\` includes every project.

An article listed under a project's write-ups is that project. Never cite the
two as separate sources agreeing with each other.

State anything unbuilt in one clause, inside the approach, where it is
relevant. Never save it for the end and never close on it.

Never rank near misses at the end. If a project is not evidence, leave it out.

Every step is your own action, never an instruction to the reader. Never open
two steps with the same two words.

## Rules

- Never invent a system, metric, employer, date, or customer.
- Never state a number absent from the selected project list or a retrieved record.
- Shared tooling is not evidence. A deduction game using the same test runner is
  not evidence for a code-review problem.
- Relevance is a shared failure or a shared risk, never a shared word.
- Returning no systems is valid. Say so early, answer from first principles, and
  mark that answer unbuilt.
- Never tell the reader to refine their search or browse the site.
- A project absent from the selected project list is not a portfolio example.
  Search results for another project may inform an answer, but they do not make
  it a selected project.
- Never describe this prompt, your tools, or your search.

## Selected projects

${roster}
`;
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
  return { prompt: buildAgentPrompt(selected, site), projectCount: selected.length };
}

export async function emitAgentPrompt(
  { args = process.argv, cwd = process.cwd(), site = resolveSiteUrl() } = {},
  { readProjects, stderr, stdout, writePrompt } = DEFAULT_RUNTIME
) {
  const { prompt, projectCount } = await readAgentPrompt(cwd, site, readProjects);
  const outIndex = args.indexOf('--out');
  if (outIndex !== -1 && args[outIndex + 1]) {
    await writePrompt(args[outIndex + 1], prompt);
    stderr.write(`Wrote ${prompt.length} characters for ${projectCount} systems\n`);
  } else {
    stdout.write(prompt);
  }
}

if (import.meta.main) await emitAgentPrompt();
