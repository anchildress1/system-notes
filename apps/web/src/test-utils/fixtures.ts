import type { Project } from '@/data/projects';
import type { Hit, BaseHit } from 'instantsearch.js';

/**
 * Shared mock data factories for tests.
 * Centralizes test fixtures to reduce duplication and keep mock shapes consistent.
 */

export const mockProject: Project = {
  id: 'test-project',
  title: 'Test Project',
  description: 'Short description tagline.',
  purpose: 'The core purpose of the project.',
  longDescription: 'Long detailed description.',
  outcome: 'Great outcome.',
  tech: [{ name: 'React', role: 'Frontend' }],
  repoUrl: 'https://github.com/test/test-project',
  owner: 'anchildress1',
  status: 'Active',
  imageUrl: '/test-image.jpg',
};

export interface FactHitRecord extends BaseHit {
  objectID: string;
  title: string;
  blurb: string;
  fact: string;
  content?: string;
  url?: string;
  tags: string[];
  projects: string[];
  category: string;
  signal: number;
  'tags.lvl0'?: string[];
  'tags.lvl1'?: string[];
}

export const createMockHit = (overrides: Partial<FactHitRecord> = {}): Hit<FactHitRecord> =>
  ({
    objectID: 'card:test:test:0001',
    title: 'Test Fact Title',
    blurb: 'This is a test blurb.',
    fact: 'This is the detailed fact content.',
    tags: ['tag-one', 'tag-two', 'tag-three'],
    projects: ['Project Alpha', 'Project Beta'],
    category: 'Work Style',
    signal: 3,
    __position: 1,
    __queryID: 'test-query',
    ...overrides,
  }) as Hit<FactHitRecord>;
