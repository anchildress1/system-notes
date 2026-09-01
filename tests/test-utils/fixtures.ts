import type { Project } from '@/lib/api';
import type { Hit } from 'instantsearch.js';
import type { FactHitRecord } from '@/types/algolia';

export const mockProject: Project = {
  id: 'test-project',
  title: 'Test Project',
  status: 'Active',
  description: 'Short description tagline.',
  tech: [{ name: 'React', role: 'Frontend' }],
  repo_url: 'https://github.com/test/test-project',
  image_url: '/test-image.jpg',
  blog_posts: [],
  announcements: [],
  order_rank: 1,
};

export type { FactHitRecord } from '@/types/algolia';

export const createMockHit = (overrides: Partial<FactHitRecord> = {}): Hit<FactHitRecord> => ({
  objectID: 'card:test:test:0001',
  title: 'Test Fact Title',
  blurb: 'This is a test blurb.',
  fact: 'This is the detailed fact content.',
  'tags.lvl0': ['Engineering'],
  'tags.lvl1': ['Engineering > Frontend', 'Engineering > TypeScript'],
  projects: ['Project Alpha', 'Project Beta'],
  category: 'Work Style',
  __position: 1,
  __queryID: 'test-query',
  ...overrides,
});
