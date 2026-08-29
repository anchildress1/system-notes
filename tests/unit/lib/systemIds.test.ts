import { describe, expect, it } from 'vitest';
import rawProjects from '@/data/projects.json';
import { citesKnownSystem, SYSTEM_IDS } from '@/lib/systemIds';

describe('SYSTEM_IDS', () => {
  it('matches every id in projects.json', () => {
    // The list is copied rather than imported so the front page does not ship
    // the whole project file. This is the check that keeps the copy honest.
    const actual = (rawProjects as { objectID: string }[]).map((project) => project.objectID);

    expect([...SYSTEM_IDS]).toEqual(actual);
  });
});

describe('citesKnownSystem', () => {
  it('follows a project link naming a system on file', () => {
    expect(citesKnownSystem('https://anchildress1.dev/projects?system=vestige')).toBe(true);
  });

  it('refuses a project link naming a system that does not exist', () => {
    // The directory falls back to the first system for an unknown id, so an
    // invented citation would otherwise open a real page for the wrong project.
    expect(citesKnownSystem('https://anchildress1.dev/projects?system=ghost-system')).toBe(false);
  });

  it('refuses an id that only differs by case or encoded whitespace', () => {
    // A raw trailing space is stripped by url parsing, which is normalization
    // rather than a bad citation. An encoded one survives and must not match.
    for (const id of ['Vestige', 'VESTIGE', 'vestige%20']) {
      expect(citesKnownSystem(`https://anchildress1.dev/projects?system=${id}`), id).toBe(false);
    }
  });

  it('leaves links that are not project links alone', () => {
    for (const href of [
      'https://dev.to/anchildress1/some-post',
      'https://anchildress1.dev/notes/abc',
      'https://anchildress1.dev/projects',
    ]) {
      expect(citesKnownSystem(href), href).toBe(true);
    }
  });

  it('handles a root-relative project link', () => {
    expect(citesKnownSystem('/projects?system=save-the-sun')).toBe(true);
    expect(citesKnownSystem('/projects?system=nope')).toBe(false);
  });

  it('refuses a url it cannot parse', () => {
    expect(citesKnownSystem('http://[')).toBe(false);
  });
});
