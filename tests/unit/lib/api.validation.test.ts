import { afterEach, describe, expect, it, vi } from 'vitest';

const validProject = () => ({
  objectID: 'project-alpha',
  name: 'Project Alpha',
  tech: [{ name: 'TypeScript', role: 'Language' }],
});

async function getProjectsFrom(projects: unknown[]) {
  vi.resetModules();
  vi.doMock('@/data/projects.json', () => ({ default: projects }));
  return (await import('@/lib/api')).getProjects;
}

afterEach(() => vi.doUnmock('@/data/projects.json'));

describe('project data validation', () => {
  it.each(['objectID', 'name'])('rejects a project with a missing required %s', async (field) => {
    const project = validProject();
    delete project[field as keyof typeof project];
    const getProjects = await getProjectsFrom([project]);

    expect(getProjects).toThrow(`invalid ${field}`);
  });

  it.each([
    { label: 'non-array tech', tech: 'TypeScript' },
    { label: 'null tech item', tech: [null] },
    { label: 'missing tech name', tech: [{ role: 'Language' }] },
    { label: 'whitespace tech role', tech: [{ name: 'TypeScript', role: '  ' }] },
  ])('rejects $label', async ({ tech }) => {
    const getProjects = await getProjectsFrom([{ ...validProject(), tech }]);
    expect(getProjects).toThrow(/invalid tech|invalid name|invalid role/);
  });

  it.each([
    ['repo_url', 'javascript:alert(1)'],
    ['app_url', 'http://example.com/app'],
    ['repo_url', 'https://user:secret@example.com/repo'],
    ['image_url', '/projects/../private.webp'],
    ['image_url', '/projects/alpha.svg'],
  ])('rejects unsafe %s', async (field, value) => {
    const getProjects = await getProjectsFrom([{ ...validProject(), [field]: value }]);
    expect(getProjects).toThrow(`unsafe ${field}`);
  });

  it.each([
    { label: 'non-array links', value: 'https://example.com/post' },
    { label: 'null link', value: [null] },
    { label: 'missing link title', value: [{ url: 'https://example.com/post' }] },
    { label: 'unsafe link url', value: [{ title: 'Post', url: 'javascript:alert(1)' }] },
  ])('rejects $label in blog evidence', async ({ value }) => {
    const getProjects = await getProjectsFrom([{ ...validProject(), blog_posts: value }]);
    expect(getProjects).toThrow(/invalid blog_posts|invalid blog post|invalid title|unsafe url/);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, '1'])(
    'rejects invalid order ranks',
    async (order_rank) => {
      const getProjects = await getProjectsFrom([{ ...validProject(), order_rank }]);
      expect(getProjects).toThrow('invalid order_rank');
    }
  );

  it('normalizes absent optional fields and preserves stable source order for equal ranks', async () => {
    const getProjects = await getProjectsFrom([
      { ...validProject(), objectID: 'first', order_rank: 1 },
      { ...validProject(), objectID: 'second', order_rank: 1, award: null, blog_posts: null },
      { ...validProject(), objectID: 'default' },
    ]);

    expect(getProjects().map((project) => project.id)).toEqual(['first', 'second', 'default']);
    expect(getProjects()[1]).toMatchObject({ blog_posts: [], announcements: [], order_rank: 1 });
    expect(getProjects()[1].award).toBeUndefined();
  });
});
