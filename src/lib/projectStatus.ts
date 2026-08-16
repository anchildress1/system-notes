import type { Project } from '@/lib/api';

export type ProjectBucket = 'current' | 'ended';

export function getProjectBucket(status: string): ProjectBucket {
  return status.trim().toLowerCase().startsWith('active') ? 'current' : 'ended';
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
