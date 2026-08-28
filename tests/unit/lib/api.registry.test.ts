import { describe, expect, it } from 'vitest';
import { getProjects } from '@/lib/api';

describe('the shipped project registry', () => {
  it('loads every entry with safe evidence links and a deterministic order', () => {
    const projects = getProjects();

    expect(projects).not.toHaveLength(0);
    expect(new Set(projects.map((project) => project.id)).size).toBe(projects.length);
    expect(projects.map((project) => project.order_rank)).toEqual(
      [...projects.map((project) => project.order_rank)].sort((left, right) => left - right)
    );
    expect(projects.every((project) => project.tech.length > 0)).toBe(true);
  });
});
