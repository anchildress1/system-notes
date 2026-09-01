import { describe, expect, it, vi } from 'vitest';
import exhibits from '@/data/exhibits.json';
import {
  buildAgentPrompt,
  describeProject,
  emitAgentPrompt,
  orderProjects,
  readAgentPrompt,
  resolveSiteUrl,
  selectExhibitProjects,
} from '../../../scripts/generate-agent-prompt.mjs';

const project = (overrides = {}) => ({
  objectID: 'alpha',
  name: 'Alpha',
  status: 'Deployed',
  what_it_is: 'A careful system.',
  why_it_exists: 'To prove a constraint.',
  long_description: 'It stores the proof.',
  outcome: 'It shipped.',
  tech: [{ name: 'TypeScript', role: 'Language' }],
  ...overrides,
});

const exhibitProjects = () =>
  exhibits.map(({ id }, index) =>
    project({ objectID: id, name: `Exhibit ${index + 1}`, order_rank: index + 1 })
  );

describe('agent prompt generator', () => {
  it('normalizes the public base URL without removing its origin', () => {
    expect(resolveSiteUrl('https://example.test/')).toBe('https://example.test');
    expect(resolveSiteUrl(undefined)).toBe('https://anchildress1.dev');
  });

  it('orders explicit ranks before unranked projects without changing equal-rank order', () => {
    const ordered = orderProjects([
      project({ objectID: 'unranked' }),
      project({ objectID: 'first', order_rank: 1 }),
      project({ objectID: 'second', order_rank: 1 }),
    ]);

    expect(ordered.map((item) => item.objectID)).toEqual(['first', 'second', 'unranked']);
  });

  it('selects only the public exhibits in their editorial order', () => {
    const selected = selectExhibitProjects([
      ...exhibitProjects().reverse(),
      project({ objectID: 'inventory-only', name: 'Inventory Only' }),
    ]);

    expect(selected.map((item) => item.objectID)).toEqual(exhibits.map(({ id }) => id));
  });

  it('describes only supplied evidence and links the selected project on this site', () => {
    const description = describeProject(
      project({ tech: [], long_description: '', award: undefined }),
      'https://example.test'
    );

    expect(description).toContain('Link: https://example.test/notes?project=Alpha#notes-index');
    expect(description).not.toContain('Award:');
    expect(description).not.toContain('Stack:');
    expect(description).not.toContain('How it works:');
  });

  it('builds a roster from the supplied projects in rank order', () => {
    const prompt = buildAgentPrompt(
      [project({ objectID: 'later', name: 'Later', order_rank: 2 }), project({ order_rank: 1 })],
      'https://example.test'
    );

    expect(prompt).toContain('complete at 2');
    expect(prompt.indexOf('### Alpha')).toBeLessThan(prompt.indexOf('### Later'));
  });

  it('reads a valid registry through an injected filesystem', async () => {
    const readProjects = vi.fn(async () =>
      JSON.stringify([
        ...exhibitProjects(),
        project({ objectID: 'inventory-only', name: 'Inventory Only', order_rank: 99 }),
      ])
    );

    await expect(
      readAgentPrompt('/portfolio', 'https://example.test', readProjects)
    ).resolves.toMatchObject({
      projectCount: exhibits.length,
      prompt: expect.stringContaining('https://example.test/notes?project=Exhibit+1#notes-index'),
    });
    await expect(
      readAgentPrompt('/portfolio', 'https://example.test', readProjects)
    ).resolves.toEqual(
      expect.objectContaining({ prompt: expect.not.stringContaining('Inventory Only') })
    );
    expect(readProjects).toHaveBeenCalledWith('/portfolio/src/data/projects.json', 'utf8');
  });

  it('rejects a registry missing a public exhibit', async () => {
    const readProjects = vi.fn(async () => JSON.stringify(exhibitProjects().slice(1)));

    await expect(readAgentPrompt('/portfolio', undefined, readProjects)).rejects.toThrow(
      'missing exhibited project save-the-sun'
    );
  });

  it.each([
    { label: 'missing registry', read: async () => Promise.reject(new Error('ENOENT')) },
    { label: 'malformed JSON', read: async () => '{' },
    { label: 'non-array JSON', read: async () => JSON.stringify({}) },
    { label: 'non-object project', read: async () => JSON.stringify([null]) },
    {
      label: 'malformed project',
      read: async () => JSON.stringify([{ objectID: 'missing-data' }]),
    },
    { label: 'non-array tech', read: async () => JSON.stringify([project({ tech: null })]) },
    { label: 'malformed tech item', read: async () => JSON.stringify([project({ tech: [null] })]) },
    {
      label: 'non-array evidence',
      read: async () => JSON.stringify([project({ blog_posts: {} })]),
    },
    {
      label: 'malformed project evidence',
      read: async () =>
        JSON.stringify([project({ blog_posts: [{ url: 'https://example.test/post' }] })]),
    },
    {
      label: 'non-object evidence',
      read: async () => JSON.stringify([project({ blog_posts: [null] })]),
    },
    { label: 'invalid rank', read: async () => JSON.stringify([project({ order_rank: 'first' })]) },
  ])('rejects a $label without producing a prompt', async ({ read }) => {
    await expect(readAgentPrompt('/portfolio', undefined, read)).rejects.toThrow();
  });

  it('prints by default and writes only when --out has a filename', async () => {
    const stdout = { write: vi.fn() };
    const stderr = { write: vi.fn() };
    const writePrompt = vi.fn(async () => undefined);
    const readProjects = vi.fn(async () => JSON.stringify(exhibitProjects()));

    const runtime = { readProjects, stdout, stderr, writePrompt };

    await emitAgentPrompt({ args: ['node', 'script'] }, runtime);
    expect(stdout.write).toHaveBeenCalledWith(expect.stringContaining('### Exhibit 1'));
    expect(writePrompt).not.toHaveBeenCalled();

    await emitAgentPrompt({ args: ['node', 'script', '--out', '/tmp/prompt.txt'] }, runtime);
    expect(writePrompt).toHaveBeenCalledWith(
      '/tmp/prompt.txt',
      expect.stringContaining('### Exhibit 1')
    );
    expect(stderr.write).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`^Wrote \\d+ characters for ${exhibits.length} systems\\n$`))
    );
  });

  it('does not write a partial prompt after a registry failure', async () => {
    const stdout = { write: vi.fn() };
    const stderr = { write: vi.fn() };
    const writePrompt = vi.fn();

    await expect(
      emitAgentPrompt(
        { args: ['node', 'script', '--out', '/tmp/prompt.txt'] },
        { readProjects: async () => JSON.stringify({}), stdout, stderr, writePrompt }
      )
    ).rejects.toThrow('projects.json must contain an array');
    expect(writePrompt).not.toHaveBeenCalled();
    expect(stdout.write).not.toHaveBeenCalled();
  });
});
