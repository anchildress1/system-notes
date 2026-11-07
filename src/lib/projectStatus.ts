import type { Project, ProjectStatus } from '@/lib/api';

export type ProjectBucket = 'current' | 'ended';

/**
 * Statuses that mean the work stopped. Everything else is still standing.
 *
 * Keyed on the ended set rather than on "active": a system that is Deployed,
 * Released or Published is current, and testing for the word active filed all
 * three as over.
 */
const ENDED: ReadonlySet<ProjectStatus> = new Set(['Retired', 'Archived', 'Scrapped']);

export function getProjectBucket(status: ProjectStatus): ProjectBucket {
  return ENDED.has(status) ? 'ended' : 'current';
}

export function groupProjects(projects: readonly Project[]): Record<ProjectBucket, Project[]> {
  return projects.reduce<Record<ProjectBucket, Project[]>>(
    (groups, project) => {
      groups[getProjectBucket(project.status)].push(project);
      return groups;
    },
    { current: [], ended: [] }
  );
}
