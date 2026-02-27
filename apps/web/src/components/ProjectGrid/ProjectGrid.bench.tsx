import { bench, describe } from 'vitest';
import { render } from '@testing-library/react';
import ProjectGrid from './ProjectGrid';
import { mockProject } from '@/test-utils/fixtures';

const mockProjects = [
  mockProject,
  { ...mockProject, id: 'bench-project-2', title: 'Bench Project 2' },
];

describe('ProjectGrid Performance', () => {
  bench(
    'render ProjectGrid',
    () => {
      render(<ProjectGrid projects={mockProjects} />);
    },
    {
      time: 100, // run for 100ms
      iterations: 10,
    }
  );
});
