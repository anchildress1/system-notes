/**
 * Every project name in `projects.json`, not just the seven the agent is handed.
 * A citation naming an unselected project is still a citation of her work.
 *
 * Held apart from `projects.json` rather than derived from it: the intake renders
 * on the front page, and importing the project data to read twenty names would
 * ship every `long_description` into that bundle with them. `systemIds.test.ts`
 * fails if the two ever disagree, so the copy cannot drift unnoticed.
 */
export const PROJECT_NAMES = [
  'Save the Sun',
  'Unearthed',
  'Carbon Trace',
  'Metal Birds Feed',
  'Vestige',
  'RAI Lint',
  'RAI Commit Badge',
  'SupaScribe Notes',
  'System Notes',
  'Commit Chronicles',
  'Echo ESLint',
  'Legacy Smelter',
  'Dev.to Mirror',
  'Multivert',
  'DEV Community Dashboard',
  'Hermes Agent',
  'Underfoot Travel',
  'Awesome Copilot',
  'Delegate Action',
  'Copilot Chat Extension',
] as const;

const KNOWN = new Set<string>(PROJECT_NAMES);

/**
 * Whether a notes link cites a project that exists.
 *
 * A link to `/notes?project=<name>#notes-index` is the agent's own construction,
 * so the project name in it is model output. Checking it here stops an invented
 * citation from presenting a real index as evidence for the wrong system.
 *
 * @param href Absolute or root-relative url from a brief.
 * @returns True unless the url is a notes project filter naming no project on file.
 */
export function citesKnownProject(href: string): boolean {
  let url: URL;
  try {
    url = new URL(href, 'https://anchildress1.dev');
  } catch {
    return false;
  }
  if (url.pathname.replace(/\/$/, '') !== '/notes') return true;
  const project = url.searchParams.get('project');
  return project === null || KNOWN.has(project);
}
