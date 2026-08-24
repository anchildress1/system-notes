import type { Project } from '@/lib/api';

export type ProjectBucket = 'current' | 'ended';

/**
 * Statuses that mean the work stopped. Everything else is still standing.
 *
 * Keyed on the ended set rather than on "active": a system that is Deployed,
 * Released or Published is current, and testing for the word active filed all
 * three as over.
 */
const ENDED = new Set(['retired', 'archived', 'scrapped']);

export function getProjectBucket(status: string): ProjectBucket {
  const value = status.trim().toLowerCase();
  // An unfiled status is not evidence that the work is still standing.
  if (!value) return 'ended';
  return ENDED.has(value) ? 'ended' : 'current';
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
