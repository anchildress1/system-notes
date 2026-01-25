const projects = require('./projects.json');

describe('projects.json data shape', () => {
  it('should have exactly 9 project records', () => {
    expect(projects).toHaveLength(9);
  });

  it('should have valid app_url for all projects', () => {
    projects.forEach((project) => {
      expect(project.app_url).toBeDefined();
      expect(project.app_url).toMatch(/^https:\/\/anchildress1\.dev\/#project=.+$/);
    });
  });

  it('should have app_url matching slug pattern', () => {
    projects.forEach((project) => {
      const expectedUrl = `https://anchildress1.dev/#project=${project.slug}`;
      expect(project.app_url).toBe(expectedUrl);
    });
  });

  it('should have valid GitHub url for all projects', () => {
    projects.forEach((project) => {
      expect(project.url).toBeDefined();
      expect(project.url).toMatch(/^https:\/\/github\.com\/.+\/.+$/);
    });
  });

  it('should have deterministic objectID matching slug', () => {
    projects.forEach((project) => {
      expect(project.objectID).toBe(project.slug);
    });
  });

  it('should have node_type as project', () => {
    projects.forEach((project) => {
      expect(project.node_type).toBe('project');
    });
  });

  it('should have order_rank from 1 to 9', () => {
    const ranks = projects.map((p) => p.order_rank).sort((a, b) => a - b);
    expect(ranks).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('should have unique slugs', () => {
    const slugs = projects.map((p) => p.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(projects.length);
  });

  it('should have required fields for all projects', () => {
    const requiredFields = [
      'objectID',
      'node_type',
      'url',
      'app_url',
      'repo_owner',
      'display_name',
      'title',
      'slug',
      'aliases',
      'tags',
      'updated_at',
      'status',
      'kind',
      'role',
      'order_rank',
      'summary',
      'purpose_short',
      'outcome_short',
    ];

    projects.forEach((project) => {
      requiredFields.forEach((field) => {
        expect(project[field]).toBeDefined();
      });
    });
  });
});
