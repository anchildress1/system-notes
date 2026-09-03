import { describe, expect, it } from 'vitest';
import rawProjects from '@/data/projects.json';
import { citesKnownProject, PROJECT_NAMES } from '@/lib/systemIds';

describe('PROJECT_NAMES', () => {
  it('matches every project name in projects.json', () => {
    // The list is copied rather than imported so the front page does not ship
    // the whole project file. This is the check that keeps the copy honest.
    const actual = (rawProjects as { name: string }[]).map((project) => project.name);

    expect([...PROJECT_NAMES]).toEqual(actual);
  });
});

describe('citesKnownProject', () => {
  it('follows a notes link naming a project on file', () => {
    expect(citesKnownProject('https://anchildress1.dev/notes?project=Vestige')).toBe(true);
  });

  it('refuses a project link naming a system that does not exist', () => {
    expect(citesKnownProject('https://anchildress1.dev/notes?project=Ghost+System')).toBe(false);
  });

  it('refuses an id that only differs by case or encoded whitespace', () => {
    // A raw trailing space is stripped by url parsing, which is normalization
    // rather than a bad citation. An encoded one survives and must not match.
    for (const name of ['vestige', 'VESTIGE', 'Vestige%20']) {
      expect(citesKnownProject(`https://anchildress1.dev/notes?project=${name}`), name).toBe(false);
    }
  });

  it('leaves links that are not project links alone', () => {
    for (const href of [
      'https://dev.to/anchildress1/some-post',
      'https://anchildress1.dev/notes/abc',
      'https://anchildress1.dev/projects',
    ]) {
      expect(citesKnownProject(href), href).toBe(true);
    }
  });

  it('handles a root-relative notes filter', () => {
    expect(citesKnownProject('/notes?project=Save+the+Sun')).toBe(true);
    expect(citesKnownProject('/notes?project=nope')).toBe(false);
  });

  it('refuses a url it cannot parse', () => {
    expect(citesKnownProject('http://[')).toBe(false);
  });
});
