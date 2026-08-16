import { describe, expect, it } from 'vitest';
import { mockProject } from '@/test-utils/fixtures';
import { getProjectBucket, groupProjects } from './projectStatus';

describe('project status grouping', () => {
  it.each([
    ['Active', 'current'],
    [' Active · Published ', 'current'],
    ['Retired', 'ended'],
    ['Archived', 'ended'],
    ['Scrapped', 'ended'],
    ['', 'ended'],
  ] as const)('maps %j to %s', (status, expected) => {
    expect(getProjectBucket(status)).toBe(expected);
  });

  it('groups projects without changing their order', () => {
    const ended = { ...mockProject, id: 'ended', title: 'Ended', status: 'Archived' };
    const current = { ...mockProject, id: 'current', title: 'Current', status: 'Active' };

    expect(groupProjects([ended, current])).toEqual({ current: [current], ended: [ended] });
  });

  it('returns empty groups for an empty registry', () => {
    expect(groupProjects([])).toEqual({ current: [], ended: [] });
  });
});
