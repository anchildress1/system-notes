import { describe, expect, it, vi } from 'vitest';
import exhibits from '@/data/exhibits.json';
import {
  buildAgentPrompt,
  describeOtherProject,
  describeProject,
  emitAgentPrompt,
  isDeployedStatus,
  readAgentPrompt,
  resolveSiteUrl,
  selectOtherProjects,
  selectPortfolioProjects,
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

const portfolioProjects = () =>
  exhibits.map(({ id }, index) =>
    project({ objectID: id, name: `Selected Project ${index + 1}`, order_rank: index + 1 })
  );

describe('agent prompt generator', () => {
  it('normalizes the public base URL without removing its origin', () => {
    expect(resolveSiteUrl('https://example.test/')).toBe('https://example.test');
    expect(resolveSiteUrl(undefined)).toBe('https://anchildress1.dev');
  });

  it('selects only the public portfolio projects in their editorial order', () => {
    const selected = selectPortfolioProjects([
      ...portfolioProjects().reverse(),
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

  it('builds a roster in the order it is handed, not by registry rank', () => {
    const prompt = buildAgentPrompt(
      [project({ order_rank: 9 }), project({ objectID: 'later', name: 'Later', order_rank: 1 })],
      [],
      'https://example.test'
    );

    expect(prompt).toContain('complete at 2');
    expect(prompt.indexOf('### Alpha')).toBeLessThan(prompt.indexOf('### Later'));
    expect(prompt).toContain('Three, and no others');
    expect(prompt).toContain('`markdown-index`');
    expect(prompt).toContain('Search both indices before answering.');
    expect(prompt).toContain('Name the actual tool, model, file, boundary, and failure.');
    expect(prompt).toContain('Use a closed em dash only: text—text, never text — text.');
    expect(prompt).toContain('Cut startup language, generic metaphors');
    expect(prompt).not.toMatch(/\bexhibit(?:ed|ion|s)?\b/i);
    expect(prompt).not.toContain('## Other projects');
  });

  it('describes an other project as a name plus its write-up links, when it has any', () => {
    const description = describeOtherProject(
      project({
        name: 'Beta',
        blog_posts: [
          { title: 'First Post', url: 'https://example.test/first' },
          { title: 'Second Post', url: 'https://example.test/second' },
        ],
      })
    );

    expect(description).toBe(
      '- Beta: [First Post](https://example.test/first) | [Second Post](https://example.test/second)'
    );
  });

  it('describes an other project by name alone when it has no write-up', () => {
    expect(describeOtherProject(project({ name: 'Solo', blog_posts: [] }))).toBe('- Solo');
  });

  it('escapes brackets in a write-up title so they cannot close the link early', () => {
    const description = describeOtherProject(
      project({
        name: 'Beta',
        blog_posts: [{ title: 'Shipping [v2]', url: 'https://example.test/v2' }],
      })
    );

    expect(description).toBe('- Beta: [Shipping \\[v2\\]](https://example.test/v2)');
  });

  it('classifies live-sounding statuses as deployed and everything else as retired', () => {
    expect(isDeployedStatus('Deployed')).toBe(true);
    expect(isDeployedStatus('Active')).toBe(true);
    expect(isDeployedStatus('Released')).toBe(true);
    expect(isDeployedStatus('Published')).toBe(true);
    expect(isDeployedStatus('Pre-release')).toBe(false);
    expect(isDeployedStatus('Retired')).toBe(false);
    expect(isDeployedStatus('Archived')).toBe(false);
    expect(isDeployedStatus('Scrapped')).toBe(false);
  });

  it('selects every unselected project, regardless of write-up status', () => {
    const selected = [project({ objectID: 'alpha' })];
    const others = selectOtherProjects(
      [
        project({ objectID: 'alpha' }),
        project({
          objectID: 'beta',
          name: 'Beta',
          blog_posts: [{ title: 'Beta Post', url: 'https://example.test/beta' }],
        }),
        project({ objectID: 'gamma', name: 'Gamma', blog_posts: [] }),
      ],
      selected
    );

    expect(others.map((item) => item.objectID)).toEqual(['beta', 'gamma']);
  });

  it('appends an other-projects section, bucketed by status, only when there is something to list', () => {
    const withOthers = buildAgentPrompt(
      [project()],
      [
        project({
          name: 'Beta',
          status: 'Deployed',
          blog_posts: [{ title: 'Beta Post', url: 'https://example.test/beta' }],
        }),
        project({ objectID: 'gamma', name: 'Gamma', status: 'Archived' }),
      ],
      'https://example.test'
    );

    expect(withOthers).toContain('## Other projects');
    expect(withOthers.indexOf('### Deployed')).toBeLessThan(withOthers.indexOf('### Not live'));
    expect(withOthers).toContain('- Beta: [Beta Post](https://example.test/beta)');
    expect(withOthers).toContain('- Gamma');
    expect(withOthers.indexOf('Gamma')).toBeGreaterThan(withOthers.indexOf('### Not live'));

    const withoutOthers = buildAgentPrompt([project()], [], 'https://example.test');
    expect(withoutOthers).not.toContain('## Other projects');
  });

  it('reads a valid registry through an injected filesystem', async () => {
    const readProjects = vi.fn(async () =>
      JSON.stringify([
        ...portfolioProjects(),
        project({ objectID: 'inventory-only', name: 'Inventory Only', order_rank: 99 }),
      ])
    );

    await expect(
      readAgentPrompt('/portfolio', 'https://example.test', readProjects)
    ).resolves.toMatchObject({
      projectCount: exhibits.length,
      prompt: expect.stringContaining(
        'https://example.test/notes?project=Selected%20Project%201#notes-index'
      ),
    });
    await expect(
      readAgentPrompt('/portfolio', 'https://example.test', readProjects)
    ).resolves.toEqual(
      expect.objectContaining({
        prompt: expect.not.stringContaining('notes?project=Inventory%20Only'),
      })
    );
    expect(readProjects).toHaveBeenCalledWith('/portfolio/src/data/projects.json', 'utf8');
  });

  it('lists every unselected project, bucketed by status, through the real read path', async () => {
    const readProjects = vi.fn(async () =>
      JSON.stringify([
        ...portfolioProjects(),
        project({
          objectID: 'written-elsewhere',
          name: 'Written Elsewhere',
          status: 'Deployed',
          order_rank: 99,
          blog_posts: [{ title: 'Written Elsewhere Post', url: 'https://example.test/elsewhere' }],
        }),
        project({
          objectID: 'shelved',
          name: 'Shelved Thing',
          status: 'Archived',
          order_rank: 100,
        }),
      ])
    );

    const { prompt } = await readAgentPrompt('/portfolio', 'https://example.test', readProjects);

    expect(prompt).toContain('## Other projects');
    expect(prompt).toContain(
      '- Written Elsewhere: [Written Elsewhere Post](https://example.test/elsewhere)'
    );
    expect(prompt).toContain('- Shelved Thing');
    expect(prompt.indexOf('Written Elsewhere')).toBeLessThan(prompt.indexOf('### Not live'));
    expect(prompt.indexOf('### Not live')).toBeLessThan(prompt.indexOf('Shelved Thing'));
  });

  it('rejects a registry missing a selected project', async () => {
    const readProjects = vi.fn(async () => JSON.stringify(portfolioProjects().slice(1)));

    await expect(readAgentPrompt('/portfolio', undefined, readProjects)).rejects.toThrow(
      'missing selected project save-the-sun'
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
      label: 'blog post missing its url',
      read: async () => JSON.stringify([project({ blog_posts: [{ title: 'Untitled' }] })]),
    },
    {
      label: 'non-object evidence',
      read: async () => JSON.stringify([project({ blog_posts: [null] })]),
    },
    { label: 'invalid rank', read: async () => JSON.stringify([project({ order_rank: 'first' })]) },
    {
      label: 'unrecognized status',
      read: async () => JSON.stringify([project({ status: 'Live' })]),
    },
  ])('rejects a $label without producing a prompt', async ({ read }) => {
    await expect(readAgentPrompt('/portfolio', undefined, read)).rejects.toThrow();
  });

  it('prints by default and writes only when --out has a filename', async () => {
    const stdout = { write: vi.fn() };
    const stderr = { write: vi.fn() };
    const writePrompt = vi.fn(async () => undefined);
    // One project the list does not select, so the written count is not the registry's.
    const readProjects = vi.fn(async () =>
      JSON.stringify([...portfolioProjects(), project({ objectID: 'inventory-only' })])
    );

    const runtime = { readProjects, stdout, stderr, writePrompt };

    await emitAgentPrompt({ args: ['node', 'script'] }, runtime);
    expect(stdout.write).toHaveBeenCalledWith(expect.stringContaining('### Selected Project 1'));
    expect(writePrompt).not.toHaveBeenCalled();

    await emitAgentPrompt({ args: ['node', 'script', '--out', '/tmp/prompt.txt'] }, runtime);
    expect(writePrompt).toHaveBeenCalledWith(
      '/tmp/prompt.txt',
      expect.stringContaining('### Selected Project 1')
    );
    expect(stderr.write).toHaveBeenCalledWith(
      expect.stringMatching(
        new RegExp(
          `^Wrote \\d+ characters for ${exhibits.length} of ${exhibits.length + 1} systems\\n$`
        )
      )
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
