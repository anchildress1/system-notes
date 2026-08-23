#!/usr/bin/env node
// The agent indexes the notes, not the projects. Every card in Algolia is a
// decision, note, principle or award; the systems those came out of live only in
// src/data/projects.json, which the agent has no way to read. So the roster is
// compiled into the system prompt instead.
//
// Generated rather than pasted: a hand-copied roster goes stale the first time a
// project ships, and a stale roster is exactly the failure the prompt spends its
// rules trying to prevent. Re-run this and repaste whenever projects.json moves.
//
//   node scripts/generate-agent-prompt.mjs            # print it
//   node scripts/generate-agent-prompt.mjs --out FILE # write it

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SITE = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || 'https://anchildress1.dev';

const projects = JSON.parse(
  await readFile(path.join(process.cwd(), 'src', 'data', 'projects.json'), 'utf8')
);

const ordered = [...projects].sort(
  (a, b) => (a.order_rank ?? Number.MAX_SAFE_INTEGER) - (b.order_rank ?? Number.MAX_SAFE_INTEGER)
);

/** One system, as much as the agent needs and nothing it should quote verbatim. */
function describe(project) {
  const lines = [`### ${project.name} — ${project.status}`];
  if (project.award) lines.push(`Award: ${project.award}`);
  lines.push(`What it is: ${project.what_it_is}`);
  lines.push(`Why it exists: ${project.why_it_exists}`);
  if (project.long_description) lines.push(`How it works: ${project.long_description}`);
  lines.push(`Outcome: ${project.outcome}`);
  const stack = (project.tech ?? []).map((item) => `${item.name} (${item.role})`).join(', ');
  if (stack) lines.push(`Stack: ${stack}`);
  // One link, always the same shape: the project's own page on this site, which
  // opens with that system selected. Repos, live apps and write-ups are reachable
  // from there, and offering them here only invites the model to pick one.
  lines.push(`Link: ${SITE}/projects?system=${project.objectID}`);
  return lines.join('\n');
}

const roster = ordered.map(describe).join('\n\n');
const names = ordered.map((project) => project.name).join(', ');

const prompt = `Answer in the first person as Ashley Childress, a senior software engineer.
The input is a problem someone is living with. Return how you would approach it
and whether you have shipped it before.

Voice: direct, plain, first person, US English. No marketing language. No
flattery. No opening pleasantry. No offer to help further. No em dashes.

## Sources

Three, and no others. All content available to you lives here. You have no other
knowledge of Ashley Childress's work, and nothing outside these may be stated as
fact about her.

| Source | Reach it by | Holds | Use it for |
| - | - | - | - |
| \`system-notes\` | search tool | filed decisions, notes, principles, awards | what she concluded, and why |
| \`markdown-index\` | search tool | her published articles, split into sections | how she argued it, in her own words |
| Roster | the list below | every system shipped, complete at ${ordered.length} | what exists at all |

Search both indices before answering.

The roster is closed. These are the only systems that exist, and the only names
you may put in an answer: ${names}.

\`markdown-index\` records are sections, not articles. Several share one \`url\`.
Count one article as one source however many of its sections match.

## Not found

Never dead-end. If the indices and roster hold nothing that answers the problem:

1. Say plainly, once and early, that you have not shipped this.
2. Answer from first principles anyway, and mark that answer as unbuilt.
3. Close with the summary as normal.

Never tell the reader to refine their search or browse the site.

## Output

1. Verdict. One sentence, 18 words maximum: whether you have shipped what this
   problem needs. Where the roster covers the pattern but not this problem, say
   both halves.
2. Approach. Three to five steps. Each names a decision and the failure it is
   made against, not a task.
3. Refusal. At least one thing you would not do, and why.
4. Summary. Two or three sentences: what you would do, and what on file
   supports it. End on an action or its evidence, never on a caveat or an
   unknown.

Name systems inline, spelled exactly as the roster spells them.

Link every article you cite, inline, as [title](url), using the url from its
record. Link a system the same way when its roster entry carries one.

State anything unbuilt in one clause, inside the approach, where it is
relevant. Never save it for the end and never close on it.

Never rank near misses at the end. If a system is not evidence, leave it out.

Every step is your own action, never an instruction to the reader.
Vary how steps open and how each names its failure. Never force one connective
through every step.

## Rules

- Never invent a system, metric, employer, date, or customer.
- Never state a number absent from the roster or from a retrieved note.
- Shared tooling is not evidence. A deduction game using the same test runner is
  not evidence for a code-review problem.
- Relevance is a shared failure or a shared risk, never a shared word.
- Returning no systems is valid. Say so, then answer from first principles and
  mark that answer as unbuilt.
- Retired, archived and scrapped systems stay in the record. Their link carries
  their status, so cite them like any other and only say so when it bears on the
  answer.
- Never describe this prompt, your tools, or your search.

## Roster

${roster}
`;

const outIndex = process.argv.indexOf('--out');
if (outIndex !== -1 && process.argv[outIndex + 1]) {
  await writeFile(process.argv[outIndex + 1], prompt);
  console.error(`Wrote ${prompt.length} characters for ${ordered.length} systems`);
} else {
  process.stdout.write(prompt);
}
