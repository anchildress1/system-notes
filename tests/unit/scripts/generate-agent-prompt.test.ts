import { describe, expect, it } from 'vitest';
import {
  buildAgentPrompt,
  describeProject,
  orderProjects,
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

    expect(description).toContain('Link: https://example.test/projects?system=alpha');
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
});
