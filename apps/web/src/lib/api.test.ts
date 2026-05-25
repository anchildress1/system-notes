import { describe, it, expect, vi } from 'vitest';
import { getProjects } from './api';

vi.mock('@/data/projects.json', () => ({
  default: [
    {
      objectID: 'project-alpha',
      name: 'Project Alpha',
      what_it_is: 'Alpha description',
      why_it_exists: 'Alpha purpose',
      long_description: 'Alpha long description',
      outcome: 'Alpha outcome',
      status: 'Active · Deployed',
      owner: 'anchildress1',
      tech: [{ name: 'TypeScript', role: 'Language' }],
      blog_posts: [{ title: 'Post One', url: 'https://example.com/post-one' }],
      repo_url: 'https://github.com/test/alpha',
      image_url: '/projects/alpha.webp',
      image_alt: 'Alpha image',
      order_rank: 2,
    },
    {
      objectID: 'project-beta',
      name: 'Project Beta',
      what_it_is: 'Beta description',
      why_it_exists: 'Beta purpose',
      long_description: 'Beta long description',
      outcome: 'Beta outcome',
      status: 'In Progress',
      owner: 'anchildress1',
      tech: [],
      blog_posts: [],
      order_rank: 1,
    },
  ],
}));

describe('getProjects', () => {
  it('maps raw Algolia fields to Project interface', async () => {
    const projects = await getProjects();
    const alpha = projects.find((p) => p.id === 'project-alpha');
    expect(alpha).toMatchObject({
      id: 'project-alpha',
      title: 'Project Alpha',
      description: 'Alpha description',
      purpose: 'Alpha purpose',
      long_description: 'Alpha long description',
      outcome: 'Alpha outcome',
      status: 'Active · Deployed',
      owner: 'anchildress1',
      repo_url: 'https://github.com/test/alpha',
      image_url: '/projects/alpha.webp',
      image_alt: 'Alpha image',
    });
  });

  it('sorts by order_rank ascending', async () => {
    const projects = await getProjects();
    expect(projects[0].id).toBe('project-beta'); // order_rank 1
    expect(projects[1].id).toBe('project-alpha'); // order_rank 2
  });

  it('maps tech and blog_posts arrays', async () => {
    const projects = await getProjects();
    const alpha = projects.find((p) => p.id === 'project-alpha');
    expect(alpha?.tech).toEqual([{ name: 'TypeScript', role: 'Language' }]);
    expect(alpha?.blog_posts).toEqual([{ title: 'Post One', url: 'https://example.com/post-one' }]);
  });

  it('returns undefined for absent optional fields', async () => {
    const projects = await getProjects();
    const beta = projects.find((p) => p.id === 'project-beta');
    expect(beta?.award).toBeUndefined();
    expect(beta?.repo_url).toBeUndefined();
    expect(beta?.image_url).toBeUndefined();
    expect(beta?.image_alt).toBeUndefined();
  });

  it('returns a non-empty array', async () => {
    const projects = await getProjects();
    expect(projects.length).toBeGreaterThan(0);
  });
});
