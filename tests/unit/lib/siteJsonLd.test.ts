import { describe, it, expect } from 'vitest';
import { buildSiteJsonLd } from '@/lib/siteJsonLd';
import { profile } from '@/data/profile';
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

  it('publishes every profile a reader is pointed at elsewhere on the site', () => {
    // sameAs is what ties this domain to the accounts a search engine already
    // knows. The footer linked LinkedIn while the graph omitted it, so the one
    // profile a recruiter searches by was the one not claimed.
    const { sameAs } = buildSiteJsonLd([], base).author;
    for (const { href } of profile.links) expect(sameAs).toContain(href);
  });

  it('gives the person a stable id the rest of the graph refers to', () => {
    // Nested inline in two places, a crawler reads two people rather than one.
    const graph = buildSiteJsonLd([project()], base);
    expect(graph.author['@id']).toBe(`${base}/#person`);
    expect(graph.publisher).toEqual({ '@id': graph.author['@id'] });
    expect(graph.hasPart[0].author).toEqual({ '@id': graph.author['@id'] });
  });

  it('files each certification as a credential with somewhere to check it', () => {
    const { hasCredential } = buildSiteJsonLd([], base).author;
    expect(hasCredential.length).toBe(profile.certifications.length);
    for (const credential of hasCredential) {
      expect(credential.url).toMatch(/^https:\/\//);
      expect(credential.recognizedBy.name.trim()).not.toBe('');
    }
  });

  it('carries every evidence link through to relatedLink, in the order filed', () => {
    const graph = buildSiteJsonLd(
      [
        project({
          id: 'a',
          blog_posts: [
            { title: 'First', url: 'https://dev.to/a/first' },
            { title: 'Second', url: 'https://dev.to/a/second' },
          ],
        }),
        project({ id: 'b', blog_posts: [] }),
      ],
      base
    );

    expect(graph.hasPart[0].relatedLink).toEqual([
      'https://dev.to/a/first',
      'https://dev.to/a/second',
    ]);
    expect(graph.hasPart[1].relatedLink).toEqual([]);
  });
});
