/**
 * Every system id the roster carries, exactly as the agent is handed them.
 *
 * Held apart from `projects.json` rather than derived from it: the intake renders
 * on the front page, and importing the project data to read twenty ids would ship
 * every `long_description` into that bundle with them. `systemIds.test.ts` fails
 * if the two ever disagree, so the copy cannot drift unnoticed.
 */
export const SYSTEM_IDS = [
  'save-the-sun',
  'unearthed',
  'carbon-trace',
  'metal-birds-feed',
  'vestige',
  'rai-lint',
  'rai-commit-badge',
  'supascribe-notes',
  'system-notes',
  'commit-chronicles',
  'eslint-config-echo',
  'legacy-smelter',
  'devto-mirror',
  'multivert',
  'dev-community-dashboard',
  'my-hermantic-agent',
  'underfoot-underground-travel-planner',
  'awesome-github-copilot',
  'delegate-action',
  'checkmark-copilot-chat',
] as const;

const KNOWN = new Set<string>(SYSTEM_IDS);

/**
 * Whether a project link cites a system that exists.
 *
 * A link to `/projects?system=<id>` is the agent's own construction, so the id in
 * it is model output. An unknown id does not fail visibly — the directory falls
 * back to the first system — so an invented citation would open a real page for
 * the wrong project. Checking it here is what stops that.
 *
 * @param href Absolute or root-relative url from a brief.
 * @returns True unless the url is a project link naming a system that is not on file.
 */
export function citesKnownSystem(href: string): boolean {
  let url: URL;
  try {
    url = new URL(href, 'https://anchildress1.dev');
  } catch {
    return false;
  }
  if (url.pathname.replace(/\/$/, '') !== '/projects') return true;
  const system = url.searchParams.get('system');
  return system === null || KNOWN.has(system);
}
