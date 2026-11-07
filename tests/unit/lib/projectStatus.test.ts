import { describe, expect, it } from 'vitest';
import { mockProject } from '@tests/test-utils/fixtures';
import { getProjectBucket, groupProjects } from '@/lib/projectStatus';

describe('project status grouping', () => {
  it.each([
    ['Active', 'current'],
    ['Deployed', 'current'],
    ['Released', 'current'],
    ['Published', 'current'],
    ['Pre-release', 'current'],
    ['Retired', 'ended'],
    ['Archived', 'ended'],
    ['Scrapped', 'ended'],
  ] as const)('maps %j to %s', (status, expected) => {
    expect(getProjectBucket(status)).toBe(expected);
  });

  it('groups projects without changing their order', () => {
    const ended = { ...mockProject, id: 'ended', title: 'Ended', status: 'Archived' as const };
    const current = { ...mockProject, id: 'current', title: 'Current', status: 'Active' as const };

    expect(groupProjects([ended, current])).toEqual({ current: [current], ended: [ended] });
  });

  it('returns empty groups for an empty registry', () => {
    expect(groupProjects([])).toEqual({ current: [], ended: [] });
  });
});
