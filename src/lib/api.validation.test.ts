import { describe, expect, it, vi } from 'vitest';

vi.mock('@/data/projects.json', () => ({
  default: [
    {
      objectID: 'unsafe-project',
      name: 'Unsafe Project',
      tech: [],
      repo_url: 'javascript:alert(1)',
    },
  ],
}));

describe('project data validation', () => {
  it('fails loudly when project data contains an unsafe external URL', async () => {
    const { getProjects } = await import('./api');
    expect(() => getProjects()).toThrow('unsafe repo_url');
  });
});
