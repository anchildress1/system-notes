import { describe, it, expect } from 'vitest';
import { buildSiteJsonLd } from '@/lib/siteJsonLd';
import type { Project } from '@/lib/api';

const base = 'https://example.dev';

const project = (over: Partial<Project> = {}): Project => ({
  id: 'alpha',
  title: 'Alpha',
  status: 'Active',
  description: 'Does a thing.',
  purpose: 'Because.',
  long_description: '',
  outcome: '',
  tech: [],
  owner: 'anchildress1',
  ...over,
});

describe('buildSiteJsonLd', () => {
  it('lists every project, not a curated subset', () => {
    const graph = buildSiteJsonLd(
      [project({ id: 'a', title: 'A' }), project({ id: 'b', title: 'B' })],
      base
    );
    expect(graph.hasPart).toHaveLength(2);
    expect(graph.hasPart.map((p) => p.name)).toEqual(['A', 'B']);
  });

  it('resolves a relative image path against the base url', () => {
    const [entry] = buildSiteJsonLd([project({ image_url: '/projects/alpha.webp' })], base).hasPart;
    expect(entry.image).toBe('https://example.dev/projects/alpha.webp');
  });

  it('omits image when the project has none', () => {
    const [entry] = buildSiteJsonLd([project()], base).hasPart;
    expect(entry.image).toBeUndefined();
  });

  it('carries an award through only when one was actually won', () => {
    const [won] = buildSiteJsonLd([project({ award: 'Earth Day 2026 Winner' })], base).hasPart;
    const [none] = buildSiteJsonLd([project()], base).hasPart;
    expect(won.award).toBe('Earth Day 2026 Winner');
    expect(none.award).toBeUndefined();
  });

  it('uses the project live url rather than the site root', () => {
    const [entry] = buildSiteJsonLd([project({ app_url: 'https://alpha.example' })], base).hasPart;
    expect(entry.url).toBe('https://alpha.example');
  });

  it('defaults relatedLink to an empty list when there are no posts', () => {
    const [entry] = buildSiteJsonLd([project()], base).hasPart;
    expect(entry.relatedLink).toEqual([]);
  });

  it('points the site identity at the supplied base url', () => {
    const graph = buildSiteJsonLd([], base);
    expect(graph.url).toBe(base);
    expect(graph.author.sameAs).toContain(base);
  });
});
