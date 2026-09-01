import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  buildAgentPrompt,
  describeProject,
  emitAgentPrompt,
  orderProjects,
  readAgentPrompt,
  resolveSiteUrl,
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

  it('builds a roster from every project in rank order', () => {
    const prompt = buildAgentPrompt(
      [project({ objectID: 'later', name: 'Later', order_rank: 2 }), project({ order_rank: 1 })],
      'https://example.test'
    );

    expect(prompt).toContain('complete at 2');
    expect(prompt.indexOf('### Alpha')).toBeLessThan(prompt.indexOf('### Later'));
  });

  it('reads a valid registry through an injected filesystem', async () => {
    const readProjects = vi.fn(async () => JSON.stringify([project()]));

    await expect(
      readAgentPrompt('/portfolio', 'https://example.test', readProjects)
    ).resolves.toMatchObject({
      projectCount: 1,
      prompt: expect.stringContaining('https://example.test/notes?project=Alpha#notes-index'),
    });
    expect(readProjects).toHaveBeenCalledWith('/portfolio/src/data/projects.json', 'utf8');
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
    const readProjects = vi.fn(async () => JSON.stringify([project()]));

    const runtime = { readProjects, stdout, stderr, writePrompt };

    await emitAgentPrompt({ args: ['node', 'script'] }, runtime);
    expect(stdout.write).toHaveBeenCalledWith(expect.stringContaining('### Alpha'));
    expect(writePrompt).not.toHaveBeenCalled();

    await emitAgentPrompt({ args: ['node', 'script', '--out', '/tmp/prompt.txt'] }, runtime);
    expect(writePrompt).toHaveBeenCalledWith(
      '/tmp/prompt.txt',
      expect.stringContaining('### Alpha')
    );
    expect(stderr.write).toHaveBeenCalledWith(
      expect.stringMatching(/^Wrote \d+ characters for 1 systems\n$/)
    );
  });

  // The pasted copy in Agent Studio is only as fresh as the file in the repo.
  // Nothing else compares the two, so a projects.json edit without a regenerate
  // leaves the live agent citing a roster the site no longer serves.
  it('matches the roster checked in for pasting', async () => {
    const committed = await readFile(
      path.join(process.cwd(), '.agent', 'agent-studio', 'user-instructions.generated.md'),
      'utf8'
    );
    const { prompt } = await readAgentPrompt();

    expect(committed).toBe(prompt);
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
